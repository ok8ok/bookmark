import { ref, computed } from 'vue'

const selectedBookmarkIds = ref(new Set())
const selectedCategoryIds = ref(new Set())
const isBatchMode = ref(false)

export function useBatchOperations() {
  const toggleBatchMode = () => {
    isBatchMode.value = !isBatchMode.value
    if (!isBatchMode.value) {
      selectedBookmarkIds.value.clear()
      selectedCategoryIds.value.clear()
    }
  }
  
  const toggleBookmarkSelection = (bookmarkId) => {
    const next = new Set(selectedBookmarkIds.value)
    if (next.has(bookmarkId)) {
      next.delete(bookmarkId)
    } else {
      next.add(bookmarkId)
    }
    selectedBookmarkIds.value = next
  }
  
  const selectAll = (bookmarkIds) => {
    const next = new Set(selectedBookmarkIds.value)
    bookmarkIds.forEach(id => next.add(id))
    selectedBookmarkIds.value = next
  }
  
  const deselectAll = () => {
    selectedBookmarkIds.value = new Set()
  }
  
  const invertSelection = (bookmarkIds) => {
    const next = new Set(selectedBookmarkIds.value)
    bookmarkIds.forEach(id => {
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
    })
    selectedBookmarkIds.value = next
  }
  
  const isSelected = (bookmarkId) => {
    return selectedBookmarkIds.value.has(bookmarkId)
  }
  
  const selectedCount = computed(() => selectedBookmarkIds.value.size)
  
  const getSelectedIds = () => {
    return Array.from(selectedBookmarkIds.value)
  }
  
  const clearSelection = () => {
    selectedBookmarkIds.value = new Set()
  }
  
  const removeMissingSelections = (bookmarkIds) => {
    const idSet = new Set(bookmarkIds)
    const next = new Set()
    selectedBookmarkIds.value.forEach(id => {
      if (idSet.has(id)) {
        next.add(id)
      }
    })
    selectedBookmarkIds.value = next
  }
  
  // Category selection methods
  const toggleCategorySelection = (categoryId) => {
    const next = new Set(selectedCategoryIds.value)
    if (next.has(categoryId)) {
      next.delete(categoryId)
    } else {
      next.add(categoryId)
    }
    selectedCategoryIds.value = next
  }
  
  const selectAllCategories = (categoryIds) => {
    const next = new Set(selectedCategoryIds.value)
    categoryIds.forEach(id => next.add(id))
    selectedCategoryIds.value = next
  }
  
  const deselectAllCategories = () => {
    selectedCategoryIds.value = new Set()
  }
  
  const invertCategorySelection = (categoryIds) => {
    const next = new Set(selectedCategoryIds.value)
    categoryIds.forEach(id => {
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
    })
    selectedCategoryIds.value = next
  }
  
  const isCategorySelected = (categoryId) => {
    return selectedCategoryIds.value.has(categoryId)
  }
  
  const selectedCategoryCount = computed(() => selectedCategoryIds.value.size)
  
  const getSelectedCategoryIds = () => {
    return Array.from(selectedCategoryIds.value)
  }
  
  const clearCategorySelection = () => {
    selectedCategoryIds.value = new Set()
  }
  
  return {
    isBatchMode,
    selectedBookmarkIds,
    selectedCategoryIds,
    selectedCount,
    selectedCategoryCount,
    toggleBatchMode,
    toggleBookmarkSelection,
    selectAll,
    deselectAll,
    invertSelection,
    isSelected,
    getSelectedIds,
    clearSelection,
    removeMissingSelections,
    toggleCategorySelection,
    selectAllCategories,
    deselectAllCategories,
    invertCategorySelection,
    isCategorySelected,
    getSelectedCategoryIds,
    clearCategorySelection
  }
}
