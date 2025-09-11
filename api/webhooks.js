import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || ''
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase configuration')
}

const supabase = createClient(supabaseUrl, supabaseKey)

export default async function handler(req, res) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method === 'POST') {
    // Webhook subscription
    try {
      const { target_url, form_id, api_key } = req.body

      if (!target_url || !form_id || !api_key) {
        return res.status(400).json({ error: 'Missing required parameters' })
      }

      // Find user by API key
      const { data: settings, error: settingsError } = await supabase
        .from('user_settings')
        .select('user_id')
        .eq('api_key', api_key)
        .maybeSingle()

      if (settingsError || !settings) {
        return res.status(401).json({ error: 'Invalid API key' })
      }

      // Verify form belongs to user
      const { data: form, error: formError } = await supabase
        .from('forms')
        .select('id')
        .eq('id', form_id)
        .eq('user_id', settings.user_id)
        .single()

      if (formError || !form) {
        return res.status(404).json({ error: 'Form not found or access denied' })
      }

      // Store webhook subscription
      const { data: webhook, error: webhookError } = await supabase
        .from('webhooks')
        .upsert({
          user_id: settings.user_id,
          form_id: form_id,
          target_url: target_url,
          active: true,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (webhookError) {
        return res.status(500).json({ error: 'Failed to create webhook subscription' })
      }

      return res.status(200).json({
        success: true,
        webhook_id: webhook.id,
        message: 'Webhook subscription created successfully'
      })

    } catch (error) {
      console.error('Webhook subscription error:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }

  } else if (req.method === 'DELETE') {
    // Webhook unsubscription
    try {
      const { target_url, form_id, api_key } = req.body

      if (!target_url || !form_id || !api_key) {
        return res.status(400).json({ error: 'Missing required parameters' })
      }

      // Find user by API key
      const { data: settings, error: settingsError } = await supabase
        .from('user_settings')
        .select('user_id')
        .eq('api_key', api_key)
        .maybeSingle()

      if (settingsError || !settings) {
        return res.status(401).json({ error: 'Invalid API key' })
      }

      // Delete webhook subscription
      const { error: deleteError } = await supabase
        .from('webhooks')
        .delete()
        .eq('user_id', settings.user_id)
        .eq('form_id', form_id)
        .eq('target_url', target_url)

      if (deleteError) {
        return res.status(500).json({ error: 'Failed to unsubscribe webhook' })
      }

      return res.status(200).json({
        success: true,
        message: 'Webhook unsubscribed successfully'
      })

    } catch (error) {
      console.error('Webhook unsubscribe error:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }

  } else {
    return res.status(405).json({ error: 'Method not allowed' })
  }
}
