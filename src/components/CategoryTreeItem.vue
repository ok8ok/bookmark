<template>
  <li
    class="category-item"
    :class="{
      active: selectedCategoryId === category.id,
      selected: isCategorySelected,
      'has-children': category.children?.length > 0,
      'is-root': level === 0
    }"
  >
    <div class="category-main" :style="{ marginLeft: `${level * 1.1}rem` }">
      <button
        v-if="category.children?.length > 0"
        type="button"
        class="expand-toggle"
        @click.stop="toggleExpanded"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <polyline :points="isExpanded ? '6 9 12 15 18 9' : '9 6 15 12 9 18'" />
        </svg>
      </button>
      <span v-else class="expand-spacer"></span>

      <label v-if="isBatchMode" class="category-checkbox" @click.stop>
        <input
          type="checkbox"
          :checked="isCategorySelected"
          @change="$emit('toggle-category-selection', category.id)"
        />
      </label>

      <button
        type="button"
        class="category-button"
        @click="$emit('select', category.id)"
      >
        <span class="category-name">
          <span class="category-tree-icon">
            <svg
              v-if="category.children?.length"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                d="M3 7a2 2 0 0 1 2-2h4l2 2h10a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            <svg
              v-else
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                d="M7 4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16l-5-3-5 3Z"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </span>
          <span class="category-label">{{ category.name }}</span>
        </span>
        <span class="category-count">
          {{ bookmarkCountByCategory[category.id] ?? 0 }}
        </span>
      </button>
    </div>

    <div
      v-if="isEditMode && !isBatchMode"
      class="category-actions"
      :style="{ marginLeft: `${Math.max(level * 1.1, 0)}rem` }"
    >
      <button
        v-if="category.depth < 4"
        type="button"
        class="icon-btn-small add-sub-btn"
        title="添加子分类"
        @click.stop="$emit('add-subcategory', category)"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
          <line x1="12" y1="11" x2="12" y2="17"/>
          <line x1="9" y1="14" x2="15" y2="14"/>
        </svg>
      </button>
      <button
        type="button"
        class="icon-btn-small add-bookmark-btn"
        title="添加书签"
        @click.stop="$emit('add-bookmark', category.id)"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <line x1="12" y1="8" x2="12" y2="16"/>
          <line x1="8" y1="12" x2="16" y2="12"/>
        </svg>
      </button>
      <button
        type="button"
        class="icon-btn-small"
        title="编辑分类"
        @click.stop="$emit('edit-category', category)"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      </button>
      <button
        type="button"
        class="icon-btn-small delete-btn"
        title="删除分类"
        @click.stop="$emit('delete-category', category)"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <polyline points="3 6 5 6 21 6" />
          <path
            d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
          />
        </svg>
      </button>
    </div>

    <ul v-if="category.children && category.children.length && isExpanded" class="category-children">
      <CategoryTreeItem
        v-for="child in category.children"
        :key="child.id"
        :category="child"
        :level="level + 1"
        :selected-category-id="selectedCategoryId"
        :selected-category-ids="selectedCategoryIds"
        :is-edit-mode="isEditMode"
        :is-batch-mode="isBatchMode"
        :bookmark-count-by-category="bookmarkCountByCategory"
        @select="$emit('select', $event)"
        @toggle-category-selection="$emit('toggle-category-selection', $event)"
        @add-subcategory="$emit('add-subcategory', $event)"
        @add-bookmark="$emit('add-bookmark', $event)"
        @edit-category="$emit('edit-category', $event)"
        @delete-category="$emit('delete-category', $event)"
      />
    </ul>
  </li>
</template>

<script setup>
import { ref, computed } from 'vue'

defineOptions({ name: 'CategoryTreeItem' })

const props = defineProps({
  category: {
    type: Object,
    required: true
  },
  level: {
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
  isEditMode: {
    type: Boolean,
    default: false
  },
  isBatchMode: {
    type: Boolean,
    default: false
  },
  bookmarkCountByCategory: {
    type: Object,
    default: () => ({})
  }
})

const isExpanded = ref(false)

const isCategorySelected = computed(() => props.selectedCategoryIds?.includes(props.category.id) ?? false)

const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value
}
</script>

<style scoped>
.category-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.category-main {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.5rem;
  border-radius: var(--radius-sm);
  transition: background-color 0.2s ease;
}

.category-item:not(.is-root) .category-main {
  background: var(--bg-tertiary);
}

html.dark .category-item:not(.is-root) .category-main {
  background: rgba(148, 163, 184, 0.08);
}

.category-main:hover {
  background: var(--bg-secondary);
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

.expand-toggle {
  width: 26px;
  height: 26px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  color: var(--text-secondary);
  transition: background-color 0.2s ease, color 0.2s ease;
  flex-shrink: 0;
}

.expand-toggle:hover {
  background: var(--bg-tertiary);
  color: var(--text);
}

.expand-toggle svg {
  width: 16px;
  height: 16px;
  stroke-width: 2;
}

.expand-spacer {
  width: 26px;
  flex-shrink: 0;
}

.category-button {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.45rem 0.6rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
  color: var(--text);
  font-size: 0.92rem;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.category-button:hover {
  background: rgba(99, 102, 241, 0.08);
}

.category-item.active .category-button {
  color: var(--primary);
  font-weight: 600;
}

.category-item.selected:not(.active) .category-button {
  background: rgba(99, 102, 241, 0.08);
}

html.dark .category-item.selected:not(.active) .category-button {
  background: rgba(99, 102, 241, 0.16);
}

.category-name {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  min-width: 0;
}

.category-tree-icon {
  width: 26px;
  height: 26px;
  border-radius: var(--radius-sm);
  background: var(--bg-tertiary);
  color: var(--primary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

html.dark .category-tree-icon {
  background: rgba(79, 70, 229, 0.12);
}

.category-tree-icon svg {
  width: 16px;
  height: 16px;
  stroke-width: 1.8;
}

.category-label {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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
  padding: 0 0.6rem 0.5rem 0.6rem;
}

.icon-btn-small {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: var(--radius-sm);
  background: var(--bg-tertiary);
  color: var(--text);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease, transform 0.2s ease;
}

.icon-btn-small svg {
  width: 14px;
  height: 14px;
  stroke-width: 2;
}

.icon-btn-small:hover {
  background: var(--primary);
  color: #fff;
  transform: translateY(-1px);
}

.add-sub-btn {
  color: var(--primary);
}

.add-bookmark-btn {
  color: var(--success-dark, #047857);
}

.add-bookmark-btn:hover {
  background: var(--success);
}

.delete-btn:hover {
  background: var(--error);
}

.category-children {
  list-style: none;
  margin: 0;
  padding: 0;
}

@media (max-width: 768px) {
  .category-main {
    gap: 0.3rem;
    padding: 0.3rem 0.4rem;
  }

  .category-button {
    padding: 0.4rem 0.5rem;
  }

  .icon-btn-small {
    width: 26px;
    height: 26px;
  }

  .category-tree-icon {
    width: 24px;
    height: 24px;
  }

  .category-tree-icon svg {
    width: 14px;
    height: 14px;
  }
}
</style>
