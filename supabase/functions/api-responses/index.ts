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
    // Get API key and form_id from query parameters
    const url = new URL(req.url)
    const apiKey = url.searchParams.get('api_key')
    const formId = url.searchParams.get('form_id')
    const limit = parseInt(url.searchParams.get('limit') || '100')

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

    // Build query for form responses
    let query = supabaseClient
      .from('form_responses')
      .select(`
        id,
        form_id,
        response_data,
        created_at,
        forms (
          name,
          user_id
        )
      `)
      .eq('forms.user_id', userSettings.user_id)
      .order('created_at', { ascending: false })
      .limit(limit)

    // If form_id is specified, filter by it
    if (formId) {
      query = query.eq('form_id', formId)
    }

    const { data: responses, error: responsesError } = await query

    if (responsesError) {
      console.error('Error fetching responses:', responsesError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch responses' }),
        { 
          status: 500, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      )
    }

    // Format the responses for Zapier
    const formattedResponses = responses?.map(response => {
      const responseData = response.response_data || {}
      
      // Flatten the response data for easier use in Zapier
      const flattenedData = {}
      if (typeof responseData === 'object') {
        Object.keys(responseData).forEach(key => {
          const value = responseData[key]
          if (typeof value === 'object') {
            flattenedData[key] = JSON.stringify(value)
          } else {
            flattenedData[key] = value
          }
        })
      }

      return {
        id: response.id,
        form_id: response.form_id,
        form_name: response.forms?.name || 'Unknown Form',
        submitted_at: response.created_at,
        response_data: flattenedData,
        raw_response_data: responseData
      }
    }) || []

    return new Response(
      JSON.stringify({ 
        responses: formattedResponses,
        total: formattedResponses.length 
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
    console.error('Error in api-responses function:', error)
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
