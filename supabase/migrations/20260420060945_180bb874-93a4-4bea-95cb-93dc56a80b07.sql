-- Fix the helper: strict check for active/trialing status with grace period until current_period_end.
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
  )
$$;