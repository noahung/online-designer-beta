import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface WebhookPayload {
  webhook_url: string
  payload: any
  user_id: string
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  try {
    const { webhook_url, payload, user_id }: WebhookPayload = await req.json()

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
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
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
        {
          status: response.status,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      )
    }

  } catch (error) {
    console.error('Webhook proxy error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )
  }
})
