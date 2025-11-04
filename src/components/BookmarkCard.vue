<template>
  <div 
    :id="`bookmark-${bookmark.id}`"
    class="bookmark-card"
    :class="{
      'selected': isSelected,
      'dragging': isDragging,
      'batch-mode': isBatchMode,
      'drop-before': isDragOver && dropPosition === 'before',
      'drop-after': isDragOver && dropPosition === 'after'
    }"
    :draggable="isEditMode && !isBatchMode"
    :tabindex="isEditMode ? 0 : -1"
    @keydown="handleKeydown"
    @dragstart="handleDragStart"
    @dragend="handleDragEnd"
    @dragenter="handleDragEnter"
    @dragover.prevent="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
    @click="handleClick"
  >
    <div v-if="isBatchMode" class="selection-checkbox" @click.stop="handleSelectionToggle">
      <input 
        type="checkbox" 
        :checked="isSelected"
        @change="handleSelectionToggle"
      >
    </div>
    
    <div class="card-header">
      <LetterIcon 
        v-if="showLetterIcon"
        :text="bookmark.name"
        :size="40"
        class="card-icon"
      />
      <img 
        v-else
        :src="iconUrl" 
        :alt="bookmark.name"
        class="card-icon"
        loading="lazy"
        decoding="async"
        @error="handleIconError"
      >
      <h4 class="card-title">
        <HighlightText :text="bookmark.name" :query="searchQuery" />
      </h4>
    </div>
    
    <p class="card-description">
      <HighlightText :text="bookmark.description || displayUrl" :query="searchQuery" />
    </p>
    
    <div v-if="bookmark.is_private" class="private-badge">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
      <span>私密</span>
    </div>
    
    <div v-if="isEditMode && !isBatchMode" class="card-actions" @click.stop>
      <button class="icon-btn" @click="$emit('edit', bookmark)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      </button>
      <button class="icon-btn delete-btn" @click="$emit('delete', bookmark)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        </svg>
      </button>
    </div>
    
    <div v-if="isEditMode && !isBatchMode" class="drag-handle">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <line x1="4" y1="8" x2="20" y2="8"/>
        <line x1="4" y1="16" x2="20" y2="16"/>
      </svg>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useBookmarks } from '../composables/useBookmarks'
import HighlightText from './HighlightText.vue'
import LetterIcon from './LetterIcon.vue'

const { searchQuery } = useBookmarks()

const props = defineProps({
  bookmark: {
    type: Object,
    required: true
  },
  isEditMode: {
    type: Boolean,
    default: false
  },
  isBatchMode: {
    type: Boolean,
    default: false
  },
  isSelected: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'edit',
  'delete',
  'dragstart',
  'drop',
  'toggleSelect',
  'keyboardReorder',
  'dragenter',
  'dragleave',
  'dragoverPosition',
  'dragend'
])

const iconError = ref(false)
const iconSourceIndex = ref(0) // 当前尝试的图标源索引
const isDragging = ref(false)
const isDragOver = ref(false)
const dropPosition = ref('after')
let dragPreviewEl = null

// 多个 favicon 源，按优先级排序
const faviconSources = computed(() => {
  try {
    const url = new URL(props.bookmark.url)
    const domain = url.hostname
    return [
      // 1. FaviconExtractor (主要源)
      `https://www.faviconextractor.com/favicon/${domain}`,
      // 2. Google Favicon Service
      `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
      // 3. DuckDuckGo
      `https://icons.duckduckgo.com/ip3/${domain}.ico`,
      // 4. Icon Horse
      `https://icon.horse/icon/${domain}`,
      // 5. 直接从网站获取
      `${url.origin}/favicon.ico`,
    ]
  } catch {
    return []
  }
})

// 是否显示字母图标（所有源都失败时）
const showLetterIcon = computed(() => {
  return iconError.value && iconSourceIndex.value >= faviconSources.value.length
})

const iconUrl = computed(() => {
  // 如果有自定义图标URL，使用自定义图标
  if (props.bookmark.icon && props.bookmark.icon.trim()) {
    return props.bookmark.icon
  }
  
  // 尝试使用多个 favicon 源
  if (faviconSources.value.length > 0 && iconSourceIndex.value < faviconSources.value.length) {
    return faviconSources.value[iconSourceIndex.value]
  }
  
  // 所有源都失败，返回空（将显示字母图标）
  return ''
})

const displayUrl = computed(() => {
  try {
    const url = new URL(props.bookmark.url)
    return url.hostname
  } catch {
    return props.bookmark.url
  }
})

const handleIconError = () => {
  // 尝试下一个图标源
  if (iconSourceIndex.value < faviconSources.value.length - 1) {
    iconSourceIndex.value++
    iconError.value = false // 重置错误状态，尝试新的源
  } else {
    // 所有源都失败，显示字母图标
    iconError.value = true
  }
}

const handleClick = () => {
  if (!props.isEditMode) {
    window.open(props.bookmark.url, '_blank')
    return
  }
  
  if (props.isBatchMode) {
    emit('toggleSelect', props.bookmark.id)
  }
}

