# Online Designer Beta

Local setup

1. Copy `.env.example` to `.env` and fill in your Supabase project URL and anon key.
2. Install dependencies: `npm install`
3. Run dev server: `npm run dev`

Security

- Never commit `.env` or secrets to your repository. Keep keys out of source control.

What I changed

- Removed hardcoded Supabase defaults and now require `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- Added a small `ToastProvider` to show user feedback for common actions.
- Wired toasts into Clients, Forms, and Responses pages for success/error notifications.

Next steps

- Add unit tests and pagination for large lists.
- Add image upload UI for client logos.

Storage buckets

This app expects two public storage buckets in Supabase:
- `client-logos` (used to store client uploaded logos)
- `form-assets` (used to store form option images)

You can create them via the Supabase UI (Storage -> New bucket) or run the SQL in `supabase/create_buckets.sql`.

If you prefer private buckets, create them as private and update upload logic to use signed URLs.
