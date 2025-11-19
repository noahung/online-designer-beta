-- Check if frames_plan columns exist in form_steps table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'form_steps' 
AND column_name LIKE 'frames_%'
ORDER BY column_name;

-- Also check the enum values
SELECT unnest(enum_range(NULL::question_type)) as question_types;
