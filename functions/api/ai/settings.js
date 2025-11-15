export async function onRequestGet(context) {
  const { env } = context;
  
  try {
    const results = await env.DB.prepare(
      'SELECT key, value FROM settings WHERE key IN (?, ?, ?, ?, ?, ?, ?)'
    ).bind(
      'secret_openai_api_key', 
      'ai_base_url', 
      'ai_model', 
      'ai_auth_header', 
      'ai_auth_prefix',
      'ai_custom_prompt_description',
      'ai_custom_prompt_description_enabled'
    ).all();
    
    const settings = {};
    results.results.forEach(row => {
      settings[row.key] = row.value;
    });
    
    // Check which parameters are configured via environment variables
    const lockedFields = {
      apiKey: !!env.OPENAI_API_KEY,
      baseUrl: !!env.OPENAI_BASE_URL,
      model: !!env.OPENAI_MODEL,
      authHeader: !!env.OPENAI_AUTH_HEADER,
      authPrefix: env.OPENAI_AUTH_PREFIX !== undefined
    };
    
    // Use environment variable values if available, otherwise use database values
    // API Key is never returned for security reasons
    const apiKey = '';
    const baseUrl = env.OPENAI_BASE_URL 
      || settings.ai_base_url 
      || 'https://api.openai.com/v1';
    const model = env.OPENAI_MODEL 
      || settings.ai_model 
      || 'gpt-4o-mini';
    const authHeader = env.OPENAI_AUTH_HEADER 
      || settings.ai_auth_header 
      || 'Authorization';
    const authPrefix = env.OPENAI_AUTH_PREFIX !== undefined
      ? env.OPENAI_AUTH_PREFIX
      : (settings.ai_auth_prefix !== undefined ? settings.ai_auth_prefix : 'Bearer ');
    
    return new Response(JSON.stringify({
      success: true,
      apiKey,
      baseUrl,
      model,
      authHeader,
      authPrefix,
      hasApiKey: !!env.OPENAI_API_KEY || !!settings.secret_openai_api_key,
      lockedFields,
      customPromptDescription: settings.ai_custom_prompt_description || '',
      customPromptDescriptionEnabled: settings.ai_custom_prompt_description_enabled === 'true'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      success: false,
      error: 'Failed to fetch AI settings' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    const { 
      apiKey, baseUrl, model, authHeader, authPrefix, 
      customPromptDescription, customPromptDescriptionEnabled
    } = await request.json();
    
    const statements = [];
    
    // Only allow updating fields that are not locked by environment variables
    if (apiKey !== undefined && !env.OPENAI_API_KEY) {
      if (apiKey) {
        statements.push(
          env.DB.prepare(
            'INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)'
          ).bind('secret_openai_api_key', apiKey)
        );
      } else {
        statements.push(
          env.DB.prepare('DELETE FROM settings WHERE key = ?')
            .bind('secret_openai_api_key')
        );
      }
    }
    
    if (baseUrl !== undefined && !env.OPENAI_BASE_URL) {
      if (baseUrl) {
        statements.push(
          env.DB.prepare(
            'INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)'
          ).bind('ai_base_url', baseUrl)
        );
      } else {
        statements.push(
          env.DB.prepare('DELETE FROM settings WHERE key = ?')
            .bind('ai_base_url')
        );
      }
    }
    
    if (model !== undefined && !env.OPENAI_MODEL) {
      if (model) {
        statements.push(
          env.DB.prepare(
            'INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)'
          ).bind('ai_model', model)
        );
      } else {
        statements.push(
          env.DB.prepare('DELETE FROM settings WHERE key = ?')
            .bind('ai_model')
        );
      }
    }
    
    if (authHeader !== undefined && !env.OPENAI_AUTH_HEADER) {
      if (authHeader) {
        statements.push(
          env.DB.prepare(
            'INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)'
          ).bind('ai_auth_header', authHeader)
        );
      } else {
        statements.push(
          env.DB.prepare('DELETE FROM settings WHERE key = ?')
            .bind('ai_auth_header')
        );
      }
    }
    
    if (authPrefix !== undefined && env.OPENAI_AUTH_PREFIX === undefined) {
      statements.push(
        env.DB.prepare(
          'INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)'
        ).bind('ai_auth_prefix', authPrefix)
      );
    }
    
    if (customPromptDescription !== undefined) {
      if (customPromptDescription && customPromptDescription.trim()) {
        statements.push(
          env.DB.prepare(
            'INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)'
          ).bind('ai_custom_prompt_description', customPromptDescription)
        );
      } else {
        statements.push(
          env.DB.prepare('DELETE FROM settings WHERE key = ?')
            .bind('ai_custom_prompt_description')
        );
      }
    }
    
    if (customPromptDescriptionEnabled !== undefined) {
      statements.push(
        env.DB.prepare(
          'INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)'
        ).bind('ai_custom_prompt_description_enabled', customPromptDescriptionEnabled ? 'true' : 'false')
      );
    }
    
    if (statements.length > 0) {
      await env.DB.batch(statements);
    }
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      success: false,
      error: 'Failed to update AI settings' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
