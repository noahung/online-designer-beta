import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

console.log('🔍 [SEND-WEBHOOK] Send-webhook Edge Function started')

Deno.serve(async (req) => {
  console.log('🔍 [SEND-WEBHOOK] Request received:', {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries())
  })

  if (req.method !== 'POST') {
    console.log('❌ [SEND-WEBHOOK] Invalid method:', req.method)
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const { webhook_url, payload } = await req.json()

    console.log('🔍 [SEND-WEBHOOK] Parsed request:', {
      webhook_url: webhook_url,
      payload_keys: Object.keys(payload || {})
    })

    if (!webhook_url || !payload) {
      console.log('❌ [SEND-WEBHOOK] Missing required parameters')
      return new Response('Missing webhook_url or payload', { status: 400 })
    }

    console.log('🔍 [SEND-WEBHOOK] Sending webhook to:', webhook_url)

    // Send the webhook to the client's URL
    const response = await fetch(webhook_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Online Designer Webhook/1.0'
      },
      body: JSON.stringify(payload)
    })

    console.log('🔍 [SEND-WEBHOOK] Webhook response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    })

    if (response.ok) {
      console.log('✅ [SEND-WEBHOOK] Webhook sent successfully')
      return new Response(JSON.stringify({ success: true, message: 'Webhook sent successfully' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    } else {
      const errorText = await response.text()
      console.error('❌ [SEND-WEBHOOK] Webhook failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      })
      return new Response(JSON.stringify({
        success: false,
        error: `Webhook failed: ${response.status} ${response.statusText}`,
        details: errorText
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

  } catch (error) {
    console.error('❌ [SEND-WEBHOOK] Error in send-webhook function:', error)
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error',
      details: (error as Error).message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})