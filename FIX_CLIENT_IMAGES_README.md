# Fix for Client View Not Showing Uploaded Images

## Problem
Clients couldn't see uploaded images (frames) because the `response_frames` table had Row Level Security (RLS) policies that only allowed admin users to view the data.

## Solution
This fix adds RLS policies to allow clients to view response frames for their own forms.

## How to Apply

### Option 1: Via Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `supabase/fix_response_frames_client_access.sql`
4. Click **Run** to execute the SQL

### Option 2: Via Supabase CLI
If you have the Supabase CLI installed:
```bash
supabase db push
```

## What This Does

### Before
- Only authenticated admin users could SELECT from `response_frames`
- Public/client users had NO read access
- Result: Clients couldn't see uploaded frame images

### After
- Admin users can view their response_frames (authenticated)
- **Client users can view response_frames for their own forms** (using client context)
- Public users can still INSERT frames (for form submissions)

## Code Changes

### 1. Database (SQL Migration)
- **File**: `supabase/fix_response_frames_client_access.sql`
- Adds RLS policy: `Clients can view response_frames with valid client context`
- Uses `get_client_context_id()` function to check client access

### 2. Frontend (AuthContext)
- **File**: `src/contexts/AuthContext.tsx`
- Calls `setClientContext(clientId)` when client logs in
- Calls `setClientContext(null)` when user logs out
- This sets the PostgreSQL session variable `app.client_id` for RLS policies

### 3. Debugging (ResponseDetail)
- **File**: `src/pages/ResponseDetail.tsx`
- Added console.log statements to debug data fetching

## Testing
After applying the fix:
1. Log in as a client user
2. Navigate to a response detail page
3. You should now see uploaded frame images with download buttons
4. Check browser console for debug logs showing frames data

## Verification
Open browser console and look for:
```
Frames data fetched: [...]
Response frames: [...]
```

If frames are empty `[]`, check:
1. SQL migration was applied successfully
2. Client is properly authenticated
3. Response actually has frames in the database

## Rollback
If you need to revert:
```sql
-- Restore original policy
DROP POLICY IF EXISTS "Admin users can view their response_frames" ON response_frames;
DROP POLICY IF EXISTS "Clients can view response_frames with valid client context" ON response_frames;

CREATE POLICY "Users can view accessible response_frames" ON response_frames
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM responses r
      JOIN forms f ON r.form_id = f.id
      WHERE r.id = response_frames.response_id AND f.user_id = auth.uid()
    )
  );
```
