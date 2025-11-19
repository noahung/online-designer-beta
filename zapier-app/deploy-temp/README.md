# Online Designer Forms Zapier Integration

This directory contains the Zapier app configuration for integrating Online Designer Forms with Zapier automation workflows.

## Setup Instructions

### 1. Prerequisites
- Zapier CLI installed: `npm install -g zapier-platform-cli`
- Node.js version 18 or higher
- An Online Designer account with API access

### 2. Local Development Setup

```bash
# Navigate to the zapier-app directory
cd zapier-app

# Install dependencies (if any are added later)
npm install

# Test the app locally
zapier test

# Validate the app structure
zapier validate
```

### 3. Authentication Setup

Users will need to:
1. Log into their Online Designer account
2. Go to Settings page
3. Generate an API key
4. Copy the API key into Zapier when connecting the app

### 4. Available Triggers

- **New Form Response**: Fires when a new response is submitted to any selected form
  - Provides complete form data including contact information and all answers
  - Supports webhook-based real-time notifications

### 5. Testing the Integration

```bash
# Test authentication
zapier test --grep="authentication"

# Test the form list search
zapier test --grep="form_list"

# Test the new response trigger
zapier test --grep="new_form_response"
```

### 6. Deployment to Zapier

When ready to publish:

```bash
# Build and upload to Zapier
zapier push

# Promote to a version (if ready for users)
zapier promote 1.0.0
```

## File Structure

- `index.js` - Main app configuration
- `authentication.js` - API key authentication setup
- `package.json` - App metadata and configuration
- `triggers/new_form_response.js` - Webhook trigger for new form submissions
- `searches/form_list.js` - Dynamic dropdown for selecting forms

## API Endpoints Used

- `GET /api/forms` - List all user forms (for authentication and form selection)
- `POST /api/webhooks/subscribe` - Subscribe to form response webhooks
- `DELETE /api/webhooks/unsubscribe` - Unsubscribe from webhooks
- `GET /api/forms/{id}/responses/recent` - Get recent responses for testing

## Webhook Payload Structure

```json
{
  "response_id": "uuid",
  "form_id": "uuid", 
  "form_name": "string",
  "submitted_at": "ISO datetime",
  "contact": {
    "name": "string",
    "email": "string", 
    "phone": "string"
  },
  "answers": [
    {
      "question": "string",
      "answer_text": "string",
      "selected_option": "string",
      "rating": "number"
    }
  ]
}
```

## Environment Variables

- `BASE_URL` - The base URL for the Online Designer API (defaults to production URL)

## Support

For issues with this Zapier integration, please contact support or file an issue in the main repository.
