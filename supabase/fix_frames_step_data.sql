-- Update existing frames_plan steps with proper default values
UPDATE form_steps 
SET 
    frames_max_count = 10,
    frames_require_image = true,
    frames_require_location = true,
    frames_require_measurements = false
WHERE question_type = 'frames_plan';

-- Check the updated data
SELECT 
    id,
    question_type,
    title,
    frames_max_count,
    frames_require_image,
    frames_require_location,
    frames_require_measurements
FROM form_steps 
WHERE question_type = 'frames_plan';
