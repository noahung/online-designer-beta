// API endpoint to proxy webhook requests to Zapier (avoids CORS issues)
import { supabase } from '../../lib/supabase'

export async function POST(req: Request) {
  try {
    const { webhook_url, payload, user_id } = await req.json()

    if (!webhook_url || !payload || !user_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: webhook_url, payload, user_id' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Verify user has webhook enabled
    const { data: settings, error: settingsError } = await supabase
      .from('user_settings')
      .select('webhook_url, zapier_enabled')
      .eq('user_id', user_id)
      .maybeSingle()

    if (settingsError || !settings || !settings.zapier_enabled || settings.webhook_url !== webhook_url) {
      return new Response(
        JSON.stringify({ error: 'Webhook not enabled or URL mismatch' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
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
      return new Response(
        JSON.stringify({ success: true, message: 'Webhook sent successfully' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    } else {
      const errorText = await response.text()
      console.error(`Webhook failed: ${response.status} - ${errorText}`)
      return new Response(
        JSON.stringify({
          error: 'Webhook delivery failed',
          status: response.status,
          details: errorText
        }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      )
    }

  } catch (error) {
    console.error('Webhook proxy error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
