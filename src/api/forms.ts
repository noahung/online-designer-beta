import { supabase } from '../lib/supabase'

// Simple API endpoint for Zapier to list forms
export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const apiKey = url.searchParams.get('api_key')
    
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Find user by API key
    const { data: settings, error: settingsError } = await supabase
      .from('user_settings')
      .select('user_id')
      .eq('api_key', apiKey)
      .maybeSingle()

    if (settingsError || !settings) {
      return new Response(JSON.stringify({ error: 'Invalid API key' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Get user's forms
    const { data: forms, error: formsError } = await supabase
      .from('forms')
      .select('id, name, description, created_at')
      .eq('user_id', settings.user_id)
      .order('created_at', { ascending: false })

    if (formsError) {
      return new Response(JSON.stringify({ error: 'Failed to fetch forms' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify(forms || []), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('API error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
