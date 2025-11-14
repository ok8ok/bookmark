import { callOpenAI, getAIConfig } from './_shared.js'

export async function onRequestPost(context) {
  const { request, env } = context

  try {
    const { name, url } = await request.json()

    if (!name || !url) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing name or url'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const config = await getAIConfig(env)
    
    // 默认 Prompt
    const defaultPrompt = `You are an assistant that generates concise and helpful descriptions for bookmarks/websites.

Given the following bookmark information:
Name: {name}
URL: {url}

Please generate a brief, useful description (1-2 sentences, max 100 words) that explains what this website/resource is about. The description should be clear, informative, and help users understand the purpose or content of the site.

Language requirement: Respond in the same language as the bookmark name if it is clearly identifiable; otherwise, respond in Simplified Chinese. Return only the description text, without any additional formatting or quotes.`
    
    // 获取自定义 Prompt 配置和开关状态（优先使用描述专用提示词）
    const settingsResults = await env.DB.prepare(
      'SELECT key, value FROM settings WHERE key IN (?, ?)'
    ).bind('ai_custom_prompt_description', 'ai_custom_prompt_description_enabled').all()
    
    const settings = {}
    settingsResults.results.forEach(row => {
      settings[row.key] = row.value
    })
    
    const customPromptEnabled = settings.ai_custom_prompt_description_enabled === 'true'
    const customPrompt = settings.ai_custom_prompt_description
    const promptTemplate = (customPromptEnabled && customPrompt && customPrompt.trim()) ? customPrompt : defaultPrompt
    
    // 替换变量
    const prompt = promptTemplate
      .replace(/\{name\}/g, name)
      .replace(/\{url\}/g, url)

    const response = await callOpenAI(env, {
      path: 'chat/completions',
      method: 'POST',
      body: {
        model: config.model,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that generates concise bookmark descriptions. Always reply in the same language as the user/bookmark context; if uncertain, use Simplified Chinese.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.5,
        max_tokens: 150
      }
    })

    const data = await response.json()
    const description = data.choices?.[0]?.message?.content?.trim()

    if (!description) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No description generated'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({
      success: true,
      description
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('AI generate description error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to generate description'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
