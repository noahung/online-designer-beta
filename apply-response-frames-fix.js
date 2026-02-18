// Run this script to apply the RLS fix for response_frames client access
// Usage: node apply-response-frames-fix.js

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function applyMigration() {
  try {
    console.log('Reading SQL migration file...')
    const sqlFile = join(__dirname, 'supabase', 'fix_response_frames_client_access.sql')
    const sql = readFileSync(sqlFile, 'utf8')
    
    console.log('Applying migration...')
    const { data, error } = await supabase.rpc('exec_sql', { sql_string: sql })
    
    if (error) {
      console.error('Error applying migration:', error)
      process.exit(1)
    }
    
    console.log('✅ Migration applied successfully!')
    console.log('Clients can now view response_frames for their own forms.')
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

applyMigration()
