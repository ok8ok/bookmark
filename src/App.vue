<template>
  <div class="app">
    <!-- Header -->
    <header class="app-header">
      <div class="header-content">
        <h1 class="app-title">{{ customTitle }}</h1>
        
        <!-- 汉堡菜单按钮 -->
        <button class="mobile-menu-btn" @click.stop="showMobileMenu = !showMobileMenu">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M3 12h18M3 6h18M3 18h18"/>
          </svg>
        </button>
        
        <!-- 桌面端/移动端展开的操作按钮 -->
        <div class="header-actions" :class="{ 'mobile-menu-open': showMobileMenu }">
          <!-- Admin Controls in Header -->
          <template v-if="isAuthenticated">
            <button 
              class="btn btn-secondary"
              @click="settingsPage.open(); showMobileMenu = false"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"/>
              </svg>
              <span>设置</span>
            </button>
            
            <button 
              class="btn"
              :class="isEditMode ? 'btn-primary' : 'btn-secondary'"
              @click="isEditMode = !isEditMode; showMobileMenu = false"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              <span>{{ isEditMode ? '完成' : '编辑' }}</span>
            </button>
          </template>
          
          <button 
            v-if="!isAuthenticated" 
            class="btn btn-primary"
            @click="loginModal.open(); showMobileMenu = false"
          >
            登录
          </button>
          <button 
            v-else 
            class="btn btn-secondary"
            @click="handleLogout(); showMobileMenu = false"
          >
            退出
          </button>
        </div>
      </div>
      
      <div v-if="showSearch" class="header-search">
        <SearchBar />
      </div>
      
      <CategoryButtons />
      
      <!-- Edit Mode Toolbar -->
      <EditModeToolbar 
        :is-edit-mode="isEditMode"
        @addBookmark="handleAddBookmark"
        @addCategory="handleAddCategory"
      />
    </header>
    
    <!-- Main Content -->
    <main class="app-main">
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>加载中...</p>
      </div>
      
      <div v-else-if="!publicMode && !isAuthenticated" class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
        <p>需要登录才能访问</p>
        <p style="font-size: 0.9rem; margin-top: 0.5rem;">
          此书签站点处于非公开模式，请先登录
        </p>
        <button class="btn btn-primary" @click="loginModal.open()" style="margin-top: 1rem;">
          立即登录
        </button>
      </div>
      
      <div v-else-if="categories.length === 0" class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        </svg>
        <p>还没有分类和书签</p>
        <p v-if="isAuthenticated" style="font-size: 0.9rem; margin-top: 0.5rem; color: var(--text-secondary);">
          点击右上角 <strong style="color: var(--primary);">⚙️ 设置</strong> → <strong style="color: var(--primary);">📊 数据管理</strong> → <strong style="color: var(--primary);">导入书签</strong>
        </p>
        <p v-if="isAuthenticated" style="font-size: 0.875rem; margin-top: 0.75rem; color: var(--text-tertiary);">
          或点击 <strong style="color: var(--primary);">✏️ 编辑</strong> 按钮手动添加
        </p>
        <p v-else style="font-size: 0.9rem; margin-top: 0.5rem;">
          请先登录以管理书签
        </p>
        <button 
          v-if="isAuthenticated" 
          class="btn btn-primary" 
          @click="settingsPage.open(); setActiveSettingsTab('data')" 
          style="margin-top: 1.5rem;"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style="width: 18px; height: 18px;">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          快速导入书签
        </button>
      </div>
      
      <div v-else class="categories-container">
        <CategorySection
          v-for="category in categories"
          v-show="!hideEmptyCategories || (bookmarksByCategory[category.id]?.length > 0)"
          :key="category.id"
          :category="category"
          :bookmarks="bookmarksByCategory[category.id] || []"
          :is-edit-mode="isEditMode"
          @edit-category="handleEditCategory"
          @delete-category="handleDeleteCategory"
          @edit-bookmark="handleEditBookmark"
          @delete-bookmark="handleDeleteBookmark"
          @reorder-bookmarks="handleReorderBookmarks"
        />
      </div>
    </main>
    
    <!-- Footer -->
    <footer class="app-footer">
      <div class="footer-content" v-html="footerContent"></div>
    </footer>
    
    <!-- Floating Buttons -->
    <FloatingButtons />
    
    <!-- Modals -->
    <LoginModal ref="loginModal" />
    <BookmarkDialog ref="bookmarkDialog" />
    <ConfirmDialog ref="confirmDialog" />
    <PromptDialog ref="promptDialog" />
    <FooterEditDialog ref="footerEditDialog" />
    <ImportExportDialog ref="importExportDialog" />
    
    <!-- Settings Page -->
    <SettingsPage 
      ref="settingsPage"
      :is-dark="isDark"
      :bookmarks="bookmarks"
      :show-search="showSearch"
      :hide-empty-categories="hideEmptyCategories"
      :public-mode="publicMode"
      :custom-title="customTitle"
      :footer-content="footerContent"
      :active-settings-tab="activeSettingsTab"
      @action="handleSettingsAction"
      @toggle-theme="toggleTheme"
      @toggle-search="toggleSearch"
      @toggle-hide-empty="toggleHideEmptyCategories"
      @toggle-public-mode="togglePublicMode"
      @update-title="updateCustomTitle"
      @update-footer="updateFooterContent"
      @editTitle="handleEditTitle"
      @editFooter="handleEditFooter"
      @setActiveTab="setActiveSettingsTab"
    />
    
    <!-- Update Notification -->
    <UpdateNotification />
    
    <!-- Toast Notifications -->
    <ToastNotification ref="toast" />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { useAuth } from './composables/useAuth'
