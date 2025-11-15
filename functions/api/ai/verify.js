import { joinBaseUrl } from './_shared.js'

async function fetchSettings(env, keys) {
  if (!keys.length) return {}
  const placeholders = keys.map(() => '?').join(', ')
  const statement = `SELECT key, value FROM settings WHERE key IN (${placeholders})`
  const values = await env.DB.prepare(statement).bind(...keys).all()
  const map = {}
  values.results.forEach(row => {
    map[row.key] = row.value
  })
  return map
}

export async function onRequestPost(context) {
  const { request, env } = context

  try {
    const { apiKey, baseUrl, model } = await request.json()

    if (!apiKey) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing API key'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const settings = await fetchSettings(env, [
      'ai_auth_header',
      'ai_auth_prefix'
    ])

    const finalBaseUrl = baseUrl || 'https://api.openai.com/v1'
    const finalModel = model || 'gpt-4o-mini'
    const authHeader = settings.ai_auth_header || 'Authorization'
    const authPrefix = settings.ai_auth_prefix !== undefined ? settings.ai_auth_prefix : 'Bearer '

    const url = joinBaseUrl(finalBaseUrl, '/models')

    const finalHeaders = new Headers()
    finalHeaders.set(authHeader, `${authPrefix || ''}${apiKey}`)
    finalHeaders.set('Content-Type', 'application/json')

    const response = await fetch(url, {
      method: 'GET',
      headers: finalHeaders
    })

    if (response.ok) {
      return new Response(JSON.stringify({
        success: true,
        valid: true,
        message: 'API key is valid'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    } else if (response.status === 401 || response.status === 403) {
      return new Response(JSON.stringify({
        success: true,
        valid: false,
        message: 'API key is invalid or unauthorized'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    } else {
      let errorMsg = `API request failed with status ${response.status}`
      try {
        const errorData = await response.json()
        errorMsg = errorData.error?.message || errorData.error || errorMsg
      } catch (err) {
        // ignore parsing error
      }
      return new Response(JSON.stringify({
        success: true,
        valid: false,
        message: errorMsg
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  } catch (error) {
    return new Response(JSON.stringify({
      success: true,
      valid: false,
      message: error.message || 'Failed to verify API key'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
