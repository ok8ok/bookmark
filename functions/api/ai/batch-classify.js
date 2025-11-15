import { callOpenAI, getAIConfig } from './_shared.js'

function extractJson(text) {
  if (!text) return null
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) return null
  try {
    return JSON.parse(match[0])
  } catch (error) {
    return null
  }
}

export async function onRequestPost(context) {
  const { request, env } = context

  try {
    const { bookmarks, categories } = await request.json()

    if (!Array.isArray(bookmarks) || bookmarks.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing bookmarks array'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    if (!Array.isArray(categories) || categories.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing categories array'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const config = await getAIConfig(env)
    
    // 准备分类列表
    const categoryList = categories
      .map(cat => `${cat.id}: ${cat.path || cat.name}`)
      .join('\n')
    
    const promptTemplate = `You are helping to organize bookmarks into categories. Choose the most suitable existing category ID based on the bookmark information.

    Bookmark:
    - Name: {name}
    - URL: {url}
    - Description: {description}

    Existing categories (ID: Name or path):
    {categories}

    Return a JSON object with the fields "categoryId" (must be one of the provided IDs) and "reason" (a short explanation in the same language as the bookmark name).`
    
    const results = []
    let successCount = 0
    let failedCount = 0

    for (const bookmark of bookmarks) {
      try {
        // 替换变量
        const prompt = promptTemplate
          .replace(/\{name\}/g, bookmark.name)
          .replace(/\{url\}/g, bookmark.url)
          .replace(/\{description\}/g, bookmark.description || 'N/A')
          .replace(/\{categories\}/g, categoryList)

        const response = await callOpenAI(env, {
          path: 'chat/completions',
          method: 'POST',
          body: {
            model: config.model,
            messages: [
              {
                role: 'system',
                content: 'You are an assistant that selects the most appropriate bookmark category and explains the reasoning.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.3,
            max_tokens: 180
          }
        })

        const data = await response.json()
        const message = data.choices?.[0]?.message?.content
        const parsed = extractJson(message)

        if (!parsed || !parsed.categoryId) {
          results.push({
            id: bookmark.id,
            success: false,
            error: 'AI could not determine a category'
          })
          failedCount++
        } else {
          const categoryId = Number.parseInt(parsed.categoryId, 10)
          if (!Number.isInteger(categoryId)) {
            results.push({
              id: bookmark.id,
              success: false,
              error: 'AI returned an invalid category ID'
            })
            failedCount++
          } else {
            results.push({
              id: bookmark.id,
              success: true,
              categoryId,
              reason: parsed.reason || ''
            })
            successCount++
          }
        }
      } catch (error) {
        console.error(`Failed to classify bookmark ${bookmark.id}:`, error)
        results.push({
          id: bookmark.id,
          success: false,
          error: error.message || 'Failed to classify'
        })
        failedCount++
      }

      // 延迟以避免API速率限制
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
    console.error('AI batch classify error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to batch classify'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
