<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="show" class="dialog-overlay" @click="close">
        <div class="dialog-box import-export-dialog" @click.stop>
          <h3 class="dialog-title">导入/导出书签</h3>
          
          <div class="export-section">
            <h4>导出书签</h4>
            <p class="section-description">将当前所有书签导出为文件</p>
            <div class="button-group">
              <button class="btn btn-primary" @click="exportJSON">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                导出为 JSON
              </button>
              <button class="btn btn-secondary" @click="exportHTML">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                导出为 HTML
              </button>
            </div>
          </div>
          
          <div class="divider"></div>
          
          <div class="import-section">
            <h4>导入书签</h4>
            <div class="import-notice">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 16v-4m0-4h.01"/>
              </svg>
              <span>导入会自动跳过已存在的书签和分类</span>
            </div>
            <input 
              ref="fileInput"
              type="file" 
              accept=".json,.html,.htm"
              style="display: none"
              @change="handleFileSelect"
            >
            <div class="import-button-wrapper">
              <button class="import-file-btn" @click="selectFile" :disabled="importing">
                <div class="import-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                </div>
                <div class="import-text">
                  <span class="import-title">{{ importing ? '导入中...' : '选择文件导入' }}</span>
                  <span class="import-subtitle">支持 JSON 和 HTML 格式</span>
                </div>
              </button>
            </div>
            
            <!-- 进度条 -->
            <div v-if="importing" class="import-progress">
              <div class="progress-bar-container">
                <div class="progress-bar" :style="{ width: importProgress + '%' }"></div>
              </div>
              <p class="progress-text">{{ importStatus }}</p>
            </div>
            
            <!-- 导入结果 -->
            <div v-if="importResult" class="import-result" :class="importResult.success ? 'success' : 'error'">
              <p class="result-message">{{ importResult.message }}</p>
              
              <!-- 详细信息 -->
              <div v-if="importDetails && importDetails.skippedItems && importDetails.skippedItems.length > 0" class="import-details">
                <button class="btn-toggle-details" @click="importDetails.showDetails = !importDetails.showDetails">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <polyline :points="importDetails.showDetails ? '6 9 12 15 18 9' : '9 18 15 12 9 6'"/>
                  </svg>
                  {{ importDetails.showDetails ? '隐藏' : '查看' }}跳过的项目 ({{ importDetails.skippedItems.length }})
                </button>
                
                <div v-if="importDetails.showDetails" class="details-list">
                  <div v-for="(item, index) in importDetails.skippedItems" :key="index" class="detail-item">
                    <span class="item-type">{{ item.type === 'category' ? '📁' : '🔖' }}</span>
                    <span class="item-name">{{ item.name }}</span>
                    <span class="item-reason">{{ item.reason }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="dialog-buttons">
            <button class="btn btn-secondary" @click="close">关闭</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref } from 'vue'
import { useBookmarks } from '../composables/useBookmarks'
import { useAuth } from '../composables/useAuth'

const { categories, bookmarks, fetchData } = useBookmarks()
const { getAuthHeaders, apiRequest } = useAuth()

const show = ref(false)
const fileInput = ref(null)
const importing = ref(false)
const importResult = ref(null)
const importProgress = ref(0)
const importStatus = ref('')
const importDetails = ref(null)

const open = () => {
  show.value = true
  importResult.value = null
  importProgress.value = 0
  importStatus.value = ''
  importDetails.value = null
}

const close = () => {
  show.value = false
}

