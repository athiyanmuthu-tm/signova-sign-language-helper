// ============================================================
// AI CHAT
// Sends messages to AI and gets response
// ============================================================

// URL for the AI service
const AI_URL = import.meta.env.VITE_SUPABASE_URL + '/functions/v1'

// The anonymous key needed by Supabase to accept our request
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// ----------------------------------------------------------
// Send messages to AI and get response
// ----------------------------------------------------------
export async function chat(settings) {
  // Get the messages and settings
  const messages = settings.messages
  const maxTokens = settings.maxTokens || 900
  const temperature = settings.temperature || 0.6
  
  // Send request to AI
  const response = await fetch(AI_URL + '/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: ANON_KEY
    },
    body: JSON.stringify({
      messages: messages,
      maxTokens: maxTokens,
      temperature: temperature
    })
  })
  
  // Parse response
  const data = await response.json().catch(function() {
    return null
  })
  
  // Check for errors
  if (!response.ok || (data && data.error)) {
    let errorMessage
    if (data && data.error) {
      if (typeof data.error === 'string') {
        errorMessage = data.error
      } else if (data.error.message) {
        errorMessage = data.error.message
      } else {
        errorMessage = JSON.stringify(data.error)
      }
    }
    if (!errorMessage) {
      errorMessage = 'AI error: ' + response.status
    }
    throw new Error(errorMessage)
  }
  
  // Get the text from response
  const text = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || (data.content || '')
  
  // Return as string
  return {
    text: typeof text === 'string' ? text : JSON.stringify(text)
  }
}

// ----------------------------------------------------------
// Check if AI is working
// ----------------------------------------------------------
export async function check() {
  try {
    // Send a simple test message
    const response = await fetch(AI_URL + '/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: ANON_KEY
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'ping' }],
        maxTokens: 1
      })
    })
    
    // Check if response is OK
    const isOk = response.ok || response.status === 502
    return { ok: isOk }
    
  } catch (error) {
    return { ok: false }
  }
}
