import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get API key from query parameters
    const url = new URL(req.url)
    const apiKey = url.searchParams.get('api_key')

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key is required' }),
        { 
          status: 401, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      )
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Validate API key and get user
    const { data: userSettings, error: settingsError } = await supabaseClient
      .from('user_settings')
      .select('user_id, zapier_enabled')
      .eq('api_key', apiKey)
      .single()

    if (settingsError || !userSettings) {
      return new Response(
        JSON.stringify({ error: 'Invalid API key' }),
        { 
          status: 401, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      )
    }

    if (!userSettings.zapier_enabled) {
      return new Response(
        JSON.stringify({ error: 'Zapier integration not enabled' }),
        { 
          status: 403, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      )
    }

    // Get forms for the user
    const { data: forms, error: formsError } = await supabaseClient
      .from('forms')
      .select(`
        id,
        name,
        description,
        is_active,
        created_at,
        clients (name)
      `)
      .eq('user_id', userSettings.user_id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (formsError) {
      console.error('Error fetching forms:', formsError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch forms' }),
        { 
          status: 500, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      )
    }

    // Get response counts for each form
    const formIds = forms?.map(form => form.id) || []
    
    let responseCounts = {}
    if (formIds.length > 0) {
      const { data: responses, error: responsesError } = await supabaseClient
        .from('form_responses')
        .select('form_id')
        .in('form_id', formIds)

      if (!responsesError) {
        responseCounts = responses?.reduce((acc, response) => {
          acc[response.form_id] = (acc[response.form_id] || 0) + 1
          return acc
        }, {}) || {}
      }
    }

    // Format the response
    const formattedForms = forms?.map(form => ({
      id: form.id,
      name: form.name,
      description: form.description,
      client_name: form.clients?.name || 'Unknown',
      created_at: form.created_at,
      total_responses: responseCounts[form.id] || 0,
      is_active: form.is_active
    })) || []

    return new Response(
      JSON.stringify({ 
        forms: formattedForms,
        total: formattedForms.length 
      }),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Error in api-forms function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})