// 导出为 JSON
const exportJSON = () => {
  const data = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    categories: categories.value,
    bookmarks: bookmarks.value
  }
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `bookmarks-${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
  
  importResult.value = { success: true, message: '✅ JSON 文件已导出' }
}

// 导出为 HTML (Netscape 书签格式)
const exportHTML = () => {
  let html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file. -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
`
  
  // 按分类组织
  const categoriesMap = {}
  categories.value.forEach(cat => {
    categoriesMap[cat.id] = cat.name
  })
  
  // 按分类分组书签
  const bookmarksByCategory = {}
  bookmarks.value.forEach(bookmark => {
    const catName = categoriesMap[bookmark.category_id] || '未分类'
    if (!bookmarksByCategory[catName]) {
      bookmarksByCategory[catName] = []
    }
    bookmarksByCategory[catName].push(bookmark)
  })
  
  // 生成 HTML
  Object.keys(bookmarksByCategory).forEach(catName => {
    html += `    <DT><H3>${escapeHtml(catName)}</H3>\n`
    html += `    <DL><p>\n`
    bookmarksByCategory[catName].forEach(bookmark => {
      const timestamp = Math.floor(new Date(bookmark.created_at).getTime() / 1000)
      html += `        <DT><A HREF="${escapeHtml(bookmark.url)}" ADD_DATE="${timestamp}">${escapeHtml(bookmark.name)}</A>\n`
      if (bookmark.description) {
        html += `        <DD>${escapeHtml(bookmark.description)}\n`
      }
    })
    html += `    </DL><p>\n`
  })
  
  html += `</DL><p>`
  
  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `bookmarks-${new Date().toISOString().split('T')[0]}.html`
  a.click()
  URL.revokeObjectURL(url)
  
  importResult.value = { success: true, message: '✅ HTML 文件已导出' }
}

