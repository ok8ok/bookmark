// POST batch operations
export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    const { operation, bookmarkIds, categoryIds, data } = await request.json();
    
    switch (operation) {
      case 'delete':
        // Batch delete bookmarks
        if (!bookmarkIds || !Array.isArray(bookmarkIds) || bookmarkIds.length === 0) {
          return new Response(JSON.stringify({ error: 'Invalid bookmark IDs' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        // Normalize and validate IDs (allow numeric strings)
        const normalizedIds = Array.from(new Set(
          bookmarkIds
            .map(id => (typeof id === 'number' ? id : Number.parseInt(id, 10)))
            .filter(id => Number.isInteger(id) && id > 0)
        ));
        
        if (normalizedIds.length === 0) {
          return new Response(JSON.stringify({ error: 'No valid bookmark IDs provided' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        // Process in smaller batches to avoid SQL parameter limits
        const batchSize = 100;
        for (let i = 0; i < normalizedIds.length; i += batchSize) {
          const batch = normalizedIds.slice(i, i + batchSize);
          const placeholders = batch.map(() => '?').join(',');
          try {
            await env.DB.prepare(
              `DELETE FROM bookmarks WHERE id IN (${placeholders})`
            ).bind(...batch).run();
          } catch (error) {
            console.error('Batch delete error:', error);
            return new Response(JSON.stringify({ 
              error: `Failed to delete bookmarks: ${error.message}`,
              details: { batch: i / batchSize + 1, totalBatches: Math.ceil(normalizedIds.length / batchSize) }
            }), {
              status: 500,
              headers: { 'Content-Type': 'application/json' }
            });
          }
        }
        break;
        
      case 'delete-categories':
        // Batch delete categories (cascade delete bookmarks)
        if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) {
          return new Response(JSON.stringify({ error: 'Invalid category IDs' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        const categoryPlaceholders = categoryIds.map(() => '?').join(',');
        await env.DB.prepare(
          `DELETE FROM categories WHERE id IN (${categoryPlaceholders})`
        ).bind(...categoryIds).run();
        break;
        
      case 'move':
        // Batch move to category
        if (!bookmarkIds || !Array.isArray(bookmarkIds) || bookmarkIds.length === 0) {
          return new Response(JSON.stringify({ error: 'Invalid bookmark IDs' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        if (!data || !data.categoryId) {
          return new Response(JSON.stringify({ error: 'Category ID required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        // Get the max position in the target category
        const maxPositionResult = await env.DB.prepare(
          'SELECT COALESCE(MAX(position), -1) as max_pos FROM bookmarks WHERE category_id = ?'
        ).bind(data.categoryId).first();
        
        let nextPosition = (maxPositionResult?.max_pos ?? -1) + 1;
        
        // Update each bookmark
        for (const bookmarkId of bookmarkIds) {
          await env.DB.prepare(
            'UPDATE bookmarks SET category_id = ?, position = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
          ).bind(data.categoryId, nextPosition++, bookmarkId).run();
        }
        break;
        
      case 'edit':
        // Batch edit properties (privacy)
        if (!bookmarkIds || !Array.isArray(bookmarkIds) || bookmarkIds.length === 0) {
          return new Response(JSON.stringify({ error: 'Invalid bookmark IDs' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        if (data && typeof data.isPrivate !== 'undefined') {
          const isPrivate = data.isPrivate ? 1 : 0;
          const placeholders = bookmarkIds.map(() => '?').join(',');
          await env.DB.prepare(
            `UPDATE bookmarks SET is_private = ?, updated_at = CURRENT_TIMESTAMP WHERE id IN (${placeholders})`
          ).bind(isPrivate, ...bookmarkIds).run();
        }
        break;
        
      default:
        return new Response(JSON.stringify({ error: 'Invalid operation' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
    }
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Batch operation error:', error);
    return new Response(JSON.stringify({ error: 'Failed to perform batch operation' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
