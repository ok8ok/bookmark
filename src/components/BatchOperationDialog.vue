<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="show" class="dialog-overlay" @click="close">
        <div class="dialog-box batch-operation-dialog" @click.stop>
          <h3 class="dialog-title">{{ title }}</h3>
          
          <div v-if="operationType === 'move'" class="form-group">
            <label>选择目标分类</label>
            <select v-model="selectedCategoryId">
              <option value="">请选择分类</option>
              <option v-for="cat in categoryOptions" :key="cat.id" :value="cat.id">
                {{ cat.displayName }}
              </option>
            </select>
          </div>
          
          <div v-else-if="operationType === 'edit'" class="form-group">
            <label>选择属性</label>
            <div class="radio-group">
              <label class="radio-label">
                <input v-model="privateOption" type="radio" value="private" name="privacy">
                <span>设为私密</span>
              </label>
              <label class="radio-label">
                <input v-model="privateOption" type="radio" value="public" name="privacy">
                <span>设为公开</span>
              </label>
            </div>
          </div>
          
          <div v-else-if="operationType === 'delete'" class="warning-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <p>确定要删除选中的 <strong>{{ count }}</strong> 个书签吗？此操作不可恢复！</p>
          </div>
          
          <div v-else-if="operationType === 'delete-categories'" class="warning-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <p>确定要删除选中的 <strong>{{ count }}</strong> 个分类吗？</p>
            <p style="margin-top: 0.5rem; font-size: 0.85rem;">
              这将同时删除这些分类下的所有书签，此操作不可恢复！
            </p>
          </div>
          
          <div class="dialog-buttons">
            <button class="btn btn-secondary" @click="close">取消</button>
            <button 
              class="btn" 
              :class="(operationType === 'delete' || operationType === 'delete-categories') ? 'btn-danger' : 'btn-primary'"
              @click="handleConfirm"
              :disabled="isDisabled"
            >
              确定
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
import { buildCategoryTree, getCategoryPath } from '../utils/categoryTree'

const { categories } = useBookmarks()

const show = ref(false)
const operationType = ref('')
const title = ref('')
const count = ref(0)
const selectedCategoryId = ref('')
const privateOption = ref('private')
let resolvePromise = null

const categoryOptions = computed(() => {
  if (!categories.value.length) {
    return []
  }
  const { flatList, map } = buildCategoryTree(categories.value)
  return flatList.map(cat => ({
    id: cat.id,
    displayName: getCategoryPath(cat.id, map).map(item => item.name).join('/')
  }))
})

const isDisabled = computed(() => {
  if (operationType.value === 'move') {
    return !selectedCategoryId.value
  }
  return false
})

const open = (type, selectedCount) => {
  operationType.value = type
  count.value = selectedCount
  selectedCategoryId.value = ''
  privateOption.value = 'private'
  
  switch (type) {
    case 'move':
      title.value = '批量移动分类'
      break
    case 'edit':
      title.value = '批量编辑属性'
      break
    case 'delete':
      title.value = '批量删除确认'
      break
    case 'delete-categories':
      title.value = '批量删除分类确认'
      break
  }
  
  show.value = true
  
  return new Promise((resolve) => {
    resolvePromise = resolve
  })
}

const close = () => {
  show.value = false
  if (resolvePromise) resolvePromise(null)
}

const handleConfirm = () => {
  let result = null
  
  if (operationType.value === 'move') {
    result = { categoryId: selectedCategoryId.value }
  } else if (operationType.value === 'edit') {
    result = { isPrivate: privateOption.value === 'private' }
  } else if (operationType.value === 'delete') {
    result = { confirmed: true }
  } else if (operationType.value === 'delete-categories') {
    result = { confirmed: true }
  }
  
  show.value = false
  if (resolvePromise) resolvePromise(result)
}

defineExpose({
  open,
  close
})
</script>

<style scoped>
.batch-operation-dialog {
  max-width: 480px;
}

.radio-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0.5rem;
  background: var(--bg-secondary);
  border-radius: var(--radius-sm);
  border: 2px solid var(--border);
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: var(--radius-sm);
  transition: var(--transition);
}

.radio-label:hover {
  background: var(--bg-hover);
}

.radio-label input[type="radio"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.radio-label span {
  font-size: 0.95rem;
  color: var(--text);
}

.warning-box {
  background: rgba(239, 68, 68, 0.1);
  border: 2px solid var(--error);
  border-radius: var(--radius);
  padding: 1rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.warning-box svg {
  width: 24px;
  height: 24px;
  color: var(--error);
  flex-shrink: 0;
  margin-top: 0.125rem;
  stroke-width: 2;
}

.warning-box p {
  color: var(--text);
  font-size: 0.95rem;
  line-height: 1.5;
}

.warning-box strong {
  color: var(--error);
  font-weight: 600;
}

.btn-danger {
  background: var(--error);
  color: white;
  border: none;
}

.btn-danger:hover:not(:disabled) {
  background: #dc2626;
  transform: translateY(-1px);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 480px) {
  .batch-operation-dialog {
    max-width: 95%;
  }
}
</style>
