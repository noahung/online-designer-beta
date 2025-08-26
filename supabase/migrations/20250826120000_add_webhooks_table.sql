-- Create webhooks table for storing Zapier webhook subscriptions
create table public.webhooks (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    form_id uuid references public.forms(id) on delete cascade not null,
    target_url text not null,
    active boolean default true not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add RLS policies
alter table public.webhooks enable row level security;

-- Policy: Users can only manage their own webhooks
create policy "Users can manage their own webhooks" on public.webhooks
    for all using (auth.uid() = user_id);

-- Create indexes
create index webhooks_user_id_idx on public.webhooks(user_id);
create index webhooks_form_id_idx on public.webhooks(form_id);
create index webhooks_active_idx on public.webhooks(active);

-- Create unique constraint on user_id, form_id, target_url combination
create unique index webhooks_unique_subscription on public.webhooks(user_id, form_id, target_url);

-- Create function to update updated_at timestamp
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- Add trigger to update updated_at timestamp
create trigger update_webhooks_updated_at
    before update on public.webhooks
    for each row
    execute procedure public.update_updated_at_column();
