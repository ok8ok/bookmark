<template>
  <Transition name="modal">
    <div v-if="show" class="modal-overlay" @click.self="close">
      <div class="modal-content" role="dialog" aria-labelledby="dialog-title" aria-modal="true">
        <div class="modal-header">
          <h3 id="dialog-title">AI 批量生成描述</h3>
          <button 
            class="close-btn" 
            @click="close"
            :disabled="isGenerating"
            aria-label="关闭"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        
        <div class="modal-body">
          <div v-if="!isGenerating && !completed" class="confirmation-section">
            <p class="info-text">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 16v-4"/>
                <path d="M12 8h.01"/>
              </svg>
              即将为选中的 <strong>{{ bookmarkCount }}</strong> 个书签生成描述
            </p>
            <p class="warning-text">
              此操作将使用 AI API 为每个书签生成描述，可能需要一些时间。
            </p>
            <div class="option-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="overwriteExisting" />
                <span>覆盖已有描述</span>
              </label>
              <p class="option-hint">如果不勾选，将只为没有描述的书签生成</p>
            </div>
          </div>
          
          <div v-if="isGenerating" class="progress-section">
            <div class="progress-info">
              <div class="progress-stats">
                <div class="stat-item">
                  <span class="stat-label">进度</span>
                  <span class="stat-value">{{ currentIndex }} / {{ totalCount }}</span>
                </div>
                <div class="stat-item success">
                  <span class="stat-label">成功</span>
                  <span class="stat-value">{{ successCount }}</span>
                </div>
                <div class="stat-item error">
                  <span class="stat-label">失败</span>
                  <span class="stat-value">{{ failedCount }}</span>
                </div>
              </div>
              
              <div class="progress-bar">
                <div 
                  class="progress-fill" 
                  :style="{ width: progressPercentage + '%' }"
                ></div>
              </div>
              
              <p class="progress-text">{{ progressPercentage }}%</p>
            </div>
            
            <div v-if="currentBookmark" class="current-bookmark">
              <p class="current-label">正在处理：</p>
              <p class="current-name">{{ currentBookmark.name }}</p>
              <p class="current-url">{{ currentBookmark.url }}</p>
            </div>
            
            <div v-if="results.length > 0" class="results-list">
              <div 
                v-for="result in visibleResults" 
                :key="result.id"
                class="result-item"
                :class="{ success: result.success, error: !result.success }"
              >
                <svg v-if="result.success" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="result-icon">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
                <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" class="result-icon">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
                <div class="result-content">
                  <p class="result-name">{{ result.name }}</p>
                  <p v-if="!result.success" class="result-error">{{ result.error }}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div v-if="completed" class="completion-section">
            <div class="completion-icon" :class="{ success: failedCount === 0, warning: failedCount > 0 }">
              <svg v-if="failedCount === 0" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 8v4"/>
                <path d="M12 16h.01"/>
              </svg>
            </div>
            <h4 class="completion-title">
              {{ failedCount === 0 ? '全部完成！' : '部分完成' }}
            </h4>
            <div class="completion-stats">
              <div class="stat-item success">
                <span class="stat-label">成功</span>
                <span class="stat-value">{{ successCount }}</span>
              </div>
              <div class="stat-item error">
                <span class="stat-label">失败</span>
                <span class="stat-value">{{ failedCount }}</span>
              </div>
            </div>
            <p class="completion-message">
              {{ failedCount === 0 
                ? '所有书签描述已成功生成' 
                : `${successCount} 个书签描述已生成，${failedCount} 个失败` 
              }}
            </p>
          </div>
        </div>
        
        <div class="modal-footer">
          <button 
            v-if="!isGenerating && !completed"
            class="btn btn-secondary" 
            @click="close"
          >
            取消
          </button>
          <button 
            v-if="!isGenerating && !completed"
            class="btn btn-primary" 
            @click="startGeneration"
            :disabled="bookmarkCount === 0"
          >
            开始生成
          </button>
          <button 
            v-if="completed"
            class="btn btn-primary" 
            @click="close"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAI } from '../composables/useAI'
