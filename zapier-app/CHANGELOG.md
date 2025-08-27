# Changelog

All notable changes to this project will be documented in this file.

## 1.0.0

Initial release of Online Designer Forms Zapier integration.

### Features

- **Authentication**: API key-based authentication using Supabase database functions
- **Trigger**: New Form Response trigger with real-time webhook support
- **Form Selection**: Dynamic dropdown to select forms from user's account
- **Complete Data Access**: Full form response data including contact info and answers

### Technical Implementation

- Uses Supabase RPC functions for secure API key validation
- Proper JSON request formatting for database function calls
- Clean error handling and response processing
- Follows Zapier best practices for app structure

### Bug Fixes

- Fix authentication middleware conflicts with RPC calls
- Fix template literal syntax errors in API requests
- Fix proper JSON stringification for request bodies
- Update authorization headers to use proper string formatting

Initial release to public.
