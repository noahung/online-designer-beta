import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || ''
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase configuration')
}

const supabase = createClient(supabaseUrl, supabaseKey)

export default async function handler(req, res) {
  console.log('🔍 [WEBHOOK SUBSCRIBE] Request received:', {
    method: req.method,
    url: req.url,
    headers: req.headers,
    body: req.body
  })

  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    console.log('🔍 [WEBHOOK SUBSCRIBE] CORS preflight request handled')
    res.status(200).end()
    return
  }

  if (req.method !== 'POST') {
    console.log('❌ [WEBHOOK SUBSCRIBE] Invalid method:', req.method)
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { target_url, form_id, api_key } = req.body
    console.log('🔍 [WEBHOOK SUBSCRIBE] Extracted parameters:', {
      target_url: target_url ? 'provided' : 'missing',
      form_id: form_id ? 'provided' : 'missing',
      api_key: api_key ? 'provided' : 'missing'
    })

    if (!form_id || !api_key) {
      console.log('❌ [WEBHOOK SUBSCRIBE] Missing required parameters')
      return res.status(400).json({ error: 'Missing required parameters: form_id and api_key' })
    }

    console.log('🔍 [WEBHOOK SUBSCRIBE] Validating API key...')
    // Find user by API key
    const { data: settings, error: settingsError } = await supabase
      .from('user_settings')
      .select('user_id')
      .eq('api_key', api_key)
      .maybeSingle()

    if (settingsError) {
      console.log('❌ [WEBHOOK SUBSCRIBE] API key validation error:', settingsError)
      return res.status(401).json({ error: 'Invalid API key' })
    }

    if (!settings) {
      console.log('❌ [WEBHOOK SUBSCRIBE] No user found for API key')
      return res.status(401).json({ error: 'Invalid API key' })
    }

    console.log('✅ [WEBHOOK SUBSCRIBE] API key valid, user_id:', settings.user_id)

    console.log('🔍 [WEBHOOK SUBSCRIBE] Validating form access...')
    // Verify form belongs to user and get client info
    const { data: form, error: formError } = await supabase
      .from('forms')
      .select(`
        id,
        client_id,
        clients (
          id,
          name,
          webhook_url
        )
      `)
      .eq('id', form_id)
      .eq('user_id', settings.user_id)
      .single()

    if (formError) {
      console.log('❌ [WEBHOOK SUBSCRIBE] Form access error:', formError)
      return res.status(404).json({ error: 'Form not found or access denied' })
    }

    if (!form) {
      console.log('❌ [WEBHOOK SUBSCRIBE] Form not found')
      return res.status(404).json({ error: 'Form not found or access denied' })
    }

    console.log('✅ [WEBHOOK SUBSCRIBE] Form access valid:', {
      form_id: form.id,
      client_id: form.client_id,
      client_name: form.clients?.name
    })

    // Check if client has webhook URL configured
    const clientWebhookUrl = form.clients?.webhook_url
    console.log('🔍 [WEBHOOK SUBSCRIBE] Client webhook URL:', clientWebhookUrl ? 'configured' : 'NOT CONFIGURED')

    if (!clientWebhookUrl) {
      console.log('❌ [WEBHOOK SUBSCRIBE] No webhook URL configured for client')
      return res.status(400).json({
        error: 'No webhook URL configured for this client. Please set a webhook URL in the client settings.'
      })
    }

    console.log('✅ [WEBHOOK SUBSCRIBE] Webhook URL configured:', clientWebhookUrl)

    // Return success - webhook will be sent to client's configured URL automatically
    const response = {
      success: true,
      message: 'Webhook subscription confirmed. Responses will be sent to client webhook URL.',
      client_name: form.clients?.name,
      webhook_url: clientWebhookUrl
    }

    console.log('✅ [WEBHOOK SUBSCRIBE] Subscription successful:', response)
    return res.status(200).json(response)

  } catch (error) {
    console.error('❌ [WEBHOOK SUBSCRIBE] Unexpected error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}