/**
 * 构建分类树结构
 * @param {Array} categories - 扁平的分类数组
 * @returns {Object} - { tree: 根分类数组, map: ID到分类的映射, flatList: 按树状顺序的扁平列表 }
 */
export function buildCategoryTree(categories) {
  if (!categories || categories.length === 0) {
    return { tree: [], map: {}, flatList: [] }
  }

  // 创建分类映射和添加children数组
  const categoryMap = {}
  const categoriesWithChildren = categories.map(cat => ({
    ...cat,
    children: []
  }))

  categoriesWithChildren.forEach(cat => {
    categoryMap[cat.id] = cat
  })

  // 构建树结构
  const rootCategories = []
  categoriesWithChildren.forEach(cat => {
    if (cat.parent_id && categoryMap[cat.parent_id]) {
      categoryMap[cat.parent_id].children.push(cat)
    } else {
      rootCategories.push(cat)
    }
  })

  // 对每一层按position排序
  const sortByPosition = (items) => {
    items.sort((a, b) => a.position - b.position)
    items.forEach(item => {
      if (item.children && item.children.length > 0) {
        sortByPosition(item.children)
      }
    })
  }
  sortByPosition(rootCategories)

  // 生成扁平列表（按树的深度优先顺序）
  const flatList = []
  const traverse = (categories) => {
    categories.forEach(cat => {
      flatList.push(cat)
      if (cat.children && cat.children.length > 0) {
        traverse(cat.children)
      }
    })
  }
  traverse(rootCategories)

  return { tree: rootCategories, map: categoryMap, flatList }
}

/**
 * 获取分类的完整路径（包括所有父分类）
 * @param {Number} categoryId - 分类ID
 * @param {Object} categoryMap - ID到分类的映射
 * @returns {Array} - 从根到当前分类的路径数组
 */
export function getCategoryPath(categoryId, categoryMap) {
  const path = []
  let current = categoryMap[categoryId]

  while (current) {
    path.unshift(current)
    current = current.parent_id ? categoryMap[current.parent_id] : null
  }

  return path
}

/**
 * 获取分类的所有后代ID
 * @param {Number} categoryId - 分类ID
 * @param {Object} categoryMap - ID到分类的映射
 * @returns {Array} - 所有后代分类的ID数组
 */
export function getDescendantIds(categoryId, categoryMap) {
  const descendants = []
  const category = categoryMap[categoryId]

  if (!category || !category.children) {
    return descendants
  }

  const traverse = (children) => {
    children.forEach(child => {
      descendants.push(child.id)
      if (child.children && child.children.length > 0) {
        traverse(child.children)
      }
    })
  }

  traverse(category.children)
  return descendants
}

/**
 * 检查是否可以将分类移动到目标父分类
 * @param {Number} categoryId - 要移动的分类ID
 * @param {Number|null} targetParentId - 目标父分类ID
 * @param {Object} categoryMap - ID到分类的映射
 * @returns {Object} - { valid: boolean, reason: string }
 */
export function canMoveCategory(categoryId, targetParentId, categoryMap) {
  if (categoryId === targetParentId) {
    return { valid: false, reason: '分类不能成为自己的父分类' }
  }

  if (!targetParentId) {
    return { valid: true }
  }

  // 检查目标是否是当前分类的后代
  const descendants = getDescendantIds(categoryId, categoryMap)
  if (descendants.includes(targetParentId)) {
    return { valid: false, reason: '不能将分类移动到自己的子分类下' }
  }

  // 检查深度限制
  const targetCategory = categoryMap[targetParentId]
  if (targetCategory && targetCategory.depth >= 5) {
    return { valid: false, reason: '超过最大嵌套深度（5层）' }
  }

  return { valid: true }
}

/**
 * 计算分类在新父分类下的深度
 * @param {Number|null} parentId - 父分类ID
 * @param {Object} categoryMap - ID到分类的映射
 * @returns {Number} - 新的深度
 */
export function calculateDepth(parentId, categoryMap) {
  if (!parentId) return 0
  const parent = categoryMap[parentId]
  return parent ? parent.depth + 1 : 0
}
