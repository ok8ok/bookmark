// GET: 获取所有空分类列表
// POST: 删除所有空分类

// 递归获取分类的所有后代ID
function getDescendantIds(categoryId, categoriesMap) {
  const descendants = [];
  const category = categoriesMap.get(categoryId);
  
  if (!category || !category.children) {
    return descendants;
  }
  
  category.children.forEach(childId => {
    descendants.push(childId);
    descendants.push(...getDescendantIds(childId, categoriesMap));
  });
  
  return descendants;
}

// 检查分类及其所有子分类是否都没有书签
function isCategoryTreeEmpty(categoryId, categoriesMap, bookmarksByCategoryId) {
  // 检查当前分类是否有书签
  if (bookmarksByCategoryId.has(categoryId) && bookmarksByCategoryId.get(categoryId) > 0) {
    return false;
  }
  
  // 检查所有子分类
  const descendantIds = getDescendantIds(categoryId, categoriesMap);
  for (const descId of descendantIds) {
    if (bookmarksByCategoryId.has(descId) && bookmarksByCategoryId.get(descId) > 0) {
      return false;
    }
  }
  
  return true;
}

export async function onRequestGet(context) {
  const { env, request } = context;
  
  try {
    // 检查是否已登录
    const authHeader = request.headers.get('Authorization');
    const isAuthenticated = authHeader && authHeader.startsWith('Bearer ');
    
    if (!isAuthenticated) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 获取所有分类
    const { results: allCategories } = await env.DB.prepare(`
      SELECT id, name, parent_id
      FROM categories
      ORDER BY name
    `).all();
    
    // 获取每个分类的书签数量
    const { results: bookmarkCounts } = await env.DB.prepare(`
      SELECT category_id, COUNT(*) as count
      FROM bookmarks
      GROUP BY category_id
    `).all();
    
    // 构建分类映射和书签数量映射
    const categoriesMap = new Map();
    allCategories.forEach(cat => {
      categoriesMap.set(cat.id, { ...cat, children: [] });
    });
    
    // 构建父子关系
    allCategories.forEach(cat => {
      if (cat.parent_id && categoriesMap.has(cat.parent_id)) {
        categoriesMap.get(cat.parent_id).children.push(cat.id);
      }
    });
    
    const bookmarksByCategoryId = new Map();
    bookmarkCounts.forEach(bc => {
      bookmarksByCategoryId.set(bc.category_id, bc.count);
    });
    
    // 找出真正的空分类（本身和所有子分类都没有书签）
    const emptyCategories = allCategories.filter(cat => 
      isCategoryTreeEmpty(cat.id, categoriesMap, bookmarksByCategoryId)
    );
    
    return new Response(JSON.stringify({ 
      success: true,
      emptyCategories: emptyCategories.map(cat => ({ id: cat.id, name: cat.name })),
      count: emptyCategories.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Get empty categories error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch empty categories' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestPost(context) {
  const { env, request } = context;
  
  try {
    // 检查是否已登录
    const authHeader = request.headers.get('Authorization');
    const isAuthenticated = authHeader && authHeader.startsWith('Bearer ');
    
    if (!isAuthenticated) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 获取所有分类
    const { results: allCategories } = await env.DB.prepare(`
      SELECT id, name, parent_id
      FROM categories
    `).all();
    
    // 获取每个分类的书签数量
    const { results: bookmarkCounts } = await env.DB.prepare(`
      SELECT category_id, COUNT(*) as count
      FROM bookmarks
      GROUP BY category_id
    `).all();
    
    // 构建分类映射和书签数量映射
    const categoriesMap = new Map();
    allCategories.forEach(cat => {
      categoriesMap.set(cat.id, { ...cat, children: [] });
    });
    
    // 构建父子关系
    allCategories.forEach(cat => {
      if (cat.parent_id && categoriesMap.has(cat.parent_id)) {
        categoriesMap.get(cat.parent_id).children.push(cat.id);
      }
    });
    
    const bookmarksByCategoryId = new Map();
    bookmarkCounts.forEach(bc => {
      bookmarksByCategoryId.set(bc.category_id, bc.count);
    });
    
    // 找出真正的空分类（本身和所有子分类都没有书签）
    const emptyCategories = allCategories.filter(cat => 
      isCategoryTreeEmpty(cat.id, categoriesMap, bookmarksByCategoryId)
    );
    
    if (emptyCategories.length === 0) {
      return new Response(JSON.stringify({ 
        success: true,
        deletedCount: 0,
        message: '没有空分类需要清理'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 提取分类 ID
    const categoryIds = emptyCategories.map(cat => cat.id);
    
    // 批量删除空分类（级联删除由数据库外键处理）
    const placeholders = categoryIds.map(() => '?').join(',');
    await env.DB.prepare(
      `DELETE FROM categories WHERE id IN (${placeholders})`
    ).bind(...categoryIds).run();
    
    return new Response(JSON.stringify({ 
      success: true,
      deletedCount: categoryIds.length,
      deletedCategories: emptyCategories.map(cat => ({ id: cat.id, name: cat.name }))
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Cleanup empty categories error:', error);
    return new Response(JSON.stringify({ error: 'Failed to cleanup empty categories' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

