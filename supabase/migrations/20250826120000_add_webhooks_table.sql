-- Create user_settings table if it doesn't exist (for API keys and webhook settings)
create table if not exists public.user_settings (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null unique,
    webhook_url text,
    zapier_enabled boolean default false not null,
    api_key text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for user_settings
do $$ begin
    if not exists (
        select 1 from pg_tables 
        where tablename = 'user_settings' 
        and rowsecurity = true
    ) then
        alter table public.user_settings enable row level security;
    end if;
end $$;

-- Drop and recreate user_settings policies
drop policy if exists "Users can manage their own settings" on public.user_settings;
create policy "Users can manage their own settings" on public.user_settings
    for all using (auth.uid() = user_id);

-- Create webhooks table for storing Zapier webhook subscriptions
create table if not exists public.webhooks (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    form_id uuid references public.forms(id) on delete cascade not null,
    target_url text not null,
    active boolean default true not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for webhooks
do $$ begin
    if not exists (
        select 1 from pg_tables 
        where tablename = 'webhooks' 
        and rowsecurity = true
    ) then
        alter table public.webhooks enable row level security;
    end if;
end $$;

-- Drop and recreate webhooks policies
drop policy if exists "Users can manage their own webhooks" on public.webhooks;
create policy "Users can manage their own webhooks" on public.webhooks
    for all using (auth.uid() = user_id);

-- Create indexes (if not exists)
create index if not exists webhooks_user_id_idx on public.webhooks(user_id);
create index if not exists webhooks_form_id_idx on public.webhooks(form_id);
create index if not exists webhooks_active_idx on public.webhooks(active);
create index if not exists user_settings_user_id_idx on public.user_settings(user_id);
create index if not exists user_settings_api_key_idx on public.user_settings(api_key);

-- Create unique constraint on user_id, form_id, target_url combination (if not exists)
create unique index if not exists webhooks_unique_subscription on public.webhooks(user_id, form_id, target_url);

-- Create function to update updated_at timestamp
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- Drop and recreate triggers to avoid conflicts
drop trigger if exists update_webhooks_updated_at on public.webhooks;
create trigger update_webhooks_updated_at
    before update on public.webhooks
    for each row
    execute procedure public.update_updated_at_column();

drop trigger if exists update_user_settings_updated_at on public.user_settings;
create trigger update_user_settings_updated_at
    before update on public.user_settings
    for each row
    execute procedure public.update_updated_at_column();
