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
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { webhook_url, payload, user_id } = req.body

    if (!webhook_url || !payload || !user_id) {
      return res.status(400).json({ error: 'Missing required parameters: webhook_url, payload, user_id' })
    }

    // Verify user has webhook enabled
    const { data: settings, error: settingsError } = await supabase
      .from('user_settings')
      .select('webhook_url, zapier_enabled')
      .eq('user_id', user_id)
      .maybeSingle()

    if (settingsError || !settings || !settings.zapier_enabled || settings.webhook_url !== webhook_url) {
      return res.status(403).json({ error: 'Webhook not enabled or URL mismatch' })
    }

    // Send webhook to Zapier
    const response = await fetch(webhook_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Online Designer Webhook/1.0'
      },
      body: JSON.stringify(payload)
    })

    if (response.ok) {
      console.log(`Webhook sent successfully to ${webhook_url}`)
      return res.status(200).json({ success: true, message: 'Webhook sent successfully' })
    } else {
      const errorText = await response.text()
      console.error(`Webhook failed: ${response.status} - ${errorText}`)
      return res.status(response.status).json({
        error: 'Webhook delivery failed',
        status: response.status,
        details: errorText
      })
    }

  } catch (error) {
    console.error('Webhook proxy error:', error)
    return res.status(500).json({ error: 'Internal server error', details: error.message })
  }
}
