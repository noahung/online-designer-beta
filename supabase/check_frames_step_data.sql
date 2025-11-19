-- Check the actual step data for frames_plan steps
SELECT 
    id,
    question_type,
    question_text,
    frames_max_count,
    frames_require_image,
    frames_require_location,
    frames_require_measurements,
    is_required
FROM form_steps 
WHERE question_type = 'frames_plan'
ORDER BY created_at DESC
LIMIT 5;
