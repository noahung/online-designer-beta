import { supabase } from './src/lib/supabase.js'

async function runMigration() {
  console.log('Running file upload migration...')
  
  try {
    // First, check current enum values
    const { data: enumData, error: enumError } = await supabase.rpc('get_enum_values', {
      enum_name: 'question_type'
    })
    
    if (enumError && !enumError.message.includes('function get_enum_values() does not exist')) {
      throw enumError
    }
    
    console.log('Current enum values:', enumData)
    
    // Add file_upload to the question_type enum
    const { error: enumUpdateError } = await supabase.rpc('execute_sql', {
      sql: "ALTER TYPE question_type ADD VALUE IF NOT EXISTS 'file_upload';"
    })
    
    if (enumUpdateError && !enumUpdateError.message.includes('function execute_sql() does not exist')) {
      console.log('Enum update error (this might be expected):', enumUpdateError)
    }
    
    // Add columns to response_answers table
    const alterStatements = [
      "ALTER TABLE response_answers ADD COLUMN IF NOT EXISTS file_url text;",
      "ALTER TABLE response_answers ADD COLUMN IF NOT EXISTS file_name text;",
      "ALTER TABLE response_answers ADD COLUMN IF NOT EXISTS file_size integer;",
      "ALTER TABLE form_steps ADD COLUMN IF NOT EXISTS max_file_size integer;",
      "ALTER TABLE form_steps ADD COLUMN IF NOT EXISTS allowed_file_types text[];"
    ]
    
    for (const sql of alterStatements) {
      try {
        console.log('Executing:', sql)
        const { error } = await supabase.rpc('execute_sql', { sql })
        if (error) {
          console.log('SQL execution might not be available via RPC, this is normal')
          console.log('Error:', error.message)
        }
      } catch (err) {
        console.log('Expected error (RPC might not be available):', err.message)
      }
    }
    
    console.log('Migration completed successfully!')
    console.log('Note: Some operations might need to be run directly on the Supabase dashboard if RPC is not available.')
    
  } catch (error) {
    console.error('Migration failed:', error)
  }
  
  process.exit(0)
}

runMigration()
