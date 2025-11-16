<template>
  <aside
    class="category-sidebar"
    :class="{
      'is-open': isOpen,
      'is-desktop': isDesktop
    }"
  >
    <div class="sidebar-inner">
      <div class="sidebar-header">
         <div class="sidebar-header-title">
           <h2 class="sidebar-app-title">{{ customTitle }}</h2>
         </div>
         <button
           class="sidebar-close"
           type="button"
           @click="$emit('toggle')"
         >
           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
             <line x1="18" y1="6" x2="6" y2="18" />
             <line x1="6" y1="6" x2="18" y2="18" />
           </svg>
         </button>
       </div>

      <div v-if="!categories.length" class="sidebar-empty">暂无分类</div>

      <ul v-else class="category-list">
        <!-- 全部书签选项 -->
        <li
          class="category-item category-all"
          :class="{ active: selectedCategoryId === 'all' }"
        >
          <div class="category-main">
            <button
              type="button"
              class="category-button"
              @click="$emit('select', 'all')"
            >
              <span class="category-name">全部书签</span>
              <span class="category-count">
                {{ totalBookmarkCount }}
              </span>
            </button>
          </div>
        </li>
        
        <!-- 分类树列表 -->
        <CategoryTreeItem
          v-for="category in categoryTree"
          :key="category.id"
          :category="category"
          :level="0"
          :selected-category-id="selectedCategoryId"
          :selected-category-ids="selectedCategoryIds"
          :is-edit-mode="isEditMode"
          :is-batch-mode="isBatchMode"
          :bookmark-count-by-category="bookmarkCountByCategory"
          @select="handleSelect"
          @toggle-category-selection="handleToggleCategorySelection"
          @add-subcategory="handleAddSubcategory"
          @add-bookmark="handleAddBookmark"
          @edit-category="handleEditCategory"
          @delete-category="handleDeleteCategory"
          @reorder-category="$emit('reorder-category', $event)"
        />
      </ul>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import CategoryTreeItem from './CategoryTreeItem.vue'
import { buildCategoryTree } from '../utils/categoryTree'

const props = defineProps({
  categories: {
    type: Array,
    default: () => []
  },
  bookmarkCountByCategory: {
    type: Object,
    default: () => ({})
  },
  totalBookmarkCount: {
    type: Number,
    default: 0
  },
  selectedCategoryId: {
    type: [Number, String, null],
    default: null
  },
  selectedCategoryIds: {
    type: Array,
    default: () => []
  },
  isOpen: {
    type: Boolean,
    default: true
  },
  isDesktop: {
    type: Boolean,
    default: false
  },
  isEditMode: {
    type: Boolean,
    default: false
  },
  isBatchMode: {
    type: Boolean,
    default: false
  },
  customTitle: {
    type: String,
    default: ''
  }
})

const emit = defineEmits([
  'toggle',
  'select',
  'toggle-category-selection',
  'add-subcategory',
  'add-bookmark',
  'edit-category',
  'delete-category'
])

const treeData = computed(() => buildCategoryTree(props.categories))
const categoryTree = computed(() => treeData.value.tree)

const handleSelect = (id) => emit('select', id)
const handleToggleCategorySelection = (id) => emit('toggle-category-selection', id)
const handleAddSubcategory = (category) => emit('add-subcategory', category)
const handleAddBookmark = (categoryId) => emit('add-bookmark', categoryId)
const handleEditCategory = (category) => emit('edit-category', category)
const handleDeleteCategory = (category) => emit('delete-category', category)
</script>

<style scoped>
.category-sidebar {
  width: min(80vw, 320px);
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-right: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 0 var(--radius) var(--radius) 0;
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.08);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  position: fixed;
  top: var(--safe-top);
  bottom: var(--safe-bottom);
  left: var(--safe-left);
  transform: translateX(-105%);
  z-index: 120;
  display: flex;
  flex-direction: column;
}

.category-sidebar.is-open {
  transform: translateX(0);
}

html.dark .category-sidebar {
  background: rgba(15, 23, 42, 0.8);
  border-right-color: rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
}

.sidebar-inner {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.sidebar-header {
   display: flex;
   align-items: flex-start;
   justify-content: space-between;
   padding: 1rem 1.25rem;
   gap: 0.5rem;
 }

 .sidebar-header-title {
   flex: 1;
   display: flex;
   flex-direction: column;
   gap: 0.25rem;
 }

 .sidebar-app-title {
   font-size: 1.25rem;
   font-weight: 700;
   color: var(--text);
   margin: 0;
   line-height: 1.2;
   word-break: break-word;
 }

 .sidebar-section-title {
   font-size: 0.9rem;
   font-weight: 600;
   color: var(--text-secondary);
   margin: 0;
 }

.sidebar-close {
  background: transparent;
  border: none;
  padding: 0.4rem;
  color: var(--text-secondary);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s ease;
}

.sidebar-close:hover {
  color: var(--text);
}

.sidebar-close svg {
  width: 20px;
  height: 20px;
  stroke-width: 2;
}

.sidebar-empty {
  padding: 2rem 1rem;
  text-align: center;
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.category-list {
  flex: 1;
  overflow-y: auto;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.category-item {
  background: transparent;
  border-radius: var(--radius-sm);
  transition: background-color 0.2s ease, transform 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.category-item.active {
  background: var(--primary-50);
}

html.dark .category-item.active {
  background: rgba(129, 140, 248, 0.15);
}

.category-item.selected:not(.active) {
  background: rgba(99, 102, 241, 0.08);
}

.category-item.category-all {
  padding-bottom: 0.35rem;
  margin-bottom: 0.35rem;
}

.category-item.category-all .category-button {
  font-weight: 600;
}

.category-item:hover {
  background: var(--bg-secondary);
}

.category-main {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.35rem 0.4rem 0.35rem;
}

.category-checkbox {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.category-checkbox input {
  width: 18px;
  height: 18px;
  accent-color: var(--primary);
  cursor: pointer;
}

.category-button {
  flex: 1;
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.6rem 0.85rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease;
  color: var(--text);
  font-size: 0.92rem;
  text-align: left;
}

.category-button:hover {
  background: rgba(99, 102, 241, 0.08);
}

.category-item.active .category-button {
  color: var(--primary);
  font-weight: 600;
}

.category-name {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-right: 0.75rem;
}

.category-count {
  font-size: 0.75rem;
  color: var(--text-secondary);
  background: var(--bg-tertiary);
  border-radius: 999px;
  padding: 0.1rem 0.6rem;
  min-width: 1.8rem;
  text-align: center;
}

.category-item.active .category-count {
  background: var(--primary);
  color: #fff;
}

.category-actions {
  display: flex;
  gap: 0.25rem;
  padding: 0 0.6rem 0.6rem 2.3rem;
}

.icon-btn-small {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: var(--radius-sm);
  background: var(--bg-tertiary);
  color: var(--text);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s ease, transform 0.2s ease;
}

.icon-btn-small:hover {
  background: var(--primary);
  color: #fff;
  transform: scale(1.08);
}

.icon-btn-small.delete-btn:hover {
  background: var(--error);
}

.icon-btn-small svg {
  width: 14px;
  height: 14px;
  stroke-width: 2;
}
</style>
