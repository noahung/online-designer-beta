-- Check the current frames_plan step data in detail
SELECT 
    id,
    title,
    question_type,
    form_id,
    step_order,
    is_required,
    frames_max_count,
    frames_require_image,
    frames_require_location,
    frames_require_measurements,
    created_at
FROM form_steps 
WHERE question_type = 'frames_plan'
ORDER BY created_at DESC;
