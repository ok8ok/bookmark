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
      'SELECT id, name, parent_id, depth FROM categories'
    ).all();
    
    const existingCategoryMap = {};
    const existingDepthMap = {};
    existingCategories.results.forEach(cat => {
      const key = cat.parent_id ? `${cat.name}|${cat.parent_id}` : cat.name;
      existingCategoryMap[key] = cat.id;
      existingDepthMap[cat.id] = typeof cat.depth === 'number' ? cat.depth : 0;
    });
    
    // 2. 批量导入分类 - 使用深度优先顺序处理嵌套结构
    const categoryMapping = {}; // 旧ID -> 新ID 的映射
    
    // 按depth排序确保父分类先创建
    const sortedCategories = [...categories].sort((a, b) => (a.depth || 0) - (b.depth || 0));
    
    for (const category of sortedCategories) {
      // 处理parent_id映射
      let newParentId = null;
      if (category.parent_id) {
        newParentId = categoryMapping[category.parent_id] || null;
        if (!newParentId) {
          console.error('Parent category not found for:', category.name, 'parent_id:', category.parent_id, 'Available mappings:', Object.keys(categoryMapping));
          skippedCategories++;
          skippedItems.push({
            type: 'category',
            name: category.name,
            reason: `父分类不存在 (parent_id: ${category.parent_id})`
          });
          continue;
        }
      }
      
      console.log(`Processing category: "${category.name}", parent_id: ${category.parent_id}, newParentId: ${newParentId}, depth: ${category.depth}`);
      
      const parentDepth = newParentId ? (existingDepthMap[newParentId] ?? 0) : 0;
      const calculatedDepth = newParentId ? parentDepth + 1 : 0;
      
      if (calculatedDepth > 5) {
        console.error(`Skipping category "${category.name}" because calculated depth ${calculatedDepth} exceeds maximum allowed.`);
        skippedCategories++;
        skippedItems.push({
          type: 'category',
          name: category.name,
          reason: '超过最大嵌套深度限制 (5)'
        });
        continue;
      }
      
      // 检查分类是否已存在（考虑parent_id）
      const lookupKey = newParentId ? `${category.name}|${newParentId}` : category.name;
      if (existingCategoryMap[lookupKey]) {
        // 分类已存在，使用现有的ID
        const existingId = existingCategoryMap[lookupKey];
        categoryMapping[category.id] = existingId;
        console.log(`Category "${category.name}" already exists with ID ${existingId}`);
        skippedCategories++;
        const existingDepth = existingDepthMap[existingId];
        const reason = newParentId 
          ? `分类已存在 (父分类: ${newParentId}, depth: ${existingDepth})`
          : '分类已存在';
        skippedItems.push({
          type: 'category',
          name: category.name,
          reason: reason
        });
        if (typeof existingDepthMap[existingId] !== 'number') {
          existingDepthMap[existingId] = calculatedDepth;
        }
      } else {
        try {
          // 创建新分类
          const position = typeof category.position === 'number' ? category.position : 0;
          const result = await env.DB.prepare(
            'INSERT INTO categories (name, position, parent_id, depth) VALUES (?, ?, ?, ?)'
          ).bind(category.name, position, newParentId, calculatedDepth).run();
          
          const newCategoryId = result.meta.last_row_id;
          categoryMapping[category.id] = newCategoryId;
          existingCategoryMap[lookupKey] = newCategoryId;
          existingDepthMap[newCategoryId] = calculatedDepth;
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
        console.error('Category mapping not found for bookmark:', bookmark.name, 'category_id:', bookmark.category_id, 'Available mappings:', Object.keys(categoryMapping).length);
        skippedBookmarks++;
        skippedItems.push({
          type: 'bookmark',
          name: bookmark.name,
          reason: `分类映射不存在 (category_id: ${bookmark.category_id})`
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

