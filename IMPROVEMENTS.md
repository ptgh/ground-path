# Improvements — Backend and Frontend



> Living audit of the Groundpath platform. Items are tagged with their current status. This document is the source of truth for "what's left to do" — keep it honest, strike completed items rather than leaving stale recommendations.



**Last refreshed**: 30 April 2026 — after the gold-standard hardening session.



---



## Status legend



- ✅ **SHIPPED** — done, verified in production

- 🚧 **IN PROGRESS** — partially done, more work needed

- ⏳ **DEFERRED** — known issue, scheduled for a later session

- 💭 **CONSIDERING** — flagged for design discussion, not yet committed



---



## Table of Contents



1. [Critical — Status Update](#1-critical--status-update)

2. [Backend Improvements](#2-backend-improvements)

3. [Frontend Improvements](#3-frontend-improvements)

4. [Shared / Cross-Cutting Improvements](#4-shared--cross-cutting-improvements)

5. [Session Log](#5-session-log)



---



## 1. Critical — Status Update



### 1.1 Remove `.env` from Version Control ✅ SHIPPED



`.env` is in `.gitignore` and not present in the repo. Verified by inspection.



---



### 1.2 Restrict CORS on All Edge Functions ✅ SHIPPED (29 April 2026)



Replaced wildcard `Access-Control-Allow-Origin: *` with an origin-reflecting allowlist via `_shared/cors.ts`. Allowlist covers production domains, lovable.app preview deployments, and localhost dev. 29 functions migrated. Two functions deliberately retained wildcards with explanatory comments: `stripe-webhook` (no Origin header from Stripe IPs, trust via signature) and `auth-email-hook` (server-to-server invocation by Supabase Auth, trust via HMAC).



---



### 1.3 Fix Open Redirect in Auth Flow ⏳ DEFERRED



Status: re-verify whether this is still an issue. Earlier audit suggested `AuthPage.tsx` reads `?redirect=` without validation, but a recent code search did not find this parameter in the current `AuthPage.tsx`. Possibly already addressed in an earlier session.



**Action**: spot-check `AuthPage.tsx` and `AuthCallback.tsx` for any redirect-after-login parameter handling. If unvalidated, apply the allowlist pattern. Estimated 30 min.



---



### 1.4 Add Auth to Unprotected Edge Functions ✅ SHIPPED



`send-email`, `send-newsletter`, `generate-articles`, `check-links` all now use `verifyAuth` or `requireM365Caller` (depending on caller pattern). Verified during the audit-chain rollout. Public-callable functions (`contact-form-submit`) intentionally have no JWT — they're rate-limited by IP and write a server-side audit row instead.



---



## 2. Backend Improvements



### 2.1 Input Validation and Sanitization ⏳ DEFERRED



**Problem**: Edge functions parse JSON request bodies without schema validation. A malformed body could crash a function or produce unexpected behaviour.



**Recommendation**: Adopt `zod` for runtime schema validation at function entry points. Define one schema per function near the request type. Reject early with structured error responses.



**Priority**: medium. Most functions are admin-gated so the attack surface is small, but defence-in-depth matters and the failure modes today are silent (parse error → generic 500).



**Files**: every `supabase/functions/*/index.ts` that accepts a request body.



**Effort**: 2-4h for a comprehensive sweep, or roll in opportunistically when next touching each function.



---



### 2.2 Rate Limiting 🚧 IN PROGRESS



`contact-form-submit` has IP-based rate limiting (3 submissions per 5 min) — shipped during the public-form refactor. No other functions have rate limits.



**Recommendation**: extend the rate-limit pattern from `contact-form-submit` to other public-facing surfaces if any are added (none currently). For admin-gated functions, the JWT requirement is sufficient — admins aren't a DDOS vector.



**Priority**: low. Re-evaluate if the public surface area expands.



---



### 2.3 Error Handling and Logging ✅ SHIPPED (30 April 2026)



Three-leg observability stack now in place:

- **Postgres** `m365_audit_log` table — canonical record of every meaningful function invocation. Every row has `function_name`, `action`, `status`, `target`, `request_metadata` (including `triggered_by`), `latency_ms`. Consistent populations across cron jobs, admin actions, and public form submissions.

- **OpsLog Excel** in OneDrive — secondary human-readable mirror. Every Postgres audit row also writes a corresponding Excel row via `fireAndForgetOpsLog`.

- **Sentry** error tracking — frontend (React) and edge functions both instrumented. PII scrubbing in `beforeSend`. No session replay (privacy posture for mental-health practice). User identification is ID-only.



The `triggered_by` field convention is "immediate caller" — `contact-form-submit` for orchestrator-driven sends, `m365-evening-outlook-triage` for cron, the admin's email for JWT-authenticated invocations, the literal sentinel `public-form-submission` for anonymous public form posts.



**Open follow-up**: verify in production tomorrow morning when the natural cron fires that `ms-outlook-triage`'s audit row reads `triggered_by: m365-morning-outlook-triage` (B-cleanup mini was applied today; cron-driven verification pending).



---



### 2.4 Database Row Level Security ⏳ DEFERRED



**Problem**: Pre-existing security linter warnings (38-42 according to last audit) flag inconsistent RLS policies, missing `auth.uid()` filters, and overly permissive `USING (true)` clauses on some tables.



**Recommendation**: Triage the linter warnings systematically. Start with the highest-severity (likely tables containing PII like `contact_forms`, `practitioner_profiles`, `messages`). Each warning needs case-by-case judgement — sometimes the permissive policy is intentional (e.g., `mailing_list` for unsubscribe-by-token).



**Priority**: high but separate session. Estimated 4-8h dedicated focus.



**File**: identify via `npx supabase db lint` or the Supabase dashboard linter view.



---



### 2.5 API Response Consistency ⏳ DEFERRED



**Problem**: Edge functions return inconsistent response shapes. Some use `{ ok: true, ...data }`, others `{ success: true }`, others raw data, others `{ error: '...' }`.



**Recommendation**: Adopt a discriminated union return type:

```typescript

type EdgeResponse<T> = { ok: true; data: T } | { ok: false; error: string; code?: string };

```

Roll out opportunistically — don't refactor all functions at once. New functions adopt the convention; existing ones convert when next touched.



**Priority**: low cosmetic, becomes higher value when the API surface stabilises.



---



### 2.6 Supabase Configuration Hardening 💭 CONSIDERING



**Open questions**:

- Should `verify_jwt` be set to `true` for `contact-form-submit`? Currently false because it's public. Trade-off: switching to true would require the frontend to acquire an anon-JWT first, which adds latency and a new failure mode. Current approach (server-side IP rate limit + structured audit) is probably correct.

- Is the cron-secret pattern over-engineered now that the cron-trigger-header allowlist is in place? Both work; both are defensible. Could simplify by deprecating cron-secret entirely.



**Priority**: design discussion, not urgent.



---



### 2.7 Two Intake Systems — Convergence Research ⏳ DEFERRED



**Problem**: There appear to be two parallel intake systems:

- `contact_forms` table + `contact-form-submit` orchestrator (the current public form chain)

- `Book.tsx` + 5+ Stripe functions (`charge-client-session`, `create-connect-account`, etc.) — appears to be a separate booking flow



**Action**: investigation first, refactor later. Read both systems end-to-end, document where they overlap and where they diverge, decide whether to unify or to formalise the separation.



**Priority**: high architectural value. Estimated 1-2h research session before any code changes.



---



## 3. Frontend Improvements



### 3.1 Component Refactoring ⏳ DEFERRED



**Problem**: Several large components are getting unwieldy. Lines of code as of 30 April 2026:

- `Dashboard.tsx` — 785 lines

- `PractitionerProfile.tsx` — 674 lines

- `AdminMailingList.tsx` — 651 lines

- `AdminIntake.tsx` — 627 lines (recent — accept for now)

- `AdminCompliance.tsx` — 627 lines (recent — accept for now)

- `AdminM365Hub.tsx` — 573 lines



**Recommendation**: opportunistic refactor when next touching. Don't refactor proactively just to reduce line count. The natural break-points are: extracting drawers, list rendering, stats strips into sub-components.



**Priority**: ongoing, no dedicated session needed.



---



### 3.2 TypeScript Strict Mode ⏳ DEFERRED



**Problem**: `tsconfig.json` does not enable `strict: true`. Likely 100-200 type errors would surface if it were enabled.



**Recommendation**: 1-2 day dedicated sprint. Enable `strict: true`, work through errors file-by-file. Not piecemeal — strict mode is all-or-nothing.



**Priority**: high value when it lands but big bang. Defer until a quieter period.



---



### 3.3 State Management ⏳ DEFERRED



**Problem**: Component state is currently a mix of local `useState`, ad-hoc context providers, and direct Supabase queries. No global state library.



**Recommendation**: For the current scale, no library is needed — React Query (already used implicitly via Supabase) is sufficient. Re-evaluate if cross-component state coordination becomes painful.



**Priority**: low. Not adding tech debt.



---



### 3.4 Performance Optimization ⏳ DEFERRED



**Problem**: No code splitting beyond what Vite does automatically. Some pages probably load more than they need.



**Recommendation**: Audit bundle size with `vite build --report` once, identify the heaviest dependencies, lazy-load route-level components if any are surprisingly heavy.



**Priority**: low until users report slow page loads or analytics show high bounce rate on cold loads.



---



### 3.5 Error Boundaries ✅ SHIPPED



`Sentry.ErrorBoundary` is now wrapping the React tree root in `main.tsx`, with a friendly fallback UI ("Something went wrong. We've logged this."). Existing `ErrorBoundary` component is nested inside as a second layer of defence.



---



### 3.6 XSS Prevention ✅ SHIPPED (30 April 2026)



`Article.tsx` now uses `DOMPurify` with a hardened allowlist before rendering AI-generated content via `dangerouslySetInnerHTML`. Allowed tags: standard semantic HTML. Forbidden attrs: all event handlers, `style`. External `target="_blank"` links forced to `rel="noopener noreferrer"` via DOMPurify hook. Sanitisation memoised by raw HTML so it doesn't re-run per render.



---



### 3.7 Accessibility ⏳ DEFERRED



**Problem**: No formal a11y audit. Likely issues: missing `aria-label`s on icon-only buttons, colour contrast on the brand teal in some contexts, focus management on modals/drawers.



**Recommendation**: Run `axe DevTools` or Lighthouse a11y audit on the main pages. Triage findings. Some are 5-min fixes, some are deeper (e.g. focus traps in drawers).



**Priority**: medium for an AMHSW practice — accessibility matters more here than for many SaaS products. Schedule a 2-3h focused session.



---



### 3.8 Routing Cleanup ✅ SHIPPED (30 April 2026)



`/professional-forms` now redirects to canonical `/practitioner/forms` via `<Navigate replace />`. Internal `<Link>` references updated. Old route preserved as redirect source so existing bookmarks resolve.



---



### 3.9 Header Label Polish ✅ SHIPPED (30 April 2026)



"Admin 365" relabelled to "Admin" in both desktop and mobile dropdowns. Reflects the expanded scope of the admin area (Intake, Compliance, M365 Hub) — not just M365 anymore.



---



### 3.10 Weather Widget Privacy Hardening ✅ SHIPPED (30 April 2026)



`WeatherEncouragement.tsx` now uses a consent-first geolocation cascade. On first visit, no third-party request fires until either the user has previously granted geolocation permission OR they explicitly opt in via the inline "Show local weather" affordance. IP-based fallback only kicks in if geolocation is denied or unavailable. Cache moved from `sessionStorage` to `localStorage` with 1-hour TTL. Intent block at top of file documents the design rationale so future code review doesn't kill the component as "vestigial."



---



### 3.11 AI Counselling FREE Badge — Clinical-Safety Review ⏳ DEFERRED



**Problem**: The "FREE" badge on the AI Counselling feature in the header strip warrants a deliberate clinical-safety review. The platform is built around AMHSW principles (mental health social work) — "free AI counselling" needs to clearly delineate what it is and isn't, both legally and ethically.



**Promising existing work**: `CrisisDisclaimer.tsx` and `useCrisisDetection` hook already exist. They handle crisis-keyword detection and show appropriate resource panels. Worth reviewing whether the current implementation matches AASW guidance and AMHSW scope-of-practice norms.



**Priority**: high importance, sensitive surface area. Schedule a focused 1-2h session with deliberate care.



---



## 4. Shared / Cross-Cutting Improvements



### 4.1 Testing Infrastructure ⏳ DEFERRED



**Problem**: 8 test files exist but coverage is uneven. No CI gate on test pass.



**Recommendation**: incremental expansion — write a test when fixing a bug. Don't aim for 100% coverage. Target the high-risk surfaces: edge functions handling money (Stripe), edge functions sending emails, the auth chain.



**Priority**: low until a regression bites.



---



### 4.2 CI/CD Pipeline 🚧 IN PROGRESS



`.github/workflows/ci.yml` exists. Verify it's actually running on every push and that it gates merges. Consider adding:

- `tsc --noEmit` (type check)

- `npm run build` (catches build-breaking changes)

- Linter on edge functions (`deno check supabase/functions/**/*.ts`)



**Effort**: 30 min if the pipeline already exists and just needs tightening.



---



### 4.3 Documentation 🚧 IN PROGRESS



This file is the audit doc — refreshed 30 April 2026. Other documentation:

- `README.md` — likely stale, worth a refresh pass

- Inline JSDoc on `_shared/` helpers — generally good (added during the audit-chain rollout)

- Architecture diagram — does not exist. Could be valuable for onboarding.



**Recommendation**: don't write docs proactively. Write docs when a contributor has a question that documentation would have answered.



---



### 4.4 Environment Variable Management ✅ SHIPPED (effectively)



Build-time vs runtime secrets boundary is now clear:

- **Hardcoded in code**: Supabase anon key, Sentry DSN (frontend) — both are public client identifiers, intentionally committed

- **Supabase runtime secrets**: `SENTRY_DSN_EDGE`, `RESEND_API_KEY`, `MS_CLIENT_SECRET`, cron-secrets, etc.

- **No** `.env` file in the repo — all server-side secrets live in Supabase's secret store.



The earlier audit recommendation to "use a `.env.example` template" is no longer relevant since there is no `.env` consumed by the build.



---



### 4.5 Monitoring and Observability ✅ SHIPPED (30 April 2026)



See section 2.3 for full detail. Three-leg stack: audit log (causal — what happened), Teams alerts (action items requiring attention), Sentry (errors with stack traces).



**Open question for next session**: should Sentry alerts be wired to the existing Teams ops-alerts channel? Currently deferred — alerts are off, dashboard is a destination not a notification surface. Re-evaluate after one week of organic noise observation.



---



## 5. Session Log



### 30 April 2026 — Gold-standard hardening pass



Eleven items shipped in one focused day. Roughly 6h of paced collaborative work across Lovable + Claude.



**Backend audit chain**:

- B1 cron auth fix — `_shared/cron.ts` allowlist, `requireM365Caller` and `verifyAuth` accept known cron-trigger names without requiring cron-secret

- B1.5 / B-cleanup mini — `triggered_by` field populated everywhere

- B2 CORS allowlist — 29 functions migrated to `_shared/cors.ts`

- B3 send-email audit — Postgres + OpsLog mirroring on every send

- B4 contact-form-submit + compliance audit — orchestrator audit rows added, triggered_by gap fixed

- B5 force-resend escape hatch — admin can override idempotency for legitimate re-send needs



**Frontend hardening**:

- F2 XSS sanitisation in Article.tsx — DOMPurify with hardened allowlist

- F3 duplicate routes consolidated — `/professional-forms` redirects to `/practitioner/forms`

- F6 weather widget privacy — consent-first geolocation cascade

- F8 "Admin 365" → "Admin" label



**Observability**:

- C1 Sentry error tracking — frontend and edge functions, PII-scrubbed, no session replay, ID-only user identification



**Verification approach**: every shipped item was either tested manually (B1 via Supabase test panel, C1 via browser console throw) or verified to fire correctly via real production traffic (B3/B4 confirmed by the contact form submission chain producing four coherent audit rows). No deploy was assumed-good without ground-truth.



**End state**: complete audit chain consistency, hardened CORS, hardened auth across cron and JWT paths, XSS sanitised on AI-generated content, privacy-first weather widget, three-leg observability with PII scrubbing throughout.



---



### Next session priorities (in suggested order)



1. **B7 — Two intake systems research** (1-2h, investigation only). Don't refactor. Understand whether `Book.tsx` + Stripe functions and `contact_forms` are genuinely two systems or one with two facades.

2. **B6 — Security linter triage** (4-8h, dedicated). 38-42 warnings to work through.

3. **F7 — AI Counselling FREE badge clinical-safety review** (1-2h). Sensitive surface — needs care, not speed.

4. **F5 — TypeScript strict mode** (1-2 day sprint). Big-bang. Schedule when there's runway.

5. **C3 — Operations dashboard fourth admin pill** (future feature). Not cleanup; design discussion first.
