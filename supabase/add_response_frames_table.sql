-- Create response_frames table and policies for frames_plan submissions
-- Run this in the Supabase SQL editor. Safe to re-run.

-- 1) Table
create table if not exists public.response_frames (
  id uuid primary key default gen_random_uuid(),
  response_id uuid not null references public.responses(id) on delete cascade,
  step_id uuid not null references public.form_steps(id) on delete cascade,
  frame_number integer not null,
  image_url text,
  location_text text,
  measurements_text text,
  created_at timestamptz default now()
);

-- 2) RLS
alter table public.response_frames enable row level security;

-- Drop old policies if they exist to avoid duplicates
drop policy if exists "Users can view accessible response_frames" on public.response_frames;
drop policy if exists "Public can create response_frames for public forms" on public.response_frames;

-- View policy: signed-in users who own the form can read associated frames
create policy "Users can view accessible response_frames" on public.response_frames
  for select using (
    exists (
      select 1 from public.responses r
      join public.forms f on r.form_id = f.id
      where r.id = response_frames.response_id and f.user_id = auth.uid()
    )
  );

-- Insert policy: allow inserts when a corresponding response exists (mirrors responses insert allowance)
create policy "Public can create response_frames for public forms" on public.response_frames
  for insert with check (
    exists (
      select 1 from public.responses r
      where r.id = response_frames.response_id
    )
  );

-- 3) Indexes
create index if not exists idx_response_frames_response_id on public.response_frames(response_id);
create index if not exists idx_response_frames_step_id on public.response_frames(step_id);

-- 4) Docs
comment on table public.response_frames is 'Stores per-frame data captured from frames_plan steps';
comment on column public.response_frames.frame_number is 'Sequential number of the frame (1..N)';

-- 5) Ask PostgREST to reload schema (so REST endpoint appears immediately)
notify pgrst, 'reload schema';