const createDragPreview = () => {
  const el = document.createElement('div')
  el.className = 'drag-preview'
  el.innerHTML = `
    <div class="drag-preview__content">
      <span class="drag-preview__title">${props.bookmark.name}</span>
      <span class="drag-preview__url">${displayUrl.value}</span>
    </div>
  `
  document.body.appendChild(el)
  return el
}

const handleDragStart = (e) => {
  if (!props.isEditMode || props.isBatchMode) return
  
  isDragging.value = true
  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData('bookmarkId', props.bookmark.id)
  emit('dragstart', props.bookmark)
  
  dragPreviewEl = createDragPreview()
  const rect = dragPreviewEl.getBoundingClientRect()
  e.dataTransfer.setDragImage(dragPreviewEl, rect.width / 2, rect.height / 2)
}

const handleDragEnd = () => {
  isDragging.value = false
  isDragOver.value = false
  dropPosition.value = 'after'
  if (dragPreviewEl?.parentNode) {
    dragPreviewEl.parentNode.removeChild(dragPreviewEl)
    dragPreviewEl = null
  }
  emit('dragend', props.bookmark.id)
}

const handleSelectionToggle = () => {
  emit('toggleSelect', props.bookmark.id)
}

const handleDragEnter = () => {
  if (!props.isEditMode || props.isBatchMode) return
  isDragOver.value = true
  emit('dragenter', props.bookmark.id)
}

const handleDragOver = (e) => {
  if (!props.isEditMode || props.isBatchMode) return
  const rect = e.currentTarget.getBoundingClientRect()
  const offsetY = e.clientY - rect.top
  dropPosition.value = offsetY < rect.height / 2 ? 'before' : 'after'
  isDragOver.value = true
  emit('dragoverPosition', { id: props.bookmark.id, position: dropPosition.value })
}

const handleDragLeave = () => {
  if (!props.isEditMode || props.isBatchMode) return
  isDragOver.value = false
  emit('dragleave', props.bookmark.id)
}

const handleDrop = (e) => {
  if (!props.isEditMode || props.isBatchMode) return
  const draggedId = e.dataTransfer.getData('bookmarkId')
  emit('drop', {
    draggedId: parseInt(draggedId, 10),
    targetId: props.bookmark.id,
    position: dropPosition.value
  })
  isDragOver.value = false
}

const handleKeydown = (event) => {
  if (!props.isEditMode) return
  switch (event.key) {
    case 'Enter':
      if (!props.isBatchMode) {
        emit('edit', props.bookmark)
      }
      break
    case ' ': // Space
    case 'Spacebar':
      event.preventDefault()
      emit('toggleSelect', props.bookmark.id)
      break
    case 'Delete':
    case 'Backspace':
      event.preventDefault()
      emit('delete', props.bookmark)
      break
    case 'ArrowUp':
      event.preventDefault()
      emit('keyboardReorder', { id: props.bookmark.id, direction: 'up' })
      break
    case 'ArrowDown':
      event.preventDefault()
      emit('keyboardReorder', { id: props.bookmark.id, direction: 'down' })
      break
  }
}
</script>

<style scoped>
.bookmark-card {
  position: relative;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.bookmark-card.dragging {
  opacity: 0.5;
  transform: scale(0.95);
  cursor: grabbing !important;
}

.bookmark-card.selected {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.3);
  transform: translateY(-2px);
}

.bookmark-card.batch-mode {
  cursor: pointer;
  padding-top: 2.5rem;
}

.drag-preview {
  position: fixed;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 9999;
  transform: translate(-9999px, -9999px);
}

.drag-preview__content {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.6rem 0.8rem;
  background: rgba(15, 23, 42, 0.9);
  color: white;
  border-radius: var(--radius-sm);
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.3);
  min-width: 180px;
}

.drag-preview__title {
  font-weight: 600;
  font-size: 0.9rem;
}

.drag-preview__url {
  font-size: 0.75rem;
  opacity: 0.8;
}

.selection-checkbox {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  z-index: 10;
  background: var(--bg);
  border-radius: var(--radius-sm);
  padding: 0.25rem;
  box-shadow: 0 2px 4px var(--shadow);
}

.selection-checkbox input[type="checkbox"] {
  width: 20px;
  height: 20px;
  cursor: pointer;
  accent-color: var(--primary);
}

.drag-handle {
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  opacity: 0;
  transition: opacity 0.2s;
  cursor: grab;
  background: var(--bg-secondary);
  border-radius: var(--radius-sm);
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px var(--shadow);
}

.drag-handle svg {
  width: 16px;
  height: 16px;
  stroke-width: 2;
  color: var(--text-secondary);
}

.bookmark-card:hover .drag-handle {
  opacity: 0.8;
}

.drag-handle:hover {
  opacity: 1 !important;
  background: var(--bg-hover);
}

.drag-handle:active {
  cursor: grabbing;
}

.bookmark-card.drop-before::before {
  content: '';
  position: absolute;
  top: -2px;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--primary);
  border-radius: var(--radius);
  z-index: 20;
}

.bookmark-card.drop-after::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--primary);
  border-radius: var(--radius);
  z-index: 20;
}

@media (max-width: 768px) {
  .drag-handle {
    opacity: 0.6;
  }
}
</style>