import { useBookmarks } from '../composables/useBookmarks'
import { useToast } from '../composables/useToast'

const { generateDescription } = useAI()
const { updateBookmark, bookmarks } = useBookmarks()
const { success: toastSuccess, error: toastError } = useToast()

const show = ref(false)
const selectedBookmarks = ref([])
const isGenerating = ref(false)
const completed = ref(false)
const overwriteExisting = ref(false)

const currentIndex = ref(0)
const totalCount = ref(0)
const successCount = ref(0)
const failedCount = ref(0)
const currentBookmark = ref(null)
const results = ref([])

const bookmarkCount = computed(() => {
  if (!overwriteExisting.value) {
    return selectedBookmarks.value.filter(b => !b.description || b.description.trim() === '').length
  }
  return selectedBookmarks.value.length
})

const progressPercentage = computed(() => {
  if (totalCount.value === 0) return 0
  return Math.round((currentIndex.value / totalCount.value) * 100)
})

const visibleResults = computed(() => {
  return results.value.slice(-5).reverse()
})

const open = (bookmarks) => {
  selectedBookmarks.value = bookmarks
  isGenerating.value = false
  completed.value = false
  overwriteExisting.value = false
  currentIndex.value = 0
  totalCount.value = 0
  successCount.value = 0
  failedCount.value = 0
  currentBookmark.value = null
  results.value = []
  show.value = true
}

const close = () => {
  if (isGenerating.value) return
  show.value = false
}

const startGeneration = async () => {
  const bookmarksToProcess = overwriteExisting.value 
    ? selectedBookmarks.value 
    : selectedBookmarks.value.filter(b => !b.description || b.description.trim() === '')
  
  if (bookmarksToProcess.length === 0) {
    toastError('没有需要生成描述的书签')
    return
  }
  
  isGenerating.value = true
  totalCount.value = bookmarksToProcess.length
  currentIndex.value = 0
  successCount.value = 0
  failedCount.value = 0
  results.value = []
  
  for (let i = 0; i < bookmarksToProcess.length; i++) {
    const bookmark = bookmarksToProcess[i]
    currentBookmark.value = bookmark
    currentIndex.value = i + 1
    
    try {
      const result = await generateDescription(bookmark.name, bookmark.url)
      
      if (result.success && result.description) {
        await updateBookmark(bookmark.id, {
          ...bookmark,
          description: result.description
        })
        
        successCount.value++
        results.value.push({
          id: bookmark.id,
          name: bookmark.name,
          success: true
        })
      } else {
        failedCount.value++
        results.value.push({
          id: bookmark.id,
          name: bookmark.name,
          success: false,
          error: result.error || '生成失败'
        })
      }
    } catch (error) {
      failedCount.value++
      results.value.push({
        id: bookmark.id,
        name: bookmark.name,
        success: false,
        error: error.message || '生成失败'
      })
    }
    
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  
  isGenerating.value = false
  completed.value = true
  currentBookmark.value = null
  
  if (failedCount.value === 0) {
    toastSuccess(`成功生成 ${successCount.value} 个书签描述`)
  } else {
    toastError(`生成完成：成功 ${successCount.value} 个，失败 ${failedCount.value} 个`)
  }
}

defineExpose({
  open,
  close
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 1rem;
}

.modal-content {
  background: var(--bg);
  border-radius: var(--radius);
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--border);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border);
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text);
}

.close-btn {
  background: none;
  border: none;
  padding: 0.5rem;
  cursor: pointer;
  color: var(--text-secondary);
  transition: var(--transition);
  border-radius: var(--radius-sm);
}

.close-btn:hover:not(:disabled) {
  background: var(--bg-secondary);
  color: var(--text);
}

