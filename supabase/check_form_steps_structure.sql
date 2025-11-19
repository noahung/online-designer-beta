-- Check the actual form_steps table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'form_steps'
ORDER BY ordinal_position;
