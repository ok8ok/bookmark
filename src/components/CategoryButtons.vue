<template>
  <div v-if="categoryOptions.length" class="category-buttons">
    <button 
      v-for="category in categoryOptions" 
      :key="category.id"
      class="category-btn"
      :class="{ active: activeCategory === category.id }"
      @click="scrollToCategory(category.id)"
    >
      {{ category.displayName }}
    </button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useBookmarks } from '../composables/useBookmarks'
import { buildCategoryTree, getCategoryPath } from '../utils/categoryTree'

const { categories } = useBookmarks()
const activeCategory = ref(null)

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

const scrollToCategory = (categoryId) => {
  const element = document.getElementById(`category-${categoryId}`)
  if (element) {
    const offset = 120
    const top = element.getBoundingClientRect().top + window.scrollY - offset
    window.scrollTo({ top, behavior: 'smooth' })
  }
}

const updateActiveCategory = () => {
  const sections = document.querySelectorAll('.category-section')
  const scrollY = window.scrollY + 150
  
  for (const section of sections) {
    const top = section.offsetTop
    const height = section.offsetHeight
    
    if (scrollY >= top && scrollY < top + height) {
      const id = parseInt(section.id.replace('category-', ''))
      activeCategory.value = id
      break
    }
  }
}

onMounted(() => {
  window.addEventListener('scroll', updateActiveCategory)
  updateActiveCategory()
})

onUnmounted(() => {
  window.removeEventListener('scroll', updateActiveCategory)
})
</script>

