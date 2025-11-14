import { callOpenAI, getAIConfig } from './_shared.js'

export async function onRequestPost(context) {
  const { request, env } = context

  try {
    const { bookmarks } = await request.json()

    if (!Array.isArray(bookmarks) || bookmarks.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing bookmarks array'
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

Return only the description text, without any additional formatting or quotes.`
    
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
    
    const results = []
    let successCount = 0
    let failedCount = 0

    for (const bookmark of bookmarks) {
      try {
        // 替换变量
        const prompt = promptTemplate
          .replace(/\{name\}/g, bookmark.name)
          .replace(/\{url\}/g, bookmark.url)

        const response = await callOpenAI(env, {
          path: 'chat/completions',
          method: 'POST',
          body: {
            model: config.model,
            messages: [
              {
                role: 'system',
                content: 'You are a helpful assistant that generates concise bookmark descriptions.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.7,
            max_tokens: 150
          }
        })

        const data = await response.json()
        const description = data.choices?.[0]?.message?.content?.trim()

        if (description) {
          results.push({
            id: bookmark.id,
            success: true,
            description
          })
          successCount++
        } else {
          results.push({
            id: bookmark.id,
            success: false,
            error: 'No description generated'
          })
          failedCount++
        }
      } catch (error) {
        console.error(`Failed to generate description for bookmark ${bookmark.id}:`, error)
        results.push({
          id: bookmark.id,
          success: false,
          error: error.message || 'Failed to generate description'
        })
        failedCount++
      }

      await new Promise(resolve => setTimeout(resolve, 500))
    }

    return new Response(JSON.stringify({
      success: true,
      results,
      successCount,
      failedCount
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('AI batch generate descriptions error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to batch generate descriptions'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
