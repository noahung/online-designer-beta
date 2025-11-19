import { supabase } from '../lib/supabase'

import { supabase } from '../lib/supabase'

// Webhook subscription endpoint for Zapier
export async function POST(request) {
  try {
    const { target_url, form_id, api_key } = await request.json()

    if (!target_url || !form_id || !api_key) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Find user by API key
    const { data: settings, error: settingsError } = await supabase
      .from('user_settings')
      .select('user_id')
      .eq('api_key', api_key)
      .maybeSingle()

    if (settingsError || !settings) {
      return new Response(JSON.stringify({ error: 'Invalid API key' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Verify form belongs to user
    const { data: form, error: formError } = await supabase
      .from('forms')
      .select('id')
      .eq('id', form_id)
      .eq('user_id', settings.user_id)
      .single()

    if (formError || !form) {
      return new Response(JSON.stringify({ error: 'Form not found or access denied' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
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
      return new Response(JSON.stringify({ error: 'Failed to create webhook subscription' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({
      success: true,
      webhook_id: webhook.id,
      message: 'Webhook subscription created successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Webhook subscription error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// Webhook unsubscription endpoint for Zapier
export async function DELETE(request) {
  try {
    const { target_url, form_id, api_key } = await request.json()

    if (!target_url || !form_id || !api_key) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Find user by API key
    const { data: settings, error: settingsError } = await supabase
      .from('user_settings')
      .select('user_id')
      .eq('api_key', api_key)
      .maybeSingle()

    if (settingsError || !settings) {
      return new Response(JSON.stringify({ error: 'Invalid API key' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Delete webhook subscription
    const { error: deleteError } = await supabase
      .from('webhooks')
      .delete()
      .eq('user_id', settings.user_id)
      .eq('form_id', form_id)
      .eq('target_url', target_url)

    if (deleteError) {
      return new Response(JSON.stringify({ error: 'Failed to unsubscribe webhook' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Webhook unsubscribed successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Webhook unsubscribe error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
