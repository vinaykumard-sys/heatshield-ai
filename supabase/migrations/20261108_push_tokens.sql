-- ==============================================================================
-- HEATSHIELD AI — EXPO PUSH TOKENS SCHEMA & RLS POLICIES
-- Migration Version: 20261108_push_tokens
-- Scope: Multi-device push notification token registry for Android & cross-platform alerts
-- ==============================================================================

create table if not exists public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  expo_push_token text not null unique,
  platform text default 'android',
  device_id text,
  device_name text,
  enabled boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  last_seen_at timestamptz default now()
);

-- Indices for rapid query lookups during emergency push dispatch
create index if not exists idx_push_tokens_user_id on public.push_tokens(user_id);
create index if not exists idx_push_tokens_enabled on public.push_tokens(enabled) where enabled = true;
create index if not exists idx_push_tokens_platform on public.push_tokens(platform);

-- Enable Row Level Security
alter table public.push_tokens enable row level security;

-- Idempotent RLS Policy Setup
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'push_tokens' and policyname = 'Users can manage their own push tokens'
  ) then
    create policy "Users can manage their own push tokens" on public.push_tokens
      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;

-- Service role bypass policy for backend dispatchers (e.g. edge functions / cron jobs)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'push_tokens' and policyname = 'Service role has full access to push tokens'
  ) then
    create policy "Service role has full access to push tokens" on public.push_tokens
      for all using (auth.role() = 'service_role');
  end if;
end $$;

-- Update trigger for updated_at
create or replace function public.handle_push_tokens_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_push_tokens_updated_at on public.push_tokens;
create trigger set_push_tokens_updated_at
  before update on public.push_tokens
  for each row
  execute function public.handle_push_tokens_updated_at();
