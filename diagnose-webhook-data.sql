-- Diagnostic query to check what's in the database for the latest response
-- This will help identify why webhook data is missing

-- Get the latest response
SELECT
  r.id,
  r.form_id,
  r.contact_name,
  r.contact_email,
  r.submitted_at,
  f.name as form_name
FROM responses r
JOIN forms f ON r.form_id = f.id
ORDER BY r.submitted_at DESC
LIMIT 1;

-- Check what answers exist for the latest response
SELECT
  ra.id,
  ra.response_id,
  ra.step_id,
  ra.answer_text,
  ra.selected_option_id,
  ra.file_url,
  ra.file_name,
  ra.frames_count,
  ra.width,
  ra.height,
  ra.depth,
  ra.units,
  ra.scale_rating,
  fs.title,
  fs.question_type,
  fs.step_order
FROM response_answers ra
JOIN form_steps fs ON ra.step_id = fs.id
WHERE ra.response_id = (
  SELECT id FROM responses ORDER BY submitted_at DESC LIMIT 1
)
ORDER BY fs.step_order;

-- Check what frames data exists for the latest response
SELECT
  rf.id,
  rf.response_id,
  rf.step_id,
  rf.frame_number,
  rf.image_url,
  rf.location_text,
  rf.measurements_text,
  fs.title
FROM response_frames rf
JOIN form_steps fs ON rf.step_id = fs.id
WHERE rf.response_id = (
  SELECT id FROM responses ORDER BY submitted_at DESC LIMIT 1
)
ORDER BY rf.frame_number;

-- Check webhook notifications for the latest response
SELECT
  wn.id,
  wn.webhook_url,
  wn.status,
  wn.payload,
  wn.created_at
FROM webhook_notifications wn
WHERE wn.response_id = (
  SELECT id FROM responses ORDER BY submitted_at DESC LIMIT 1
)
ORDER BY wn.created_at DESC;