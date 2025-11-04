<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="show" class="dialog-overlay" @click="close">
        <div class="dialog-box bookmark-dialog" @click.stop>
          <h3 class="dialog-title">{{ isEdit ? '编辑书签' : '添加书签' }}</h3>
          
          <div class="form-group">
            <label>名称 *</label>
            <input v-model="form.name" type="text" placeholder="请输入名称">
          </div>
          
          <div class="form-group">
            <label>URL *</label>
            <div class="url-input-group">
              <input v-model="form.url" type="text" placeholder="https://example.com">
              <button 
                type="button"
                class="fetch-btn" 
                :disabled="!form.url || fetching"
                @click="fetchMetadata"
              >
                <svg v-if="!fetching" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/>
                  <path d="M21 3v5h-5"/>
                </svg>
                <div v-else class="mini-spinner"></div>
                {{ fetching ? '获取中...' : '自动获取' }}
              </button>
            </div>
          </div>
          
          <div class="form-group">
            <label>描述</label>
            <input v-model="form.description" type="text" placeholder="可选">
          </div>
          
          <div class="form-group">
            <label>图标URL</label>
            <input v-model="form.icon" type="text" placeholder="可选，留空自动获取">
          </div>
          
          <div class="form-group">
            <label>分类 *</label>
            <select v-model="form.category_id">
              <option value="">请选择分类</option>
              <option v-for="cat in categoryOptions" :key="cat.id" :value="cat.id">
                {{ cat.displayName }}
              </option>
            </select>
          </div>
          
          <div class="form-group checkbox-group">
            <label class="checkbox-label">
              <input v-model="form.is_private" type="checkbox">
              <span class="checkbox-text">
                <svg class="lock-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                私密书签
              </span>
              <span class="checkbox-description">仅登录后可见</span>
            </label>
          </div>
          
          <p v-if="error" class="error-message">{{ error }}</p>
          
          <div class="dialog-buttons">
            <button class="btn btn-secondary" @click="close">取消</button>
            <button class="btn btn-primary" @click="handleSubmit">
              {{ isEdit ? '更新' : '添加' }}
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
import { useToast } from '../composables/useToast'
import { buildCategoryTree, getCategoryPath } from '../utils/categoryTree'

const { categories, addBookmark, updateBookmark } = useBookmarks()
const { success: toastSuccess, error: toastError } = useToast()

const show = ref(false)
const isEdit = ref(false)
const editId = ref(null)
const error = ref('')
const fetching = ref(false)

const form = ref({
  name: '',
  url: '',
  description: '',
  icon: '',
  category_id: '',
  is_private: false
})

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

const open = (bookmark = null, options = {}) => {
  if (bookmark) {
    isEdit.value = true
    editId.value = bookmark.id
    form.value = {
      name: bookmark.name,
      url: bookmark.url,
      description: bookmark.description || '',
      icon: bookmark.icon || '',
      category_id: bookmark.category_id,
      is_private: !!bookmark.is_private
    }
  } else {
    isEdit.value = false
    editId.value = null
    const presetCategoryId = options.categoryId ?? categories.value[0]?.id ?? ''
    form.value = {
      name: '',
      url: '',
      description: '',
      icon: '',
      category_id: presetCategoryId,
      is_private: false
    }
  }
  
  error.value = ''
  show.value = true
}

const close = () => {
  show.value = false
}

const fetchMetadata = async () => {
  if (!form.value.url) {
    toastError('请先输入URL')
    return
  }
  
  // 验证URL格式
  try {
    new URL(form.value.url)
  } catch {
    toastError('URL格式不正确')
    return
  }
  
  fetching.value = true
  error.value = ''
  
  try {
    const response = await fetch(`/api/fetch-metadata?url=${encodeURIComponent(form.value.url)}`)
    const data = await response.json()
    
    if (data.success) {
      if (data.title && !form.value.name) {
        form.value.name = data.title
      }
      if (data.description && !form.value.description) {
        form.value.description = data.description
      }
      toastSuccess('信息获取成功')
    } else {
      toastError(data.error || '获取失败')
    }
  } catch (err) {
    toastError('网络错误，请手动输入')
  } finally {
    fetching.value = false
  }
}

const handleSubmit = async () => {
  if (!form.value.name || !form.value.url || !form.value.category_id) {
    error.value = '请填写必填项'
    return
  }
  
  const parsedCategoryId = typeof form.value.category_id === 'number'
    ? form.value.category_id
    : Number.parseInt(form.value.category_id, 10)
  
  if (!Number.isInteger(parsedCategoryId) || parsedCategoryId <= 0) {
    error.value = '请选择有效的分类'
    return
  }
  
  const payload = {
    ...form.value,
    category_id: parsedCategoryId,
    is_private: !!form.value.is_private
  }
  
  const result = isEdit.value
    ? await updateBookmark(editId.value, payload)
    : await addBookmark(payload)
  
  if (result.success) {
    toastSuccess(isEdit.value ? '书签已更新' : '书签已添加')
    close()
  } else {
    error.value = result.error || '操作失败'
    toastError(error.value)
  }
}

defineExpose({
  open,
  close
})
</script>

<style scoped>
.bookmark-dialog {
  max-width: 420px;
}

.url-input-group {
  display: flex;
  gap: 0.5rem;
  align-items: stretch;
}

.url-input-group input {
  flex: 1;
}

.fetch-btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.65rem 0.875rem;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition);
  white-space: nowrap;
}

.fetch-btn:hover:not(:disabled) {
  background: var(--primary-dark);
}

.fetch-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.fetch-btn svg {
  width: 16px;
  height: 16px;
  stroke-width: 2;
  flex-shrink: 0;
}

.mini-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.checkbox-group {
  background: var(--bg-secondary);
  padding: 0.75rem;
  border-radius: var(--radius-sm);
  border: 2px solid var(--border);
}

.checkbox-label {
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  margin-top: 0.125rem;
  flex-shrink: 0;
}

.checkbox-text {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-weight: 500;
  font-size: 0.85rem;
  color: var(--text);
}

.lock-icon {
  width: 14px;
  height: 14px;
  stroke-width: 2;
  color: var(--primary);
}

.checkbox-description {
  display: block;
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-top: 0.2rem;
  margin-left: 24px;
}

/* Mobile optimization */
@media (max-width: 768px) {
  .bookmark-dialog {
    max-width: 95%;
  }
  
  .url-input-group {
    flex-direction: column;
  }
  
  .fetch-btn {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .bookmark-dialog {
    max-width: 95%;
    padding: 1rem;
  }
}
</style>

