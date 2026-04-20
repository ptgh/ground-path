-- Practitioner Stripe Connect (Express) accounts for direct payouts.
create table public.practitioner_connect_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  stripe_account_id text not null unique,
  charges_enabled boolean not null default false,
  payouts_enabled boolean not null default false,
  details_submitted boolean not null default false,
  requirements_currently_due text[] default '{}',
  country text default 'AU',
  default_currency text default 'aud',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.practitioner_connect_accounts enable row level security;

create policy "Own connect account"
  on public.practitioner_connect_accounts
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Admins view all connect accounts"
  on public.practitioner_connect_accounts
  for select
  to authenticated
  using (has_role(auth.uid(), 'admin'::app_role));

-- writes are service-role only (edge functions + webhook)

create trigger trg_connect_accounts_updated_at
  before update on public.practitioner_connect_accounts
  for each row execute function public.update_updated_at_column();

-- True when practitioner can receive direct transfers (charges + payouts both enabled).
create or replace function public.is_practitioner_connect_ready(_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.practitioner_connect_accounts
    where user_id = _user_id
      and charges_enabled = true
      and payouts_enabled = true
  )
$$;