.close-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.close-btn svg {
  width: 20px;
  height: 20px;
  stroke-width: 2;
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.confirmation-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.info-text {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: var(--info-bg);
  border: 1px solid var(--info-border);
  border-radius: var(--radius);
  color: var(--info-text);
  margin: 0;
}

.info-text svg {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  stroke-width: 2;
}

.info-text strong {
  color: var(--primary);
}

.warning-text {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin: 0;
}

.option-group {
  padding: 1rem;
  background: var(--bg-secondary);
  border-radius: var(--radius);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-weight: 500;
  color: var(--text);
}

.checkbox-label input[type="checkbox"] {
  cursor: pointer;
  width: 18px;
  height: 18px;
}

.option-hint {
  margin: 0.5rem 0 0 0;
  font-size: 0.8125rem;
  color: var(--text-secondary);
}

.progress-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.progress-info {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.progress-stats {
  display: flex;
  gap: 1rem;
  justify-content: space-around;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.75rem;
  background: var(--bg-secondary);
  border-radius: var(--radius);
  flex: 1;
}

.stat-item.success {
  background: rgba(34, 197, 94, 0.1);
}

.stat-item.error {
  background: rgba(239, 68, 68, 0.1);
}

.stat-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text);
}

.stat-item.success .stat-value {
  color: #16a34a;
}

.stat-item.error .stat-value {
  color: #dc2626;
}

.progress-bar {
  width: 100%;
  height: 12px;
  background: var(--bg-secondary);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary), var(--primary-dark));
  transition: width 0.3s ease;
  border-radius: var(--radius-full);
}

.progress-text {
  text-align: center;
  font-weight: 600;
  color: var(--primary);
  font-size: 1.125rem;
  margin: 0;
}

.current-bookmark {
  padding: 1rem;
  background: var(--bg-secondary);
  border-radius: var(--radius);
  border-left: 3px solid var(--primary);
}

.current-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 0.5rem 0;
}

.current-name {
  font-weight: 600;
  color: var(--text);
  margin: 0 0 0.25rem 0;
  font-size: 0.9375rem;
}

.current-url {
  font-size: 0.8125rem;
  color: var(--text-secondary);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 200px;
  overflow-y: auto;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: var(--bg-secondary);
  border-radius: var(--radius);
  border-left: 3px solid var(--border);
}

.result-item.success {
  border-left-color: #16a34a;
}

.result-item.error {
  border-left-color: #dc2626;
}

.result-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  stroke-width: 2;
}

.result-item.success .result-icon {
  color: #16a34a;
}

.result-item.error .result-icon {
  color: #dc2626;
}

.result-content {
  flex: 1;
  min-width: 0;
}

.result-name {
  margin: 0;
  font-size: 0.875rem;
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.result-error {
  margin: 0.25rem 0 0 0;
  font-size: 0.75rem;
  color: #dc2626;
}

.completion-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  text-align: center;
  padding: 2rem 0;
}

.completion-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.completion-icon.success {
  background: rgba(34, 197, 94, 0.1);
  color: #16a34a;
}

.completion-icon.warning {
  background: rgba(245, 158, 11, 0.1);
  color: #d97706;
}

.completion-icon svg {
  width: 40px;
  height: 40px;
  stroke-width: 2;
}

.completion-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text);
}

.completion-stats {
  display: flex;
  gap: 2rem;
  justify-content: center;
}

.completion-message {
  color: var(--text-secondary);
  margin: 0;
}

.modal-footer {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  padding: 1.5rem;
  border-top: 1px solid var(--border);
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius);
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition);
  border: none;
  font-size: 0.9375rem;
}

.btn-primary {
  background: var(--primary);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--primary-dark);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: var(--bg-secondary);
  color: var(--text);
  border: 1px solid var(--border);
}

.btn-secondary:hover {
  background: var(--bg-hover);
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-content,
.modal-leave-active .modal-content {
  transition: transform 0.3s ease;
}

.modal-enter-from .modal-content,
.modal-leave-to .modal-content {
  transform: scale(0.9);
}

@media (max-width: 640px) {
  .modal-content {
    max-width: 100%;
    max-height: 100vh;
    border-radius: 0;
  }
  
  .progress-stats {
    flex-direction: column;
  }
}
</style>
