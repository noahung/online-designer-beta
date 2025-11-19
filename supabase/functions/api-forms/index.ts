import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

// Helper function to handle individual form fetching
async function handleGetForm(supabaseClient: any, userId: string, formId: string, corsHeaders: any) {
  // Get form data
  const { data: form, error: formError } = await supabaseClient
    .from('forms')
    .select('*')
    .eq('id', formId)
    .eq('user_id', userId)
    .single()

  if (formError || !form) {
    return new Response(
      JSON.stringify({ error: 'Form not found' }),
      { 
        status: 404, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }

  // Get form steps
  const { data: steps, error: stepsError } = await supabaseClient
    .from('form_steps')
    .select('*')
    .eq('form_id', formId)
    .order('step_order', { ascending: true })

  // Initialize formData
  let formData: any = {
    id: form.id,
    name: form.name,
    title: form.name,
    description: form.description,
    steps: []
  }

  if (steps && steps.length > 0) {
    for (const step of steps) {
      const { data: fields, error: fieldsError } = await supabaseClient
        .from('form_fields')
        .select('*')
        .eq('step_id', step.id)
        .order('field_order', { ascending: true })

      formData.steps.push({
        id: step.id,
        title: step.title,
        description: step.description,
        fields: fields || []
      })
    }
  } else {
    // If no steps, try to get fields directly (legacy support)
    const { data: fields, error: fieldsError } = await supabaseClient
      .from('form_fields')
      .select('*')
      .eq('form_id', formId)
      .order('field_order', { ascending: true })

    if (!fieldsError && fields) {
      formData.steps = [{
        id: 'step_1',
        title: 'Form',
        description: '',
        fields: fields
      }]
    }
  }

  return new Response(
    JSON.stringify(formData),
    { 
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      } 
    }
  )
}

// Helper function to handle form submission
async function handleSubmitForm(supabaseClient: any, userId: string, formId: string, req: Request, corsHeaders: any) {
  try {
    const formData = await req.json()

    // Verify form belongs to user
    const { data: form, error: formError } = await supabaseClient
      .from('forms')
      .select('id')
      .eq('id', formId)
      .eq('user_id', userId)
      .single()

    if (formError || !form) {
      return new Response(
        JSON.stringify({ error: 'Form not found or access denied' }),
        { 
          status: 404, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      )
    }

    // Insert response
    const { data: response, error: responseError } = await supabaseClient
      .from('form_responses')
      .insert({
        form_id: formId,
        user_id: userId,
        response_data: formData,
        submitted_at: new Date().toISOString()
      })
      .select()
      .single()

    if (responseError) {
      console.error('Error inserting response:', responseError)
      return new Response(
        JSON.stringify({ error: 'Failed to save response' }),
        { 
          status: 500, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        response_id: response.id,
        message: 'Response submitted successfully'
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  } catch (error) {
    console.error('Error parsing request body:', error)
    return new Response(
      JSON.stringify({ error: 'Invalid request body' }),
      { 
        status: 400, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
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
    const pathParts = url.pathname.split('/')
    const formId = pathParts[pathParts.length - 1] // Get form ID from URL path

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

    // Handle individual form fetching
    if (formId && formId !== 'api-forms' && req.method === 'GET') {
      return await handleGetForm(supabaseClient, userSettings.user_id, formId, corsHeaders)
    }

    // Handle form submission
    if (formId && formId !== 'api-forms' && req.method === 'POST') {
      return await handleSubmitForm(supabaseClient, userSettings.user_id, formId, req, corsHeaders)
    }

    // Handle form listing (existing functionality)
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
