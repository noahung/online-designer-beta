-- Update webhook trigger to include preferred_contact and project_details fields
-- This ensures database-triggered webhooks also include the new contact fields

-- The trigger function and payload have been updated to include:
-- - preferred_contact in contact_data JSON
-- - project_details in contact_data JSON
-- - contact__preferred_contact in webhook payload
-- - contact__project_details in webhook payload

-- To apply this update, run the updated webhook_trigger.sql file in Supabase SQL Editor