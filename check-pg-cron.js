// Check if pg_cron is available
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://bahloynyhjgmdndqabhu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhaGxveW55aGpnbWRuZHFhYmh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3NjM0ODAsImV4cCI6MjA3MTMzOTQ4MH0.SYTUzUkXfjHO-odCTKVDHiBH6AqQmJLf2qoiiD8ecZ0'
)

try {
  const { data, error } = await supabase
    .from('pg_extension')
    .select('*')
    .eq('extname', 'pg_cron')

  if (error) {
    console.log('Error checking pg_cron:', error.message)
  } else {
    console.log('pg_cron available:', data && data.length > 0)
    if (data && data.length > 0) {
      console.log('✅ pg_cron is available - can set up database cron job')
    } else {
      console.log('❌ pg_cron not available - need external cron job')
    }
  }
} catch (err) {
  console.log('Unexpected error:', err.message)
}