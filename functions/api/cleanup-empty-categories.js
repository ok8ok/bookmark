// GET: 获取所有空分类列表
// POST: 删除所有空分类

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
    
    // 查找所有空分类（没有书签的分类）
    // 使用 LEFT JOIN 找出没有书签的分类
    const { results } = await env.DB.prepare(`
      SELECT c.id, c.name
      FROM categories c
      LEFT JOIN bookmarks b ON c.id = b.category_id
      WHERE b.id IS NULL
      ORDER BY c.name
    `).all();
    
    return new Response(JSON.stringify({ 
      success: true,
      emptyCategories: results || [],
      count: results?.length || 0
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
    
    // 查找所有空分类的 ID
    const { results } = await env.DB.prepare(`
      SELECT c.id, c.name
      FROM categories c
      LEFT JOIN bookmarks b ON c.id = b.category_id
      WHERE b.id IS NULL
    `).all();
    
    if (!results || results.length === 0) {
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
    const categoryIds = results.map(cat => cat.id);
    
    // 批量删除空分类（级联删除由数据库外键处理）
    const placeholders = categoryIds.map(() => '?').join(',');
    await env.DB.prepare(
      `DELETE FROM categories WHERE id IN (${placeholders})`
    ).bind(...categoryIds).run();
    
    return new Response(JSON.stringify({ 
      success: true,
      deletedCount: categoryIds.length,
      deletedCategories: results.map(cat => ({ id: cat.id, name: cat.name }))
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

