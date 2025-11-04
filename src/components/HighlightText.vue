<template>
  <span v-html="highlightedText"></span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  text: {
    type: String,
    required: true
  },
  query: {
    type: String,
    default: ''
  }
})

const highlightedText = computed(() => {
  if (!props.query || !props.text) {
    return escapeHtml(props.text || '')
  }
  
  const escapedText = escapeHtml(props.text)
  const escapedQuery = escapeRegex(props.query)
  
  // 使用正则表达式进行不区分大小写的匹配
  const regex = new RegExp(`(${escapedQuery})`, 'gi')
  
  return escapedText.replace(regex, '<mark>$1</mark>')
})

// HTML 转义
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  return text.replace(/[&<>"']/g, m => map[m])
}

// 正则表达式转义
function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
</script>

<style scoped>
:deep(mark) {
  background: var(--primary);
  color: white;
  padding: 0.1em 0.2em;
  border-radius: 2px;
  font-weight: 500;
}
</style>