// HTML 转义
const escapeHtml = (text) => {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  return text.replace(/[&<>"']/g, m => map[m])
}

// 选择文件
const selectFile = () => {
  fileInput.value.click()
}

// 处理文件选择
const handleFileSelect = async (event) => {
  const file = event.target.files[0]
  if (!file) return
  
  importing.value = true
  importResult.value = null
  importProgress.value = 0
  importStatus.value = '正在读取文件...'
  importDetails.value = null
  
  try {
    importProgress.value = 10
    const text = await file.text()
    
    importProgress.value = 20
    importStatus.value = '正在解析数据...'
    
    if (file.name.endsWith('.json')) {
      await importJSON(text)
    } else if (file.name.endsWith('.html') || file.name.endsWith('.htm')) {
      await importHTML(text)
    } else {
      throw new Error('不支持的文件格式')
    }
  } catch (error) {
    if (error.message === 'Token expired') {
      importResult.value = { success: false, message: '❌ 登录已过期，请重新登录' }
    } else {
      importResult.value = { success: false, message: '❌ 导入失败：' + error.message }
    }
    importProgress.value = 0
    importStatus.value = ''
  } finally {
    importing.value = false
    fileInput.value.value = ''
  }
}

// 导入 JSON
const importJSON = async (text) => {
  const data = JSON.parse(text)
  
  // 验证数据格式
  if (!data.categories || !data.bookmarks) {
    throw new Error('无效的 JSON 格式')
  }
  
  console.log(`Importing JSON: ${data.categories.length} categories, ${data.bookmarks.length} bookmarks`)
  
  importProgress.value = 40
  importStatus.value = `正在上传 ${data.categories.length} 个分类和 ${data.bookmarks.length} 个书签...`
  
  // 调用批量导入 API
  const response = await apiRequest('/api/import', {
    method: 'POST',
    body: JSON.stringify({
      categories: data.categories,
      bookmarks: data.bookmarks
    })
  })
  
  importProgress.value = 80
  importStatus.value = '正在处理导入数据...'
  
  const result = await response.json()
  
  if (result.success) {
    importProgress.value = 100
    importStatus.value = '导入完成！'
    
    const msg = `✅ 导入成功！\n\n新增：${result.imported.categories} 个分类，${result.imported.bookmarks} 个书签\n跳过：${result.skipped.categories} 个分类，${result.skipped.bookmarks} 个书签（已存在）`
    importResult.value = { success: true, message: msg }
    
    // 处理详细信息
    if (result.details) {
      importDetails.value = {
        skippedItems: result.details.skippedItems || [],
        showDetails: false
      }
    }
    
    // 刷新数据但不重载页面
    setTimeout(async () => {
      await fetchData()
    }, 1500)
  } else {
    throw new Error(result.error || '导入失败')
  }
}

// 导入 HTML
const importHTML = async (text) => {
  const parser = new DOMParser()
  const doc = parser.parseFromString(text, 'text/html')
  
  const categories = []
  const bookmarks = []
  let categoryPosition = 0
  
  // 改进的递归解析函数 - 正确处理嵌套分类
  const parseBookmarkNode = (node, currentCategoryId = null, depth = 0) => {
    // 防止过深的递归
    if (depth > 10) return
    
    const children = Array.from(node.children)
    
    for (let i = 0; i < children.length; i++) {
      const child = children[i]
      
      // 找到分类标题 (H3)
      if (child.tagName === 'H3') {
        const categoryName = child.textContent.trim()
        
        // 跳过空分类名和常见的顶级容器名
        if (!categoryName || 
            categoryName === '书签栏' || 
            categoryName === 'Bookmarks' ||
            categoryName === 'Bookmarks Toolbar' ||
            categoryName === 'Bookmarks Menu') {
          continue
        }
        
        // 创建新分类
        const categoryId = categories.length + 1
        categories.push({
          id: categoryId,
          name: categoryName,
          position: categoryPosition++
        })
        
        // 找到该分类下的 DL 容器
        let dlElement = children[i + 1]
        while (dlElement && dlElement.tagName !== 'DL') {
          dlElement = dlElement.nextElementSibling
        }
        
        if (dlElement) {
          // 递归处理该分类下的内容，传递新的categoryId
          parseBookmarkNode(dlElement, categoryId, depth + 1)
        }
      }
      // 找到书签链接 (DT > A)
      else if (child.tagName === 'DT') {
        // 检查DT下是否有A标签（书签）
        const linkElement = child.querySelector('A')
        if (linkElement && currentCategoryId) {
          const url = linkElement.getAttribute('HREF') || linkElement.getAttribute('href')
          const name = linkElement.textContent.trim()
          
          // 只导入http/https链接，跳过javascript:等
          if (url && name && (url.startsWith('http://') || url.startsWith('https://'))) {
            // 查找描述（在下一个DD元素中）
            let description = ''
            const nextEl = children[i + 1]
            if (nextEl && nextEl.tagName === 'DD') {
              description = nextEl.textContent.trim()
            }
            
            bookmarks.push({
              id: bookmarks.length + 1,
              name: name,
              url: url,
              description: description || null,
              icon: null,
              category_id: currentCategoryId,
              position: bookmarks.filter(b => b.category_id === currentCategoryId).length,
              is_private: 0
            })
          }
        }
        // 检查DT下是否有H3（嵌套分类）
        else if (child.querySelector('H3')) {
          // 递归处理DT，但不传递currentCategoryId，让H3创建新分类
          parseBookmarkNode(child, null, depth)
        }
      }
      // 递归处理 DL 容器
      else if (child.tagName === 'DL') {
        parseBookmarkNode(child, currentCategoryId, depth + 1)
      }
    }
  }
  
  // 从 body 开始解析
  parseBookmarkNode(doc.body)
  
  console.log(`Parsed HTML: ${categories.length} categories, ${bookmarks.length} bookmarks`)
  
  if (categories.length === 0 && bookmarks.length === 0) {
    throw new Error('未找到有效的书签数据')
  }
  
  importProgress.value = 40
  importStatus.value = `正在上传 ${categories.length} 个分类和 ${bookmarks.length} 个书签...`
  
  // 调用批量导入 API
  const response = await apiRequest('/api/import', {
    method: 'POST',
    body: JSON.stringify({
      categories: categories,
      bookmarks: bookmarks
    })
  })
  
  importProgress.value = 80
  importStatus.value = '正在处理导入数据...'
  
  const result = await response.json()
  
  if (result.success) {
    importProgress.value = 100
    importStatus.value = '导入完成！'
    
    const msg = `✅ 导入成功！\n\n解析：${categories.length} 个分类，${bookmarks.length} 个书签\n新增：${result.imported.categories} 个分类，${result.imported.bookmarks} 个书签\n跳过：${result.skipped.categories} 个分类，${result.skipped.bookmarks} 个书签（已存在）`
    importResult.value = { success: true, message: msg }
    
    // 处理详细信息
    if (result.details) {
      importDetails.value = {
        skippedItems: result.details.skippedItems || [],
        showDetails: false
      }
    }
    
    // 刷新数据但不重载页面
    setTimeout(async () => {
      await fetchData()
    }, 1500)
  } else {
    throw new Error(result.error || '导入失败')
  }
}

defineExpose({
  open,
  close
})
</script>

<style scoped>
.import-export-dialog {
  max-width: 500px;
}

/* 确保导入导出对话框显示在设置页面之上 */
.dialog-overlay {
  z-index: 4000 !important;
}

.export-section,
.import-section {
  margin-bottom: 1.5rem;
}

.export-section h4,
.import-section h4 {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--text);
}

.section-description {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 1rem;
}

.button-group {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.button-group .btn {
  flex: 1;
  min-width: 140px;
}

.button-group .btn svg {
  width: 16px;
  height: 16px;
  stroke-width: 2;
}

.divider {
  height: 1px;
  background: var(--border);
  margin: 1.5rem 0;
}

.import-status {
  margin-top: 0.75rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.import-result {
  margin-top: 0.75rem;
  padding: 0.75rem;
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
}

.import-result.success {
  background: rgba(16, 185, 129, 0.1);
  color: var(--success);
}

.import-result.error {
  background: rgba(239, 68, 68, 0.1);
  color: var(--danger);
}

.import-notice {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: rgba(59, 130, 246, 0.1);
  border-radius: var(--radius-sm);
  margin-bottom: 1rem;
  font-size: 0.875rem;
  color: var(--primary);
}

.import-notice svg {
  width: 18px;
  height: 18px;
  stroke-width: 2;
  flex-shrink: 0;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 导入按钮样式优化 */
.import-button-wrapper {
  margin-top: 1rem;
}

.import-file-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  border: none;
  border-radius: var(--radius);
  color: white;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.import-file-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
}

.import-file-btn:active:not(:disabled) {
  transform: translateY(0);
}

.import-file-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.import-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-sm);
  flex-shrink: 0;
}

.import-icon svg {
  width: 24px;
  height: 24px;
  stroke-width: 2.5;
}

.import-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.25rem;
  flex: 1;
}

