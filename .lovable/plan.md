
# Plan — Practitioner deep-link booking, profile availability, and subtle "treasures of joy"

## 0. Fix the two blocking build errors first (carry-over)

**Email template** — `supabase/functions/send-email/_templates/mailing-list-confirmation.tsx`
The previous attempt to fix `pY/pX` clearly didn't land. Replace both `<Button pY={..} pX={..} style={..}>` calls with plain `<Button style={{ ...button, padding: '12px 24px' }}>` (and the secondary one with `'10px 20px'`). Drop the `pY/pX` props entirely.

**Weekly newsletter** — `supabase/functions/weekly-newsletter/index.ts:227`
Replace `error: error.message` with `error: error instanceof Error ? error.message : String(error)`.

These two TS errors are blocking the Deno typecheck for the whole functions bundle.

---

## 1. Recreate `PractitionerProfile` page (it never landed)

The previous summary claimed `src/pages/PractitionerProfile.tsx` was created, but it isn't on disk and `App.tsx` has no route for it. Create:

- **`src/pages/PractitionerProfile.tsx`** at route `/practitioner/:userId` — public page showing avatar, name, profession, verified badge, location, bio, qualifications, specializations, registrations, **and** an "Upcoming availability" summary.
- Fetches:
  1. `profiles` (single row by `user_id`, `directory_approved=true`, status verified/pending).
  2. `practitioner_registrations` for this user.
  3. `practitioner_availability` (recurring + specific) — derives the **next 3 telehealth slots** and **next 1–2 in-person slots** by walking the next 14 days against weekly recurring blocks and subtracting any `booking_requests` that are already `pending`/`approved`.
- "Telehealth" vs "in-person" inferred from `practice_location` presence + `halaxy_integration.session_types` if present; otherwise default to telehealth-only.
- SEO: `<SEO>` with `Person` JSON-LD (name, jobTitle, image, address.addressCountry "AU", url).
- Two CTAs: **"Book with {name}"** → `/book?practitioner={user_id}`, and **"Message"** → existing flow.

Also **add the route** in `src/App.tsx` (lazy-loaded) and ensure the `AIAssistantRouter` treats `/practitioner/:id` (any path NOT starting with `/practitioner/dashboard|messages|forms|verify|auth|admin`) as a public client page — render `<ClientAIAssistant />`. Today the check is just `startsWith('/practitioner')`, which would suppress the assistant. I'll switch to an allow-list of dashboard-style paths.

Update `src/components/PractitionerCard.tsx` so the avatar + name link to `/practitioner/${user_id}` (clickable card header), keeping the existing Message / Book buttons.

---

## 2. Pre-filter Book flow for the chosen practitioner

`src/pages/Book.tsx` already loads all practitioners then waits for `setSelectedPractitioner`. Change:

- Read `?practitioner=<uuid>` (and accept `?date=YYYY-MM-DD` as a bonus).
- After `practitioners` load, if a query param matches a directory entry, auto-`setSelectedPractitioner(match)` and skip the directory grid (jump straight to the calendar/check-in step).
- Show a small "Booking with **{name}** — change practitioner" link that clears the selection and returns to the grid.
- Update `PractitionerCard` Book button: when in native mode, `navigate(\`/book?practitioner=${user_id}\`)` instead of plain `/book`.
- Update `PractitionerProfile` Book CTA to use the same query.
- If the param is invalid or the practitioner isn't bookable, fall back gracefully to the directory grid with a toast.

---

## 3. Header "weather + encouragement" strip (subtle, opt-in feel)

A slim, single-line strip that sits **above** the existing nav (or inline on the right on desktop, hidden on mobile to protect the 430px viewport). New component **`src/components/header/WeatherEncouragement.tsx`**:

- Geolocates the visitor via the free, no-key **Open-Meteo** API:
  - First call `https://ipapi.co/json/` (no key, CORS-enabled) for a coarse city + lat/lon.
  - Then `https://api.open-meteo.com/v1/forecast?latitude=..&longitude=..&current=temperature_2m,weather_code` for the temp + WMO code.
