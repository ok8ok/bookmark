<template>
  <div class="letter-icon" :style="iconStyle">
    {{ letter }}
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  text: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    default: 40
  }
})

// 获取首字母（支持中文、英文）
const letter = computed(() => {
  if (!props.text) return '?'
  
  const firstChar = props.text.trim()[0]
  if (!firstChar) return '?'
  
  // 如果是中文，直接返回
  if (/[\u4e00-\u9fa5]/.test(firstChar)) {
    return firstChar
  }
  
  // 如果是英文，返回大写
  return firstChar.toUpperCase()
})

// 根据首字母生成颜色
const getColorFromLetter = (char) => {
  const colors = [
    '#3b82f6', // blue
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#ef4444', // red
    '#f59e0b', // orange
    '#10b981', // green
    '#06b6d4', // cyan
    '#6366f1', // indigo
    '#f97316', // amber
    '#14b8a6', // teal
    '#a855f7', // violet
    '#22c55e', // lime
  ]
  
  const charCode = char.charCodeAt(0)
  const index = charCode % colors.length
  return colors[index]
}

const iconStyle = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`,
  fontSize: `${props.size * 0.5}px`,
  backgroundColor: getColorFromLetter(letter.value),
}))
</script>

<style scoped>
.letter-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  border-radius: var(--radius-sm);
  flex-shrink: 0;
  user-select: none;
}
</style>

