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

    // Get user's forms
    const { data: forms, error: formsError } = await supabase
      .from('forms')
      .select('id, name, description, created_at')
      .eq('user_id', settings.user_id)
      .order('created_at', { ascending: false })

    if (formsError) {
      return res.status(500).json({ error: 'Failed to fetch forms' })
    }

    return res.status(200).json(forms || [])
  } catch (error) {
    console.error('API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
