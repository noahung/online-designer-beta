# Email Notification System Setup Guide

This guide will help you set up the automatic email notification system for your Online Designer forms using Brevo.

## Overview

When a customer fills out a form on your platform, an email notification will automatically be sent to the client's email address (the company that owns the form). The email includes:

- ✅ All form responses beautifully formatted
- ✅ Contact information from the form
- ✅ File attachments and images
- ✅ Frames data (for frames_plan forms)
- ✅ Direct link to view all responses on the platform
- ✅ Professional branding with Advertomedia styling

## Setup Steps

### 1. Get Your Brevo API Key

1. Sign up or log into your [Brevo account](https://www.brevo.com/)
2. Go to **Account Settings** > **SMTP & API** > **API Keys**
3. Create a new API key with **Send Email** permissions
4. Copy the API key (it looks like: `xkeysib-xyz123...`)

### 2. Configure Environment Variables

Add the following environment variable to your project:

```bash
# In your .env file or deployment environment
VITE_BREVO_API_KEY=xkeysib-your-actual-api-key-here
```

**Important:** Replace `xkeysib-your-actual-api-key-here` with your real Brevo API key.

### 3. Set Up Client Email Addresses

For each client in your database, you need to add their email address to the `clients` table:

```sql
-- Update client email addresses
UPDATE clients 
SET client_email = 'client@example.com' 
WHERE name = 'Client Company Name';
```

Or you can do this through your admin interface:
1. Go to your Clients page in the admin panel
2. Edit each client
3. Add their email address in the "Client Email" field
4. Save

### 4. Database Setup (Run These SQL Scripts)

Run these SQL scripts in your Supabase SQL editor:

#### A. Email Notification Queue Table
```sql
-- Create email notification queue table
-- Copy contents from: supabase/email_notification_queue.sql
```

#### B. Response Frames Table (if not already created)
```sql
-- Ensure response_frames table exists for frames data
-- Copy contents from: supabase/add_response_frames_table.sql
```

### 5. Verify Setup

To test if the email system is working:

1. **Create a test client** with a valid email address
2. **Create a test form** assigned to that client
3. **Submit a test response** through the form
4. **Check the client's email** - they should receive a notification

## Email Template Features

The emails sent to clients include:

### 📋 Form Details
- Form name
- Client name
- Submission timestamp

### 👤 Contact Information
- Customer name, email, phone, postcode (if provided)
- Clickable email and phone links

### 💬 Form Responses
- All questions and answers
- Multiple choice selections
- Image selections with thumbnails
- File uploads with download links
- Dimension measurements
- Opinion scale ratings (with stars)

### 🖼️ Frame Data
- Frame images (for frames_plan forms)
- Location text
- Measurements

### 🔗 Call-to-Action
- "View All Responses" button linking to designer.advertomedia.co.uk

## Email Styling

The emails feature:
- ✨ Professional gradient header
- 📱 Mobile-responsive design
- 🎨 Beautiful card-based layout
- 🔗 Clickable elements (emails, phones, files)
- 🌟 Star ratings for opinion scales
- 📎 File attachment previews

## Sender Information

All emails are sent from:
- **From:** designer@advertomedia.co.uk
- **Name:** Online Designer - Advertomedia

## Error Handling

- ✅ If client has no email configured: Skips notification silently
- ✅ If Brevo API key missing: Logs warning, continues form submission
- ✅ If email fails to send: Logs error, doesn't break form submission
- ✅ Email queue tracks status (pending/sent/failed)

## Troubleshooting

### No emails being sent?

1. **Check environment variable:** Ensure `VITE_BREVO_API_KEY` is set correctly
2. **Check client email:** Ensure the client has a valid email in the database
3. **Check Brevo account:** Ensure your Brevo account is active and has email credits
4. **Check browser console:** Look for error messages in browser developer tools
5. **Check Supabase logs:** Check for any database errors

### Emails going to spam?

1. **Domain Authentication:** Set up SPF/DKIM records for designer@advertomedia.co.uk in Brevo
2. **Reputation:** Gradually increase sending volume to build reputation
3. **Content:** Avoid spam keywords in subject/content

### API Rate Limits?

Brevo free tier includes:
- 300 emails per day
- 9,000 emails per month

If you need more, upgrade your Brevo plan.

## Testing Commands

To test the email system manually:

```bash
# Test the email API endpoint (if you create one)
curl -X POST http://localhost:5173/api/send-response-email \
  -H "Content-Type: application/json" \
  -d '{"response_id": "your-response-id"}'
```

## Integration with Existing Features

This email system works alongside:
- ✅ Zapier webhooks
- ✅ Form embedding
- ✅ Client portal access
- ✅ Response management
- ✅ File uploads and storage

The system is designed to be reliable and non-intrusive - if emails fail, form submissions still work perfectly.

---

## Next Steps

1. Set up your Brevo account and get the API key
2. Add the environment variable
3. Update client email addresses in your database
4. Run the SQL scripts
5. Test with a sample form submission
6. Monitor email delivery in your Brevo dashboard

Your customers will love getting instant, beautiful notifications when they receive new leads! 🎉
