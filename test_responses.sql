-- Insert test responses with contact information
-- First, let's see what forms exist
SELECT id, name, client_id FROM forms LIMIT 5;

-- Insert test responses (you'll need to replace the form_id with actual values from above query)
-- INSERT INTO responses (form_id, contact_name, contact_email, contact_phone, contact_postcode, submitted_at) 
-- VALUES 
--   ('YOUR_FORM_ID_HERE', 'John Smith', 'john@example.com', '555-1234', 'SW1A 1AA', NOW()),
--   ('YOUR_FORM_ID_HERE', 'Jane Doe', 'jane@example.com', '555-5678', 'M1 1AA', NOW()),
--   ('YOUR_FORM_ID_HERE', 'Bob Johnson', 'bob@example.com', '555-9012', 'B1 1AA', NOW());
