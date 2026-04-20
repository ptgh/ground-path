-- Practitioner subscriptions: gates whether a verified practitioner appears in /book directory.
-- A$25/month recurring AUD via Stripe Checkout; 14-day trial; grace period until current_period_end.
create table public.practitioner_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  stripe_customer_id text not null,
  stripe_subscription_id text not null unique,
  stripe_price_id text not null,
  status text not null,
  current_period_end timestamptz,
  cancel_at_period_end boolean default false,
  trial_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.practitioner_subscriptions enable row level security;

-- Practitioners can read their own subscription row
create policy "Users can view own subscription"
  on public.practitioner_subscriptions for select
  to authenticated
  using (auth.uid() = user_id);

-- Admins can read all subscription rows
create policy "Admins can view all subscriptions"
  on public.practitioner_subscriptions for select
  to authenticated
  using (has_role(auth.uid(), 'admin'::app_role));

-- Writes are service-role only (Stripe webhook + edge functions). No insert/update/delete policies = blocked for normal users.

-- Updated-at trigger
create trigger update_practitioner_subscriptions_updated_at
  before update on public.practitioner_subscriptions
  for each row execute function public.update_updated_at_column();

-- Helper: does this user have an active or trialing subscription right now?
create or replace function public.has_active_practitioner_subscription(_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.practitioner_subscriptions
    where user_id = _user_id
      and status in ('active', 'trialing')
      and (current_period_end is null or current_period_end > now())
      and cancel_at_period_end = false
        or (
          status in ('active', 'trialing')
          and current_period_end is not null
          and current_period_end > now()
        )
  )
$$;

-- Returns the bookable practitioners shape that Book.tsx consumes.
-- Filters: verified practitioner + admin-approved + active subscription.
create or replace function public.list_bookable_practitioners()
returns table (
  user_id uuid,
  display_name text,
  avatar_url text,
  profession text,
  bio text,
  specializations text[],
  practice_location text,
  professional_verified boolean,
  halaxy_integration jsonb
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.user_id,
    p.display_name,
    p.avatar_url,
    p.profession,
    p.bio,
    p.specializations,
    p.practice_location,
    p.professional_verified,
    p.halaxy_integration
  from public.profiles p
  where p.user_type = 'practitioner'
    and coalesce(p.directory_approved, false) = true
    and p.verification_status in ('verified', 'pending_review')
    and public.has_active_practitioner_subscription(p.user_id) = true
$$;