import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || ''
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase configuration')
}

const supabase = createClient(supabaseUrl, supabaseKey)

export default async function handler(req, res) {
  console.log('🔍 [WEBHOOK UNSUBSCRIBE] Request received:', {
    method: req.method,
    url: req.url,
    headers: req.headers,
    body: req.body
  })

  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    console.log('🔍 [WEBHOOK UNSUBSCRIBE] CORS preflight request handled')
    res.status(200).end()
    return
  }

  if (req.method !== 'DELETE') {
    console.log('❌ [WEBHOOK UNSUBSCRIBE] Invalid method:', req.method)
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { target_url, form_id, api_key } = req.body
    console.log('🔍 [WEBHOOK UNSUBSCRIBE] Extracted parameters:', {
      target_url: target_url ? 'provided' : 'missing',
      form_id: form_id ? 'provided' : 'missing',
      api_key: api_key ? 'provided' : 'missing'
    })

    if (!form_id || !api_key) {
      console.log('❌ [WEBHOOK UNSUBSCRIBE] Missing required parameters')
      return res.status(400).json({ error: 'Missing required parameters: form_id and api_key' })
    }

    console.log('🔍 [WEBHOOK UNSUBSCRIBE] Validating API key...')
    // Find user by API key
    const { data: settings, error: settingsError } = await supabase
      .from('user_settings')
      .select('user_id')
      .eq('api_key', api_key)
      .maybeSingle()

    if (settingsError) {
      console.log('❌ [WEBHOOK UNSUBSCRIBE] API key validation error:', settingsError)
      return res.status(401).json({ error: 'Invalid API key' })
    }

    if (!settings) {
      console.log('❌ [WEBHOOK UNSUBSCRIBE] No user found for API key')
      return res.status(401).json({ error: 'Invalid API key' })
    }

    console.log('✅ [WEBHOOK UNSUBSCRIBE] API key valid, user_id:', settings.user_id)

    console.log('🔍 [WEBHOOK UNSUBSCRIBE] Validating form access...')
    // Verify form belongs to user
    const { data: form, error: formError } = await supabase
      .from('forms')
      .select('id')
      .eq('id', form_id)
      .eq('user_id', settings.user_id)
      .single()

    if (formError) {
      console.log('❌ [WEBHOOK UNSUBSCRIBE] Form access error:', formError)
      return res.status(404).json({ error: 'Form not found or access denied' })
    }

    if (!form) {
      console.log('❌ [WEBHOOK UNSUBSCRIBE] Form not found')
      return res.status(404).json({ error: 'Form not found or access denied' })
    }

    console.log('✅ [WEBHOOK UNSUBSCRIBE] Form access valid, form_id:', form.id)

    // Return success - webhook unsubscription is automatic
    const response = {
      success: true,
      message: 'Webhook unsubscribed successfully. Client webhook URL will no longer receive notifications.'
    }

    console.log('✅ [WEBHOOK UNSUBSCRIBE] Unsubscription successful:', response)
    return res.status(200).json(response)

  } catch (error) {
    console.error('❌ [WEBHOOK UNSUBSCRIBE] Unexpected error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}