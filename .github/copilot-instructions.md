# Copilot Instructions for Online Designer Beta

## Project Overview
- **Online Designer Beta** is a web application for building, previewing, and managing forms, with integrations for notifications and automation (Zapier).
- The main frontend is in `src/` (React + TypeScript, Vite, Tailwind CSS). Backend logic and API endpoints are in `api/` and `src/api/`.
- Supabase is used for authentication, storage, and database. See `.env.example` for required environment variables.

## Key Components & Data Flow
- **Forms**: Core logic in `src/api/forms.ts` and UI in `src/components/FormPreview.tsx`.
- **Notifications**: Email notification logic in `src/api/send-response-email.ts` and SQL triggers in `supabase/`.
- **Storage**: Uses Supabase buckets (`client-logos`, `form-assets`). SQL setup in `supabase/create_buckets.sql`.
- **Zapier Integration**: Automation logic in `zapier-app/` (see its `README.md`).

## Developer Workflows
- **Local Setup**: Copy `.env.example` to `.env`, fill in Supabase keys. Install dependencies with `npm install`. Start dev server with `npm run dev`.
- **Testing**: Zapier integration tests via `zapier test` in `zapier-app/`. No global test runner for frontend yet.
- **Deployment**: Main site deploys to GitHub Pages. Zapier app deploys via Zapier CLI.

## Project-Specific Conventions
- **Environment Variables**: All Supabase config is loaded from `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- **Notifications**: Use the `ToastProvider` for user feedback (see `src/App.tsx`).
- **SQL Migrations**: All schema changes and triggers are managed in `supabase/` as `.sql` files.
- **No secrets in source control**: Never commit `.env` or API keys.

## Integration Points
- **Supabase**: Used for auth, storage, and database. SQL setup scripts in `supabase/`.
- **Zapier**: Integrates via API key (see `zapier-app/README.md`).
- **Email**: Email notifications triggered by SQL and handled in `src/api/send-response-email.ts`.

## Examples
- To add a new form field type, update `src/api/forms.ts` and corresponding UI in `src/components/FormPreview.tsx`.
- To add a new notification, update SQL triggers in `supabase/email_notification_trigger.sql` and logic in `src/api/send-response-email.ts`.

## References
- Main app: `src/`, `api/`, `supabase/`
- Zapier integration: `zapier-app/`
- Storage setup: `supabase/create_buckets.sql`
- Toast notifications: `src/App.tsx`

---

For unclear or missing conventions, check `README.md` files or ask for clarification.
