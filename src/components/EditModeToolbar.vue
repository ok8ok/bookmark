<template>
  <Transition name="slide">
    <div v-if="isEditMode" class="edit-toolbar">
      <div class="toolbar-content">
        <div class="toolbar-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          <span v-if="!isBatchMode">编辑模式</span>
          <span v-else class="batch-mode-title">
            批量操作
            <span v-if="selectedCount > 0" class="selection-count">书签 {{ selectedCount }}</span>
            <span v-if="selectedCategoryCount > 0" class="selection-count">分类 {{ selectedCategoryCount }}</span>
            <span v-if="selectedCount === 0 && selectedCategoryCount === 0" class="selection-count">未选择</span>
          </span>
        </div>
        
        <div v-if="!isBatchMode" class="toolbar-actions">
          <button class="toolbar-btn add-bookmark-btn" @click="$emit('addBookmark')" title="添加书签">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <line x1="12" y1="8" x2="12" y2="16"/>
              <line x1="8" y1="12" x2="16" y2="12"/>
            </svg>
            <span>添加书签</span>
          </button>
          
          <button class="toolbar-btn add-category-btn" @click="$emit('addCategory')" title="添加分类">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              <line x1="12" y1="11" x2="12" y2="17"/>
              <line x1="9" y1="14" x2="15" y2="14"/>
            </svg>
            <span>添加分类</span>
          </button>
          
          <button class="toolbar-btn batch-mode-btn" @click="$emit('toggleBatchMode')" title="批量操作">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M9 11l3 3 8-8"/>
              <path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9"/>
            </svg>
            <span>批量操作</span>
          </button>

          <div class="toolbar-divider"></div>

          <button class="toolbar-btn finish-btn" @click="$emit('finishEdit')" title="完成编辑">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
            <span>完成</span>
          </button>
        </div>
        
        <div v-else class="toolbar-actions batch-actions">
          <button 
            class="toolbar-btn select-all-btn" 
            @click="$emit('selectAll')" 
            title="全选"
            :disabled="!hasBookmarks"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M9 11l3 3L22 4"/>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
            <span>全选</span>
          </button>
          
          <button 
            class="toolbar-btn deselect-all-btn" 
            @click="$emit('deselectAll')" 
            title="取消全选"
            :disabled="selectedCount === 0"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M18 6L6 18"/>
              <path d="M6 6l12 12"/>
            </svg>
            <span>取消全选</span>
          </button>
          
          <button 
            class="toolbar-btn invert-btn" 
            @click="$emit('invertSelection')" 
            title="反选"
            :disabled="!hasBookmarks"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
            </svg>
            <span>反选</span>
          </button>
          
          <div class="toolbar-divider"></div>
          
          <button 
            class="toolbar-btn batch-move-btn" 
            @click="$emit('batchMove')" 
            title="移动分类"
            :disabled="selectedCount === 0"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
            <span>移动</span>
          </button>
          
          <button 
            class="toolbar-btn batch-edit-btn" 
            @click="$emit('batchEdit')" 
            title="编辑属性"
            :disabled="selectedCount === 0"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            <span>编辑</span>
          </button>
          
          <button 
            class="toolbar-btn batch-ai-btn" 
            @click="$emit('batchAIGenerate')" 
            title="AI 批量生成描述"
            :disabled="selectedCount === 0 || !aiEnabled"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
            <span>AI 生成</span>
          </button>
          
          <button 
            class="toolbar-btn batch-ai-classify-btn" 
            @click="$emit('batchAIClassify')" 
            title="AI 批量分类"
            :disabled="selectedCount === 0 || !aiEnabled"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            </svg>
            <span>AI 分类</span>
          </button>
          
          <button 
            class="toolbar-btn batch-delete-btn" 
            @click="$emit('batchDelete')" 
            title="批量删除"
            :disabled="selectedCount === 0"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
            <span>删除</span>
          </button>
          
          <div class="toolbar-divider"></div>
          
          <button 
            class="toolbar-btn batch-delete-categories-btn" 
            @click="$emit('batchDeleteCategories')" 
            title="批量删除分类"
            :disabled="selectedCategoryCount === 0"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
            <span>删除分类</span>
          </button>
          
          <div class="toolbar-divider"></div>
          
          <button class="toolbar-btn cancel-btn" @click="$emit('toggleBatchMode')" title="退出批量操作">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            <span>退出</span>
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
defineProps({
  isEditMode: {
    type: Boolean,
    default: false
  },
  isBatchMode: {
    type: Boolean,
    default: false
  },
  selectedCount: {
    type: Number,
    default: 0
  },
  selectedCategoryCount: {
    type: Number,
    default: 0
  },
  hasBookmarks: {
    type: Boolean,
    default: false
  },
  aiEnabled: {
    type: Boolean,
    default: false
  }
})

