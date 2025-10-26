import { ref, onMounted, computed } from 'vue'

// 当前版本（从 package.json 获取）
const CURRENT_VERSION = '1.2.1'

// 响应式状态
const latestVersion = ref(null)
const hasUpdate = ref(false)
const updateInfo = ref(null)
const isChecking = ref(false)
const lastCheckTime = ref(null)
const error = ref(null)

export function useVersion() {
  // 检查更新
  const checkForUpdates = async () => {
    isChecking.value = true
    error.value = null
    
    try {
      // 通过 GitHub API 获取最新版本
      const response = await fetch('https://api.github.com/repos/deerwan/nav/releases/latest')
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      if (data.tag_name) {
        latestVersion.value = data.tag_name.replace('v', '')
        updateInfo.value = {
          version: data.tag_name,
          published_at: data.published_at,
          body: data.body,
          html_url: data.html_url,
          assets: data.assets || []
        }
        
        // 比较版本号
        hasUpdate.value = compareVersions(latestVersion.value, CURRENT_VERSION) > 0
        
        lastCheckTime.value = new Date().toISOString()
        
        // 保存到 localStorage
        localStorage.setItem('lastVersionCheck', lastCheckTime.value)
        localStorage.setItem('latestVersion', latestVersion.value)
        localStorage.setItem('hasUpdate', hasUpdate.value.toString())
        localStorage.setItem('updateInfo', JSON.stringify(updateInfo.value))
        
        return {
          hasUpdate: hasUpdate.value,
          latestVersion: latestVersion.value,
          updateInfo: updateInfo.value
        }
      }
    } catch (err) {
      error.value = err.message
      console.error('检查更新失败:', err)
    } finally {
      isChecking.value = false
    }
  }
  
  // 版本号比较函数
  const compareVersions = (version1, version2) => {
    const v1 = version1.split('.').map(Number)
    const v2 = version2.split('.').map(Number)
    
    for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
      const num1 = v1[i] || 0
      const num2 = v2[i] || 0
      
      if (num1 > num2) return 1
      if (num1 < num2) return -1
    }
    return 0
  }
  
  // 从 localStorage 恢复状态
  const loadCachedVersion = () => {
    try {
      const cached = localStorage.getItem('lastVersionCheck')
      const cachedLatest = localStorage.getItem('latestVersion')
      const cachedHasUpdate = localStorage.getItem('hasUpdate')
      const cachedUpdateInfo = localStorage.getItem('updateInfo')
      
      if (cached) {
        lastCheckTime.value = cached
        latestVersion.value = cachedLatest
        hasUpdate.value = cachedHasUpdate === 'true'
        if (cachedUpdateInfo) {
          updateInfo.value = JSON.parse(cachedUpdateInfo)
        }
      }
    } catch (err) {
      console.error('加载缓存版本信息失败:', err)
    }
  }
  
  // 检查是否需要检查更新（每天检查一次）
  const shouldCheckForUpdates = () => {
    const lastCheck = localStorage.getItem('lastVersionCheck')
    if (!lastCheck) return true
    
    const lastCheckDate = new Date(lastCheck)
    const now = new Date()
    const diffInHours = (now - lastCheckDate) / (1000 * 60 * 60)
    
    return diffInHours >= 24 // 24小时检查一次
  }
  
  // 格式化更新时间
  const formatUpdateTime = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))
    
    if (diffInDays === 0) return '今天'
    if (diffInDays === 1) return '昨天'
    if (diffInDays < 7) return `${diffInDays}天前`
    return date.toLocaleDateString('zh-CN')
  }
  
  // 计算属性
  const updateStatus = computed(() => {
    if (isChecking.value) return '检查中...'
    if (error.value) return '检查失败'
    if (hasUpdate.value) return '有新版本'
    if (latestVersion.value && !hasUpdate.value) return '已是最新版本'
    return '未检查'
  })
  
  // 初始化函数
  const initialize = () => {
    loadCachedVersion()
    
    // 如果超过24小时没有检查，自动检查更新
    if (shouldCheckForUpdates()) {
      checkForUpdates()
    }
  }
  
  return {
    currentVersion: CURRENT_VERSION,
    latestVersion,
    hasUpdate,
    updateInfo,
    isChecking,
    lastCheckTime,
    error,
    updateStatus,
    checkForUpdates,
    formatUpdateTime,
    initialize
  }
}