import { useBookmarks } from './composables/useBookmarks'
import { useTheme } from './composables/useTheme'
import { useSettings } from './composables/useSettings'
import { useToast } from './composables/useToast'
import SearchBar from './components/SearchBar.vue'
import CategoryButtons from './components/CategoryButtons.vue'
import CategorySection from './components/CategorySection.vue'
import FloatingButtons from './components/FloatingButtons.vue'
import EditModeToolbar from './components/EditModeToolbar.vue'
import SettingsPage from './components/SettingsPage.vue'
import LoginModal from './components/LoginModal.vue'
import BookmarkDialog from './components/BookmarkDialog.vue'
import ConfirmDialog from './components/ConfirmDialog.vue'
import PromptDialog from './components/PromptDialog.vue'
import FooterEditDialog from './components/FooterEditDialog.vue'
import ImportExportDialog from './components/ImportExportDialog.vue'
import UpdateNotification from './components/UpdateNotification.vue'
import ToastNotification from './components/ToastNotification.vue'

const { isAuthenticated, logout, onAuthChange } = useAuth()
const {
  categories,
  bookmarks,
  bookmarksByCategory,
  fetchData,
  addCategory,
  updateCategory,
  deleteCategory,
  updateBookmark,
  deleteBookmark,
  reorderItems
} = useBookmarks()
const { isDark, toggleTheme, loadThemeFromDB } = useTheme()
const { showSearch, hideEmptyCategories, customTitle, footerContent, activeSettingsTab, publicMode, toggleSearch, toggleHideEmptyCategories, togglePublicMode, updateCustomTitle, updateFooterContent, setActiveSettingsTab, loadSettingsFromDB } = useSettings()
const { setToastInstance, success: toastSuccess, error: toastError } = useToast()

const loading = ref(true)
const isEditMode = ref(false)
const showMobileMenu = ref(false)
const loginModal = ref(null)
const bookmarkDialog = ref(null)
const confirmDialog = ref(null)
const promptDialog = ref(null)
const footerEditDialog = ref(null)
const importExportDialog = ref(null)
const settingsPage = ref(null)
const toast = ref(null)