.import-title {
  font-size: 1rem;
  font-weight: 600;
  color: white;
}

.import-subtitle {
  font-size: 0.8125rem;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 400;
}

/* 进度条样式 */
.import-progress {
  margin-top: 1rem;
}

.progress-bar-container {
  width: 100%;
  height: 8px;
  background: var(--border);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--primary), #60a5fa);
  transition: width 0.3s ease;
  border-radius: 4px;
}

.progress-text {
  font-size: 0.875rem;
  color: var(--text-secondary);
  text-align: center;
  margin: 0;
}

/* 导入结果详情 */
.result-message {
  margin: 0;
  white-space: pre-line;
}

.import-details {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border);
}

.btn-toggle-details {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: transparent;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
  justify-content: center;
}

.btn-toggle-details:hover {
  background: var(--hover-bg);
  border-color: var(--primary);
  color: var(--primary);
}

.btn-toggle-details svg {
  width: 16px;
  height: 16px;
  stroke-width: 2;
  transition: transform 0.2s;
}

.details-list {
  margin-top: 0.75rem;
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 0.5rem;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-bottom: 1px solid var(--border);
  font-size: 0.875rem;
}

.detail-item:last-child {
  border-bottom: none;
}

.item-type {
  flex-shrink: 0;
  font-size: 1rem;
}

.item-name {
  flex: 1;
  font-weight: 500;
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-reason {
  flex-shrink: 0;
  color: var(--text-secondary);
  font-size: 0.8125rem;
  padding: 0.25rem 0.5rem;
  background: rgba(0, 0, 0, 0.05);
  border-radius: var(--radius-sm);
}

/* 深色模式下的调整 */
@media (prefers-color-scheme: dark) {
  .item-reason {
    background: rgba(255, 255, 255, 0.1);
  }
}
</style>

