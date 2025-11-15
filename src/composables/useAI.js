import { ref } from 'vue'
import { useAuth } from './useAuth'

const aiEnabled = ref(false)
const aiSource = ref('none')
const aiApiKey = ref('')
const aiBaseUrl = ref('')

export function useAI() {
  const { apiRequest } = useAuth()

  const checkAIAvailability = async () => {
    try {
      const response = await apiRequest('/api/ai/status', {
        method: 'GET'
      })
      
      const result = await response.json()
      if (result.success) {
        aiEnabled.value = result.enabled
        aiSource.value = result.source || 'none'
        return { success: true, enabled: result.enabled, source: result.source }
      }
      return { success: false, enabled: false }
    } catch (error) {
      aiEnabled.value = false
      aiSource.value = 'none'
      return { success: false, enabled: false }
    }
  }

  const generateDescription = async (name, url) => {
    try {
      const response = await apiRequest('/api/ai/generate-description', {
        method: 'POST',
        body: JSON.stringify({ name, url })
      })
      
      const result = await response.json()
      if (result.success) {
        return { success: true, description: result.description }
      }
      return { success: false, error: result.error || '生成失败' }
    } catch (error) {
      if (error.message === 'Token expired') {
        return { success: false, error: '登录已过期，请重新登录' }
      }
      return { success: false, error: '网络错误' }
    }
  }

  const suggestCategory = async (name, url, description, categories) => {
    try {
      const response = await apiRequest('/api/ai/suggest-category', {
        method: 'POST',
        body: JSON.stringify({ name, url, description, categories })
      })
      
      const result = await response.json()
      if (result.success) {
        return { success: true, categoryId: result.categoryId, reason: result.reason }
      }
      return { success: false, error: result.error || '推荐失败' }
    } catch (error) {
      if (error.message === 'Token expired') {
        return { success: false, error: '登录已过期，请重新登录' }
      }
      return { success: false, error: '网络错误' }
    }
  }

  const batchGenerateDescriptions = async (bookmarks) => {
    try {
      const response = await apiRequest('/api/ai/batch-generate-descriptions', {
        method: 'POST',
        body: JSON.stringify({ bookmarks })
      })
      
      const result = await response.json()
      if (result.success) {
        return { 
          success: true, 
          results: result.results,
          successCount: result.successCount,
          failedCount: result.failedCount
        }
      }
      return { success: false, error: result.error || '批量生成失败' }
    } catch (error) {
      if (error.message === 'Token expired') {
        return { success: false, error: '登录已过期，请重新登录' }
      }
      return { success: false, error: '网络错误' }
    }
  }

  const batchClassify = async (bookmarks, categories) => {
    try {
      const response = await apiRequest('/api/ai/batch-classify', {
        method: 'POST',
        body: JSON.stringify({ bookmarks, categories })
      })
      
      const result = await response.json()
      if (result.success) {
        return { 
          success: true, 
          results: result.results,
          successCount: result.successCount,
          failedCount: result.failedCount
        }
      }
      return { success: false, error: result.error || '批量分类失败' }
    } catch (error) {
      if (error.message === 'Token expired') {
        return { success: false, error: '登录已过期，请重新登录' }
      }
      return { success: false, error: '网络错误' }
    }
  }

  const saveAISettings = async (settings) => {
    try {
      const response = await apiRequest('/api/ai/settings', {
        method: 'POST',
        body: JSON.stringify(settings)
      })
      
      const result = await response.json()
      if (result.success) {
        await checkAIAvailability()
        return { success: true }
      }
      return { success: false, error: result.error || '保存失败' }
    } catch (error) {
      if (error.message === 'Token expired') {
        return { success: false, error: '登录已过期，请重新登录' }
      }
      return { success: false, error: '网络错误' }
    }
  }

  const getAISettings = async () => {
    try {
      const response = await apiRequest('/api/ai/settings', {
        method: 'GET'
      })
      
      const result = await response.json()
      if (result.success) {
        aiApiKey.value = result.apiKey || ''
        aiBaseUrl.value = result.baseUrl || ''
        if (result.source) {
          aiSource.value = result.source
        }
        return { 
          success: true, 
          apiKey: result.apiKey || '',
          baseUrl: result.baseUrl || 'https://api.openai.com/v1',
          model: result.model || 'gpt-4o-mini',
          authHeader: result.authHeader || 'Authorization',
          authPrefix: result.authPrefix !== undefined ? result.authPrefix : 'Bearer ',
          hasApiKey: !!result.hasApiKey,
          lockedFields: result.lockedFields || {},
          customPromptDescriptionEnabled: result.customPromptDescriptionEnabled || false,
          customPromptDescription: result.customPromptDescription || ''
        }
      }
      return { success: false, error: result.error || '获取失败' }
    } catch (error) {
      if (error.message === 'Token expired') {
        return { success: false, error: '登录已过期，请重新登录' }
      }
      return { success: false, error: '网络错误' }
    }
  }

  const verifyApiKey = async (apiKey, baseUrl, model) => {
    try {
      const response = await apiRequest('/api/ai/verify', {
        method: 'POST',
        body: JSON.stringify({ apiKey, baseUrl, model })
      })
      
      const result = await response.json()
      return { 
        success: result.success, 
        valid: result.valid, 
        message: result.message 
      }
    } catch (error) {
      return { 
        success: false, 
        valid: false, 
        message: error.message || '验证失败' 
      }
    }
  }

  return {
    aiEnabled,
    aiSource,
    aiApiKey,
    aiBaseUrl,
    checkAIAvailability,
    generateDescription,
    suggestCategory,
    batchGenerateDescriptions,
    batchClassify,
    saveAISettings,
    getAISettings,
    verifyApiKey
  }
}