onMounted(async () => {
  await fetchData()
  // 初始化时加载设置（无论是否登录）
  await loadSettingsFromDB()
  await loadThemeFromDB()
  loading.value = false
  
  // 初始化 Toast
  if (toast.value) {
    setToastInstance(toast.value)
  }
  
  // 监听登录状态变化，重新获取数据
  onAuthChange(async () => {
    await fetchData()
    // 登录后重新加载设置（确保获取最新数据）
    await loadSettingsFromDB()
    await loadThemeFromDB()
  })
  
  // 监听自定义标题变化，更新页面标题
  watch(customTitle, (newTitle) => {
    document.title = newTitle
  }, { immediate: true })
  
  // 点击外部关闭汉堡菜单
  const handleClickOutside = (event) => {
    if (showMobileMenu.value && !event.target.closest('.header-content')) {
      showMobileMenu.value = false
    }
  }
  document.addEventListener('click', handleClickOutside)
  
  // 清理事件监听
  onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
  })
})

const handleLogout = async () => {
  const confirmed = await confirmDialog.value.open('确定要退出登录吗？')
  if (confirmed) {
    logout()
    isEditMode.value = false
    await fetchData()
  }
}

const handleSettingsAction = (action) => {
  switch (action) {
    case 'importExport':
      // 导入导出保持在设置页面内，不关闭设置页面
      importExportDialog.value.open()
      break
    case 'addBookmark':
      // 其他操作需要关闭设置页面
      settingsPage.value.close()
      setTimeout(() => {
        bookmarkDialog.value.open()
      }, 300)
      break
    case 'addCategory':
      // 其他操作需要关闭设置页面
      settingsPage.value.close()
      setTimeout(() => {
        handleAddCategory()
      }, 300)
      break
  }
}

const handleAddCategory = async () => {
  const name = await promptDialog.value.open('新建分类', '', '请输入分类名称')
  if (name) {
    const result = await addCategory(name)
    if (result.success) {
      toastSuccess('分类添加成功')
    } else {
      toastError(result.error || '添加分类失败')
    }
  }
}

const handleEditCategory = async (category) => {
  const name = await promptDialog.value.open('编辑分类', category.name, '请输入新的分类名称')
  if (name && name !== category.name) {
    const result = await updateCategory(category.id, name)
    if (result.success) {
      toastSuccess('分类已更新')
    } else {
      toastError(result.error || '更新分类失败')
    }
  }
}

const handleDeleteCategory = async (category) => {
  const confirmed = await confirmDialog.value.open(
    `确定要删除分类"${category.name}"吗？该分类下的所有书签也将被删除。`,
    '删除分类'
  )
  if (confirmed) {
    const result = await deleteCategory(category.id)
    if (result.success) {
      toastSuccess('分类已删除')
    } else {
      toastError(result.error || '删除分类失败')
    }
  }
}

const handleEditBookmark = (bookmark) => {
  bookmarkDialog.value.open(bookmark)
}

const handleDeleteBookmark = async (bookmark) => {
  const confirmed = await confirmDialog.value.open(
    `确定要删除书签"${bookmark.name}"吗？`,
    '删除书签'
  )
  if (confirmed) {
    const result = await deleteBookmark(bookmark.id)
    if (result.success) {
      toastSuccess('书签已删除')
    } else {
      toastError(result.error || '删除书签失败')
    }
  }
}

const handleReorderBookmarks = async (items) => {
  // 如果items包含category_id，说明是跨分类移动
  if (items[0]?.category_id) {
    const item = items[0]
    // 从所有书签中查找，而不是从目标分类中查找
    const bookmark = bookmarks.value.find(b => b.id === item.id)
    if (bookmark) {
      await updateBookmark(item.id, {
        ...bookmark,
        category_id: item.category_id,
        position: item.position
      })
    }
  } else {
    // 同分类内排序
    await reorderItems('bookmarks', items)
  }
}

const handleEditTitle = async () => {
  const newTitle = await promptDialog.value.open('自定义标题', customTitle.value, '请输入新的标题')
  if (newTitle && newTitle.trim()) {
    updateCustomTitle(newTitle.trim())
    toastSuccess('标题已更新')
  }
}

const handleEditFooter = async () => {
  const newFooter = await footerEditDialog.value.open('自定义页脚', footerContent.value, '请输入页脚HTML内容')
  if (newFooter !== null) {
    updateFooterContent(newFooter)
    toastSuccess('页脚已更新')
  }
}

const handleAddBookmark = () => {
  bookmarkDialog.value.open()
}
</script>

