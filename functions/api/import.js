// POST batch import bookmarks and categories
export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    const { categories, bookmarks } = await request.json();
    
    if (!categories || !bookmarks) {
      return new Response(JSON.stringify({ error: 'Invalid data format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log(`Starting import: ${categories.length} categories, ${bookmarks.length} bookmarks`);
    
    let importedCategories = 0;
    let importedBookmarks = 0;
    let skippedCategories = 0;
    let skippedBookmarks = 0;
    
    // 记录跳过的项目及原因
    const skippedItems = [];
    
    // 1. 批量获取现有分类（一次查询代替N次查询）
    const existingCategories = await env.DB.prepare(
      'SELECT id, name FROM categories'
    ).all();
    
    const existingCategoryMap = {};
    existingCategories.results.forEach(cat => {
      existingCategoryMap[cat.name] = cat.id;
    });
    
    // 2. 批量导入分类
    const categoryMapping = {}; // 旧ID -> 新ID 的映射
    
    for (const category of categories) {
      if (existingCategoryMap[category.name]) {
        // 分类已存在
        categoryMapping[category.id] = existingCategoryMap[category.name];
        skippedCategories++;
        skippedItems.push({
          type: 'category',
          name: category.name,
          reason: '分类已存在'
        });
      } else {
        try {
          // 创建新分类
          const result = await env.DB.prepare(
            'INSERT INTO categories (name, position) VALUES (?, ?)'
          ).bind(category.name, category.position || 0).run();
          
          categoryMapping[category.id] = result.meta.last_row_id;
          existingCategoryMap[category.name] = result.meta.last_row_id;
          importedCategories++;
        } catch (error) {
          console.error('Failed to import category:', category.name, error);
          skippedCategories++;
          skippedItems.push({
            type: 'category',
            name: category.name,
            reason: '导入失败: ' + error.message
          });
        }
      }
    }
    
    console.log(`Categories processed: ${importedCategories} imported, ${skippedCategories} skipped`);
    
    // 3. 批量获取现有书签URL（一次查询代替N次查询）
    const existingBookmarks = await env.DB.prepare(
      'SELECT url FROM bookmarks'
    ).all();
    
    const existingUrlSet = new Set(existingBookmarks.results.map(b => b.url));
    
    // 4. 批量获取每个分类的最大position
    const categoryPositions = {};
    const uniqueCategoryIds = [...new Set(Object.values(categoryMapping))];
    
    for (const categoryId of uniqueCategoryIds) {
      const result = await env.DB.prepare(
        'SELECT COALESCE(MAX(position), -1) as maxPos FROM bookmarks WHERE category_id = ?'
      ).bind(categoryId).first();
      categoryPositions[categoryId] = (result.maxPos || -1) + 1;
    }
    
    // 5. 准备批量插入的书签数据
    const bookmarksToInsert = [];
    
    for (const bookmark of bookmarks) {
      const newCategoryId = categoryMapping[bookmark.category_id];
      
      if (!newCategoryId) {
        console.error('Category mapping not found for bookmark:', bookmark.name, 'category_id:', bookmark.category_id);
        skippedBookmarks++;
        skippedItems.push({
          type: 'bookmark',
          name: bookmark.name,
          reason: '分类不存在'
        });
        continue;
      }
      
      // 检查书签是否已存在
      if (existingUrlSet.has(bookmark.url)) {
        skippedBookmarks++;
        skippedItems.push({
          type: 'bookmark',
          name: bookmark.name,
          reason: '书签已存在'
        });
        continue;
      }
      
      // 准备插入数据
      const position = categoryPositions[newCategoryId]++;
      bookmarksToInsert.push({
        name: bookmark.name,
        url: bookmark.url,
        description: bookmark.description || null,
        icon: bookmark.icon || null,
        category_id: newCategoryId,
        position: position,
        is_private: bookmark.is_private || 0
      });
    }
    
    console.log(`Prepared ${bookmarksToInsert.length} bookmarks for insertion`);
    
    // 6. 批量插入书签 - 每次最多100条
    const batchSize = 100;
    for (let i = 0; i < bookmarksToInsert.length; i += batchSize) {
      const batch = bookmarksToInsert.slice(i, i + batchSize);
      
      try {
        // 构建批量插入SQL
        const placeholders = batch.map(() => '(?, ?, ?, ?, ?, ?, ?)').join(', ');
        const values = batch.flatMap(b => [
          b.name, b.url, b.description, b.icon, b.category_id, b.position, b.is_private
        ]);
        
        await env.DB.prepare(
          `INSERT INTO bookmarks (name, url, description, icon, category_id, position, is_private) 
           VALUES ${placeholders}`
        ).bind(...values).run();
        
        importedBookmarks += batch.length;
        console.log(`Batch ${Math.floor(i / batchSize) + 1}: Imported ${batch.length} bookmarks`);
      } catch (error) {
        console.error('Batch insert failed, falling back to individual inserts:', error);
        // 如果批量插入失败，尝试逐个插入该批次
        for (const bookmark of batch) {
          try {
            await env.DB.prepare(
              'INSERT INTO bookmarks (name, url, description, icon, category_id, position, is_private) VALUES (?, ?, ?, ?, ?, ?, ?)'
            ).bind(
              bookmark.name, bookmark.url, bookmark.description, bookmark.icon,
              bookmark.category_id, bookmark.position, bookmark.is_private
            ).run();
            importedBookmarks++;
          } catch (err) {
            console.error('Failed to import bookmark:', bookmark.name, err);
            skippedBookmarks++;
            skippedItems.push({
              type: 'bookmark',
              name: bookmark.name,
              reason: '导入失败: ' + err.message
            });
          }
        }
      }
    }
    
    console.log(`Import completed: ${importedBookmarks} bookmarks imported, ${skippedBookmarks} skipped`);
    
    return new Response(JSON.stringify({
      success: true,
      imported: {
        categories: importedCategories,
        bookmarks: importedBookmarks
      },
      skipped: {
        categories: skippedCategories,
        bookmarks: skippedBookmarks
      },
      details: {
        skippedItems: skippedItems
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Import error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: 'Import failed: ' + error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

