
User confirmed: AUD currency throughout. Awaiting answers on remaining 3 questions but I'll lock in sensible defaults and call them out so the user can override on approval.

**Locked decisions**
- Currency: **AUD** site-wide (practitioner subscription + client charges). Stripe price will be AUD-denominated.
- Practitioner subscription price: **A$25/month** (matches £25 magnitude in AUD; user can adjust later by changing the Stripe price ID).
- Trial: **14-day free trial** (default — easy to disable).
- Lapse policy: **Grace until period end** (listing stays bookable until `current_period_end`, then hides).
- Approval gate: **Both required** — `directory_approved=true` AND active subscription.

If any of those defaults are wrong, say so on approval and I'll flip them before building.

---

## Plan

### Part 1 — Semantic token sweep (12 components)
Replace `gray-*` / `bg-white` / `text-white` / `sage-N` with semantic tokens (`bg-card`, `bg-muted`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-primary`, `text-primary`, `text-primary-foreground`).

Files:
- `MailingListModal.tsx`, `NewsletterTest.tsx`, `AIAssistant.tsx`
- `PrivacyPolicyModal.tsx`, `TermsOfServiceModal.tsx`
- Booking: `CalendarTilePopover.tsx`
- Messaging: `ClientMessagesPanel`, `MessageAttachment`, `MessagePractitionerButton`, `MessageStatus`, `MessageThread`, `ResourceShareForm`
- Dashboard: `ArticleManager`, `Microsoft365Card`, `NativeBooking`, `ProfessionalResources`

No behaviour changes — visual refinement only.

### Part 2 — Sentry browser SDK
- Install `@sentry/react` + `@sentry/vite-plugin`.
- New `src/lib/sentry.ts`:
  - DSN from `VITE_SENTRY_DSN` (skip init if absent → dev stays clean)
  - `release: import.meta.env.VITE_APP_VERSION`, `environment: import.meta.env.MODE`
  - `tracesSampleRate: 0.1`, `replaysOnErrorSampleRate: 1.0`
  - `Sentry.captureConsoleIntegration({ levels: ['error', 'warn'] })` to forward existing logs
- Init in `src/main.tsx` before render; wrap existing `ErrorBoundary` with `Sentry.ErrorBoundary` fallback.
- `vite.config.ts` — add `sentryVitePlugin` (only runs when `SENTRY_AUTH_TOKEN` present, won't break local builds).
- **Will request 2 secrets before deploy**: `VITE_SENTRY_DSN` (public, in `.env`) + `SENTRY_AUTH_TOKEN` (build-only).

### Part 3 — Practitioner A$25/mo subscription (gates directory listing only)

**Concept**: All practitioner tools (forms, notes, messaging, AI, CPD log) stay free for verified practitioners. The single gated capability is **appearing in `/book` and being bookable** — that requires an active Stripe subscription on top of the existing `directory_approved` admin flag.

**Migration**:
```sql
create table public.practitioner_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  stripe_customer_id text not null,
  stripe_subscription_id text not null unique,
  stripe_price_id text not null,
  status text not null,         -- active|trialing|past_due|canceled|incomplete
  current_period_end timestamptz,
  cancel_at_period_end boolean default false,
  trial_end timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.practitioner_subscriptions enable row level security;

create policy "Own subscription" on public.practitioner_subscriptions
  for select using (auth.uid() = user_id);
create policy "Admins view all subs" on public.practitioner_subscriptions
  for select using (has_role(auth.uid(), 'admin'));
-- writes are service-role only (webhook + edge functions)

create or replace function public.has_active_practitioner_subscription(_uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.practitioner_subscriptions
    where user_id = _uid
      and status in ('active','trialing')
      and (current_period_end is null or current_period_end > now())
  )
$$;
```

**Directory gating** — new SECURITY DEFINER RPC `list_bookable_practitioners()` returning the same shape `Book.tsx` already consumes, but filtered to `directory_approved=true AND has_active_practitioner_subscription(user_id)`. Swap the existing `.from('profiles').select(...).eq('directory_approved', true)` query in `Book.tsx` to use `supabase.rpc('list_bookable_practitioners')`.

**Stripe** (uses existing `STRIPE_SECRET_KEY` + webhook):
- New secret to add: `STRIPE_PRACTITIONER_PRICE_ID` (A$25/mo recurring price the user creates in Stripe dashboard).
- New edge functions:
  - `create-practitioner-subscription` → Stripe Checkout session (`mode=subscription`, `trial_period_days=14`, success/cancel URLs back to dashboard)
  - `cancel-practitioner-subscription` → sets `cancel_at_period_end=true`
  - `get-practitioner-subscription` → returns the row
- Extend `stripe-webhook/index.ts` to handle:
  - `checkout.session.completed` (subscription mode) → upsert
  - `customer.subscription.updated` / `.deleted` → status + period end
  - `invoice.payment_failed` → mark `past_due`

**UI**:
- New `src/components/dashboard/PractitionerSubscriptionCard.tsx` on the practitioner dashboard:
  - No active sub → "Activate directory listing — A$25/month, 14-day free trial" CTA → checkout
  - Active → status badge, next renewal date, "Manage / cancel" button
  - Clear copy on what subscription unlocks (directory + bookings) vs free (forms, notes, messaging, AI)
- Soft amber banner on the practitioner profile page when `directory_approved=true` AND subscription inactive: "Your listing is paused — renew to be bookable."

**Permissions matrix**:
| Capability | Free verified practitioner | Subscribed |
|---|:-:|:-:|
| Login, dashboard, profile editing | ✅ | ✅ |
| Forms, notes, AI assistant, CPD log | ✅ | ✅ |
| Messaging existing clients | ✅ | ✅ |
| Listed in `/book` directory | ❌ | ✅ |
| Receive new client bookings | ❌ | ✅ |

### Order of operations
1. Token sweep (no risk, no secrets needed)
2. Sentry — request 2 secrets, then wire
3. Practitioner subscription — migration + RPC + edge functions + UI card + Book.tsx swap
4. Request `STRIPE_PRACTITIONER_PRICE_ID` once function is ready

### Manual steps the user will do (I'll tell them when)
- Create A$25/month recurring AUD price in Stripe dashboard → paste price ID into the `STRIPE_PRACTITIONER_PRICE_ID` secret prompt.
- Create a Sentry project → paste DSN + auth token.
