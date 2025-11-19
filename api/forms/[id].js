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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  const { id } = req.query
  const { api_key } = req.query

  if (!api_key) {
    return res.status(401).json({ error: 'API key required' })
  }

  try {
    // Find user by API key
    const { data: settings, error: settingsError } = await supabase
      .from('user_settings')
      .select('user_id')
      .eq('api_key', api_key)
      .maybeSingle()

    if (settingsError || !settings) {
      return res.status(401).json({ error: 'Invalid API key' })
    }

    if (req.method === 'GET') {
      // Fetch form data
      const { data: form, error: formError } = await supabase
        .from('forms')
        .select('*')
        .eq('id', id)
        .eq('user_id', settings.user_id)
        .single()

      if (formError || !form) {
        return res.status(404).json({ error: 'Form not found' })
      }

      // Get form steps
      const { data: steps, error: stepsError } = await supabase
        .from('form_steps')
        .select('*')
        .eq('form_id', id)
        .order('step_order', { ascending: true })

      // Initialize formData with proper typing
      let formData = {
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
          .eq('form_id', id)
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

      return res.status(200).json(formData)

    } else if (req.method === 'POST') {
      // Submit form response
      const formData = req.body

      // Verify form belongs to user
      const { data: form, error: formError } = await supabase
        .from('forms')
        .select('id')
        .eq('id', id)
        .eq('user_id', settings.user_id)
        .single()

      if (formError || !form) {
        return res.status(404).json({ error: 'Form not found or access denied' })
      }

      // Insert response
      const { data: response, error: responseError } = await supabase
        .from('responses')
        .insert({
          form_id: id,
          user_id: settings.user_id,
          response_data: formData,
          submitted_at: new Date().toISOString()
        })
        .select()
        .single()

      if (responseError) {
        console.error('Error inserting response:', responseError)
        return res.status(500).json({ error: 'Failed to save response' })
      }

      return res.status(200).json({
        success: true,
        response_id: response.id,
        message: 'Response submitted successfully'
      })

    } else {
      return res.status(405).json({ error: 'Method not allowed' })
    }

  } catch (error) {
    console.error('API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