defineEmits([
  'addBookmark',
  'addCategory',
  'toggleBatchMode',
  'selectAll',
  'deselectAll',
  'invertSelection',
  'batchMove',
  'batchEdit',
  'batchAIGenerate',
  'batchAIClassify',
  'batchDelete',
  'batchDeleteCategories',
  'finishEdit'
])
</script>

<style scoped>
.edit-toolbar {
  position: sticky;
  top: 0;
  z-index: 100;
  background: transparent;
  margin-bottom: 1rem;
  padding-top: var(--safe-top);
}

html.dark .edit-toolbar {
  background: transparent;
}

.toolbar-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.toolbar-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: var(--primary);
  font-size: 1rem;
  flex-shrink: 0;
}

.toolbar-title svg {
  width: 20px;
  height: 20px;
  stroke-width: 2;
  flex-shrink: 0;
}

.batch-mode-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.selection-count {
  display: inline-block;
  background: var(--primary);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.toolbar-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  align-items: center;
}

.batch-actions {
  gap: 0.5rem;
}

.toolbar-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border: none;
  border-radius: var(--radius);
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition);
  white-space: nowrap;
}

.toolbar-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

.toolbar-btn svg {
  width: 18px;
  height: 18px;
  stroke-width: 2;
  flex-shrink: 0;
}

.add-bookmark-btn {
  background: var(--success);
  color: white;
}

.add-bookmark-btn:hover:not(:disabled) {
  background: #059669;
  transform: translateY(-1px);
}

.add-category-btn {
  background: var(--primary);
  color: white;
}

.add-category-btn:hover:not(:disabled) {
  background: var(--primary-dark);
  transform: translateY(-1px);
}

.batch-mode-btn {
  background: var(--info);
  color: white;
}

.batch-mode-btn:hover:not(:disabled) {
  background: #2563eb;
  transform: translateY(-1px);
}

.select-all-btn,
.invert-btn {
  background: var(--primary-100);
  color: var(--primary);
  border: 2px solid var(--primary-300);
}

.select-all-btn:hover:not(:disabled),
.invert-btn:hover:not(:disabled) {
  background: var(--primary-200);
  transform: translateY(-1px);
}

.deselect-all-btn {
  background: var(--bg-secondary);
  color: var(--text);
  border: 2px solid var(--border);
}

.deselect-all-btn:hover:not(:disabled) {
  background: var(--bg-hover);
  border-color: var(--text-secondary);
  transform: translateY(-1px);
}

.batch-move-btn,
.batch-edit-btn {
  background: var(--warning);
  color: white;
}

.batch-move-btn:hover:not(:disabled),
.batch-edit-btn:hover:not(:disabled) {
  background: #d97706;
  transform: translateY(-1px);
}

.batch-ai-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.batch-ai-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #5568d3 0%, #653a8f 100%);
  transform: translateY(-1px);
}

.batch-ai-classify-btn {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.batch-ai-classify-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #e07be8 0%, #e34558 100%);
  transform: translateY(-1px);
}

.batch-delete-btn,
.batch-delete-categories-btn {
  background: var(--error);
  color: white;
}

.batch-delete-btn:hover:not(:disabled),
.batch-delete-categories-btn:hover:not(:disabled) {
  background: #dc2626;
  transform: translateY(-1px);
}

.cancel-btn {
  background: var(--gray-600);
  color: white;
}

.cancel-btn:hover {
  background: var(--gray-700);
  transform: translateY(-1px);
}

.finish-btn {
  background: var(--primary);
  color: #fff;
}

.finish-btn:hover {
  background: var(--primary-dark);
  transform: translateY(-1px);
}

.toolbar-divider {
  width: 1px;
  height: 24px;
  background: var(--border);
  margin: 0 0.25rem;
  flex-shrink: 0;
}

/* Mobile optimization */
@media (max-width: 1024px) {
  .toolbar-content {
    flex-direction: column;
    padding: 0.75rem;
    gap: 0.75rem;
  }
  
  .toolbar-actions {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 768px) {
  .toolbar-btn {
    padding: 0.65rem 1rem;
    font-size: 0.85rem;
  }
  
  .toolbar-btn span {
    display: none;
  }
  
  .selection-count {
    display: none;
  }
  
  .batch-mode-title {
    font-size: 0.9rem;
  }
  
  .toolbar-btn svg {
    width: 20px;
    height: 20px;
  }
  
  .toolbar-divider {
    display: none;
  }
}

@media (max-width: 480px) {
  .toolbar-actions {
    gap: 0.375rem;
  }
  
  .batch-actions {
    gap: 0.375rem;
  }
  
  .toolbar-btn {
    padding: 0.5rem;
    min-width: 40px;
    justify-content: center;
  }
}

/* Animation */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from {
  opacity: 0;
  transform: translateY(-100%);
}

.slide-leave-to {
  opacity: 0;
  transform: translateY(-100%);
}
</style>
