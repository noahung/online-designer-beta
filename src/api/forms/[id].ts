import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || ''
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase configuration')
}

const supabase = createClient(supabaseUrl, supabaseKey)

// API endpoint for fetching individual form data (for WordPress plugin)
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const formId = params.id
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

    // Get form data
    const { data: form, error: formError } = await supabase
      .from('forms')
      .select('*')
      .eq('id', formId)
      .eq('user_id', settings.user_id)
      .single()

    if (formError || !form) {
      return new Response(JSON.stringify({ error: 'Form not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Get form steps
    const { data: steps, error: stepsError } = await supabase
      .from('form_steps')
      .select('*')
      .eq('form_id', formId)
      .order('step_order', { ascending: true })

    if (stepsError) {
      console.error('Error fetching steps:', stepsError)
    }

    // Get form fields for each step
    let formData: {
      id: string;
      name: string;
      title: string;
      description: string;
      steps: Array<{
        id: string;
        title: string;
        description: string;
        fields: any[];
      }>;
    } = {
      id: form.id,
      name: form.name,
      title: form.name,
      description: form.description,
      steps: []
    }

    if (steps && steps.length > 0) {
      for (const step of steps) {
        const { data: fields, error: fieldsError } = await supabase
          .from('form_fields')
          .select('*')
          .eq('step_id', step.id)
          .order('field_order', { ascending: true })

        if (fieldsError) {
          console.error('Error fetching fields for step:', step.id, fieldsError)
        }

        formData.steps.push({
          id: step.id,
          title: step.title,
          description: step.description,
          fields: fields || []
        })
      }
    } else {
      // If no steps, try to get fields directly (legacy support)
      const { data: fields, error: fieldsError } = await supabase
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

    return new Response(JSON.stringify(formData), {
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

// API endpoint for submitting form responses
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const formId = params.id
    const url = new URL(request.url)
    const apiKey = url.searchParams.get('api_key')
    const formData = await request.json()

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

    // Verify form belongs to user
    const { data: form, error: formError } = await supabase
      .from('forms')
      .select('id')
      .eq('id', formId)
      .eq('user_id', settings.user_id)
      .single()

    if (formError || !form) {
      return new Response(JSON.stringify({ error: 'Form not found or access denied' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Insert response
    const { data: response, error: responseError } = await supabase
      .from('responses')
      .insert({
        form_id: formId,
        user_id: settings.user_id,
        response_data: formData,
        submitted_at: new Date().toISOString()
      })
      .select()
      .single()

    if (responseError) {
      console.error('Error inserting response:', responseError)
      return new Response(JSON.stringify({ error: 'Failed to save response' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({
      success: true,
      response_id: response.id,
      message: 'Response submitted successfully'
    }), {
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
