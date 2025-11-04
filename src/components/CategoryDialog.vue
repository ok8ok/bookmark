<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="show" class="dialog-overlay" @click="close">
        <div class="dialog-box category-dialog" @click.stop>
          <h3 class="dialog-title">{{ isEdit ? '编辑分类' : '新建分类' }}</h3>
          
          <div class="form-group">
            <label>分类名称 *</label>
            <input 
              v-model="form.name" 
              type="text" 
              placeholder="请输入分类名称"
              @keyup.enter="handleSubmit"
            >
          </div>
          
          <div class="form-group">
            <label>分类类型</label>
            <div class="radio-group">
              <label class="radio-label">
                <input v-model="categoryType" type="radio" value="main" name="type">
                <span>主分类</span>
              </label>
              <label class="radio-label">
                <input v-model="categoryType" type="radio" value="sub" name="type">
                <span>子分类</span>
              </label>
            </div>
          </div>
          
          <div v-if="categoryType === 'sub'" class="form-group">
            <label>父分类 *</label>
            <select v-model="form.parent_id">
              <option value="">请选择父分类</option>
              <option 
                v-for="cat in availableParentCategories" 
                :key="cat.id" 
                :value="cat.id"
                :disabled="cat.disabled"
              >
                {{ cat.displayName }}{{ cat.disabledReason ? ` (${cat.disabledReason})` : '' }}
              </option>
            </select>
          </div>
          
          <div v-if="form.parent_id && categoryType === 'sub'" class="preview-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <div class="preview-content">
              <div class="preview-label">{{ isEdit ? '将移动到：' : '将创建路径：' }}</div>
              <div class="preview-path">{{ previewPath }}</div>
            </div>
          </div>
          
          <p v-if="error" class="error-message">{{ error }}</p>
          
          <div class="dialog-buttons">
            <button class="btn btn-secondary" @click="close">取消</button>
            <button class="btn btn-primary" @click="handleSubmit">
              {{ isEdit ? '更新' : '创建' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useBookmarks } from '../composables/useBookmarks'
import { buildCategoryTree, getCategoryPath, getDescendantIds } from '../utils/categoryTree'

const { categories, addCategory, updateCategory } = useBookmarks()

const show = ref(false)
const isEdit = ref(false)
const editId = ref(null)
const error = ref('')
const categoryType = ref('main')

const form = ref({
  name: '',
  parent_id: ''
})

// 可用的父分类列表
const availableParentCategories = computed(() => {
  if (!categories.value.length) {
    return []
  }
  const { flatList, map } = buildCategoryTree(categories.value)
  
  // 在编辑模式下，需要排除当前分类及其所有子分类
  let excludeIds = []
  if (isEdit.value && editId.value) {
    excludeIds = [editId.value, ...getDescendantIds(editId.value, map)]
  }
  
  return flatList
    .filter(cat => !excludeIds.includes(cat.id))
    .map(cat => {
      const displayName = getCategoryPath(cat.id, map).map(item => item.name).join('/')
      
      // 检查是否可以作为父分类
      let disabled = false
      let disabledReason = ''
      
      // 深度限制：父分类深度>=4时，子分类会达到深度5（最大限制）
      if (cat.depth >= 4) {
        disabled = true
        disabledReason = '已达最大深度'
      }
      
      return {
        id: cat.id,
        displayName,
        depth: cat.depth,
        disabled,
        disabledReason
      }
    })
})

// 预览将创建的完整路径
const previewPath = computed(() => {
  if (!form.value.parent_id || !form.value.name) {
    return form.value.name || '未命名分类'
  }
  
  const parent = availableParentCategories.value.find(c => c.id === form.value.parent_id)
  if (!parent) return form.value.name
  
  return `${parent.displayName}/${form.value.name}`
})

const open = (category = null, presetParentId = null) => {
  if (category) {
    // 编辑模式
    isEdit.value = true
    editId.value = category.id
    form.value = {
      name: category.name,
      parent_id: category.parent_id || ''
    }
    categoryType.value = category.parent_id ? 'sub' : 'main'
  } else {
    // 新建模式
    isEdit.value = false
    editId.value = null
    form.value = {
      name: '',
      parent_id: presetParentId || ''
    }
    categoryType.value = presetParentId ? 'sub' : 'main'
  }
  
  error.value = ''
  show.value = true
  
  return new Promise((resolve) => {
    resolvePromise = resolve
  })
}

const close = () => {
  show.value = false
  if (resolvePromise) resolvePromise(null)
}

let resolvePromise = null

const handleSubmit = async () => {
  if (!form.value.name.trim()) {
    error.value = '请输入分类名称'
    return
  }
  
  // 如果是子分类，必须选择父分类
  if (categoryType.value === 'sub' && !form.value.parent_id) {
    error.value = '请选择父分类'
    return
  }
  
  const parentId = categoryType.value === 'main' ? null : (form.value.parent_id || null)
  
  let result
  if (isEdit.value) {
    // 编辑分类时更新名称和父分类
    result = await updateCategory(editId.value, form.value.name.trim(), parentId)
  } else {
    // 新建分类
    result = await addCategory(form.value.name.trim(), parentId)
  }
  
  if (result.success) {
    show.value = false
    if (resolvePromise) resolvePromise(result)
  } else {
    error.value = result.error || '操作失败'
  }
}

defineExpose({
  open,
  close
})
</script>

<style scoped>
.category-dialog {
  max-width: 480px;
}

.radio-group {
  display: flex;
  gap: 1rem;
  padding: 0.75rem;
  background: var(--bg-secondary);
  border-radius: var(--radius-sm);
  border: 2px solid var(--border);
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.5rem 0.75rem;
  border-radius: var(--radius-sm);
  transition: var(--transition);
  flex: 1;
  justify-content: center;
}

.radio-label:hover {
  background: var(--bg-hover);
}

.radio-label input[type="radio"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--primary);
}

.radio-label span {
  font-size: 0.95rem;
  color: var(--text);
  font-weight: 500;
}

.preview-box {
  background: rgba(99, 102, 241, 0.05);
  border: 2px solid var(--primary);
  border-radius: var(--radius);
  padding: 1rem;
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
}

html.dark .preview-box {
  background: rgba(99, 102, 241, 0.1);
}

.preview-box svg {
  width: 20px;
  height: 20px;
  color: var(--primary);
  flex-shrink: 0;
  stroke-width: 2;
  margin-top: 0.125rem;
}

.preview-content {
  flex: 1;
  min-width: 0;
}

.preview-label {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-bottom: 0.25rem;
}

.preview-path {
  font-size: 0.95rem;
  color: var(--primary);
  font-weight: 600;
  word-break: break-all;
}

option:disabled {
  color: var(--text-secondary);
  font-style: italic;
}

@media (max-width: 480px) {
  .category-dialog {
    max-width: 95%;
  }
  
  .radio-group {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .radio-label {
    justify-content: flex-start;
  }
}
</style>

