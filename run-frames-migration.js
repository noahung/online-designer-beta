import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables
config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function runMigration() {
  console.log('🗄️ Running frames_count column migration...')

  try {
    // Add frames_count column to response_answers table
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE response_answers ADD COLUMN IF NOT EXISTS frames_count integer;
        COMMENT ON COLUMN response_answers.frames_count IS 'Number of frames selected for frames_plan questions (1-10)';
        CREATE INDEX IF NOT EXISTS idx_response_answers_frames_count ON response_answers(frames_count);
      `
    })

    if (alterError) {
      console.log('❌ RPC method not available, trying direct SQL execution...')

      // Try alternative approach - insert a test record to trigger any schema updates
      console.log('🔄 Attempting to verify table structure...')

      // Check if the column exists by trying to select it
      const { data, error: selectError } = await supabase
        .from('response_answers')
        .select('frames_count')
        .limit(1)

      if (selectError && selectError.message.includes('column "frames_count" does not exist')) {
        console.log('❌ frames_count column does not exist')
        console.log('📋 Please run the following SQL in your Supabase SQL Editor:')
        console.log(`
-- Add frames_count column to response_answers table
ALTER TABLE response_answers ADD COLUMN IF NOT EXISTS frames_count integer;
COMMENT ON COLUMN response_answers.frames_count IS 'Number of frames selected for frames_plan questions (1-10)';
CREATE INDEX IF NOT EXISTS idx_response_answers_frames_count ON response_answers(frames_count);

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'response_answers' AND column_name = 'frames_count';
        `)
        return false
      } else if (!selectError) {
        console.log('✅ frames_count column already exists')
        return true
      }
    } else {
      console.log('✅ Migration completed successfully via RPC')
      return true
    }

  } catch (error) {
    console.error('❌ Migration failed:', error)
    return false
  }
}

// Run the migration
runMigration().then(success => {
  if (success) {
    console.log('🎉 Migration completed successfully!')
  } else {
    console.log('⚠️ Migration may need manual execution in Supabase SQL Editor')
  }
  process.exit(success ? 0 : 1)
})