- Maps WMO code → lucide icon (Sun, CloudSun, Cloud, CloudRain, CloudSnow, CloudLightning, CloudFog) and a one-word label ("Sunny", "Showers", etc.).
- Pairs with a rotating, gentle quote/anecdote chosen daily (deterministic by date, so it's stable across a session) from a curated list of ~25 grounded, non-clinical lines (e.g. *"Small steps still move mountains."*). All text plain, AASW-tone-safe, no emoji clutter.
- Result renders as: `🌤  19° Sydney  ·  "Small steps still move mountains."` in `text-xs text-muted-foreground`, with an unobtrusive divider.
- **Resilience**: any failure (offline, blocked, denied) silently hides the strip — never a red error, never a layout shift (reserve height with `min-h-[24px]` and CSS opacity transition).
- Caches result in `sessionStorage` for the session to avoid repeated calls.
- Respects `prefers-reduced-motion` for its fade-in.
- **Privacy note**: ipapi only sees the IP that already hits any web server; we don't request browser geolocation, so no permission prompt.

Mounted inside `Header.tsx` desktop bar (right of nav, left of auth) and as a single line under the mobile menu button (collapsed inside the drawer when open, to avoid the cramped 430px width).

I'll ask you before shipping if you'd prefer **always-on** vs **only on `/`** — see Question 1.

---

## 4. "Treasures and discoveries of joy" — hidden gems system

Subtle, never gimmicky. Built around a single small primitive so we can sprinkle without redesigning anything:

**a. New primitive `src/components/delight/Sparkle.tsx`**
- Wraps any element. On hover (desktop) or first-time-this-session view (mobile, via IntersectionObserver), runs a **single** GSAP shimmer (3 tiny dots fading out around the element, 600ms). Honors `prefers-reduced-motion` and only fires once per element-key per session (`sessionStorage` key).

**b. New hook `src/hooks/useReturningVisitor.ts`**
- Reads `localStorage.gp_visit_count`, `gp_last_visit_at`, `gp_streak_days`. Updates on mount.
- Exposes `{ visitCount, isReturning, daysSinceLast, streak }` plus a `markMilestone(name)` helper that sets a one-time flag so a celebration only ever fires once per user.

**c. Personalised greeting band on the Client Dashboard** (`src/pages/ClientDashboard.tsx`)
- Replaces today's static welcome with a one-line, time-of-day-aware greeting using `profile.display_name?.split(' ')[0]`:
  - "Good morning, Alex — glad you're back." (morning)
  - "Welcome back, Alex. Three visits this week — that's care in action." (when streak ≥ 3)
  - First-time: "Welcome, Alex. This is your space — take it gently."
- Uses a soft, **non-green accent** (warm amber `hsl(38 70% 60%)` introduced as `--accent-warm` token in `index.css`) for the underline only, so the brand still reads sage-first.

**d. Hidden gems sprinkled (each subtle, all opt-in to existence by virtue of being tiny):**
1. **Resources page** — a daily rotating "Today's gentle reminder" card at the top of the worksheets list (1-line quote + small lucide `Sparkles` icon). Same deterministic-by-date selection as the header.
2. **After completing a check-in** (`PreSessionCheckIn`) — toast becomes `"Thank you for showing up for yourself."` instead of generic success.
3. **Logo Easter egg** — clicking the logo 5x in 3s fires the Sparkle effect across the page header. Logged once per session. Pure delight, zero side effects.
4. **Footer** — replace the static "© groundpath" line with a tiny rotating anecdote anchored to the date, in `text-[11px] text-muted-foreground/70`.
5. **Booking confirmation** — after a successful booking request, the confirmation card gets a one-time Sparkle and the line "You took a brave step today."

**e. Returning-visitor celebration milestones (max one per session, ever):**
- 3rd visit ever → soft toast: "Three visits in. We're glad you're making this a habit."
- 7-day streak → toast + Sparkle on the dashboard header.
- 1st booking → permanent (until acknowledged) info banner on dashboard: "Your first session is booked. We'll be here."

All milestones gated by `markMilestone(name)` so they never repeat.

---

## 5. Tasteful colour expansion (beyond sage green)

Add three **semantic** accents to `src/index.css` as HSL tokens — used sparingly, only for delight surfaces, never for primary CTAs (brand stays sage):

- `--accent-warm: 38 78% 62%`  (soft amber — greetings, sparkles)
- `--accent-sky:  202 70% 64%` (calm sky — weather strip icon)
- `--accent-rose: 350 60% 70%` (gentle rose — milestone toasts)

Expose via Tailwind in `tailwind.config.ts` as `accent-warm`, `accent-sky`, `accent-rose`. **No component is recoloured wholesale** — these only appear in the new delight components and the milestone toasts, so the sage brand identity is preserved.

---

## 6. Tests & QA

- Unit test for the slot-derivation helper used by both `Book.tsx` and `PractitionerProfile.tsx` — extract into `src/lib/availability.ts` so the same logic powers "next slots summary" and "bookable slots on date X".
- Vitest for `useReturningVisitor` (visit count increments, streak math).
- Vitest for `WeatherEncouragement` mocked-fetch path (renders gracefully on failure, no crash).
- Manual QA pass at 430×697 (current viewport) to confirm the header strip collapses cleanly and the Sparkle never causes layout shift.
- `bunx tsc --noEmit` + `bun run build` + `bunx vitest run` must all stay green.

---

## Files I'll create
- `src/pages/PractitionerProfile.tsx`
- `src/components/header/WeatherEncouragement.tsx`
- `src/components/delight/Sparkle.tsx`
- `src/hooks/useReturningVisitor.ts`
- `src/lib/availability.ts` (+ `src/lib/availability.test.ts`)
- `src/lib/quotes.ts` (curated, AASW-tone-checked list)

## Files I'll edit
- `supabase/functions/send-email/_templates/mailing-list-confirmation.tsx` (build fix)
- `supabase/functions/weekly-newsletter/index.ts` (build fix)
- `src/App.tsx` (route + AIAssistantRouter allow-list)
- `src/components/PractitionerCard.tsx` (link header to profile, deep-link Book)
- `src/pages/Book.tsx` (read `?practitioner=` param, auto-select, "change" link)
- `src/components/Header.tsx` (mount WeatherEncouragement)
- `src/pages/ClientDashboard.tsx` (greeting band + milestone hooks)
- `src/pages/Resources.tsx` ("today's gentle reminder" card)
- `src/components/booking/PreSessionCheckIn.tsx` (warmer success toast)
- `src/components/Logo.tsx` (5-tap easter egg)
- `src/components/Footer.tsx` (rotating anecdote line)
- `src/index.css` + `tailwind.config.ts` (3 new accent tokens)

## Memory updates
- Add `mem://design/delight-system` describing Sparkle/quotes/milestones rules so future sessions don't over-apply.
- Add `mem://design/accent-palette-extension` documenting the three new accents and where they may/may-not be used.

---

## Two quick questions before I implement
I'll send these via `ask_questions` once you say "go", but flagging them now so you can answer in your reply if you want:

1. **Weather + quote strip placement** — site-wide in the header, or only on the homepage `/`? Site-wide gives more delight; homepage-only keeps the app surfaces (dashboard, messages, forms) cleaner.
2. **Geolocation source** — the no-key `ipapi.co` route I described, or use the browser's `navigator.geolocation` (more accurate but triggers a permission prompt the first time)?
