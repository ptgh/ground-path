# Improvements — Backend and Frontend

> Actionable improvement recommendations for the Groundpath platform, organized by priority. Each item includes what to change, why it matters, and where to start.

---

## Table of Contents

1. [Critical — Fix Immediately](#1-critical--fix-immediately)
2. [Backend Improvements](#2-backend-improvements)
3. [Frontend Improvements](#3-frontend-improvements)
4. [Shared / Cross-Cutting Improvements](#4-shared--cross-cutting-improvements)

---

## 1. Critical — Fix Immediately

### 1.1 Remove `.env` from Version Control

**Problem**: The `.env` file containing Supabase keys is committed to the repository.

**Fix**:
1. Add `.env` to `.gitignore`
2. Remove the file from Git history: `git rm --cached .env`
3. Rotate any exposed credentials in the Supabase dashboard

**File**: `.gitignore`

---

### 1.2 Restrict CORS on All Edge Functions

**Problem**: Every Edge Function uses `Access-Control-Allow-Origin: *`, allowing any website to call them.

**Fix**: Replace `*` with the actual application domains:
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://groundpath.com.au',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
```

**Files**: All 10 functions in `supabase/functions/*/index.ts`

---

### 1.3 Fix Open Redirect in Auth Flow

**Problem**: `AuthPage.tsx` reads a `?redirect=` query parameter and navigates to it without validation.

**Fix**: Validate the redirect URL against a whitelist of allowed paths:
```typescript
const ALLOWED_REDIRECTS = ['/dashboard', '/practitioner/dashboard', '/messages', '/practitioner/messages'];
const redirectParam = new URLSearchParams(location.search).get('redirect');
if (redirectParam && ALLOWED_REDIRECTS.includes(redirectParam)) {
  navigate(redirectParam, { replace: true });
}
```

**File**: `src/components/AuthPage.tsx`

---

### 1.4 Add Auth to Unprotected Edge Functions

**Problem**: `send-email`, `send-newsletter`, `generate-articles`, and `check-links` have no authentication, meaning anyone can trigger emails or generate content.

**Fix**: Add JWT verification following the pattern used in `message-notification`:
```typescript
const authHeader = req.headers.get('Authorization');
if (!authHeader) {
  return new Response(JSON.stringify({ error: 'Missing authorization' }), { status: 401 });
}
const { data: { user }, error } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''));
if (error || !user) {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
}
```

**Files**: `supabase/functions/send-email/index.ts`, `send-newsletter/index.ts`, `generate-articles/index.ts`, `check-links/index.ts`

---

## 2. Backend Improvements

### 2.1 Input Validation and Sanitization

**Problem**: Edge functions have basic input validation. The AI assistant functions do minimal prompt-injection detection.

**Improvements**:
- Add Zod validation for all Edge Function request bodies
- Sanitize HTML content before storing articles (`generate-articles`)
- Validate email addresses in `send-email` and `send-newsletter`
- Add maximum payload size limits

**Files**: All `supabase/functions/*/index.ts`

---

### 2.2 Rate Limiting

**Problem**: Only `client-ai-assistant` has rate limiting (15 req/60s per IP), and it is easy to bypass.

**Improvements**:
- Add rate limiting to all public endpoints
- Use a combination of IP + user fingerprinting
- Implement sliding window rate limiting using Supabase tables or Redis
- Add exponential backoff for repeated failures

**Files**: `supabase/functions/client-ai-assistant/index.ts`, `ai-assistant/index.ts`

---

### 2.3 Error Handling and Logging

**Problem**: Edge functions catch errors but return generic messages. No structured logging exists.

**Improvements**:
- Create a shared error-handling utility in `supabase/functions/_shared/`
- Return consistent error response format: `{ error: string, code: string, details?: string }`
- Add structured logging with request IDs for traceability
- Log security events (failed auth, rate limit hits, suspicious inputs)

**Files**: `supabase/functions/_shared/`, all function `index.ts` files

---

### 2.4 Database Row Level Security

**Problem**: RLS policies are not clearly documented or verifiable from the codebase.

**Improvements**:
- Audit every table for RLS policies in the Supabase dashboard
- Ensure `client_messages` restricts access to conversation participants only
- Ensure `form_submissions` restricts access to the practitioner who created them
- Ensure `profiles` allows users to update only their own profile
- Document all RLS policies in a `DATABASE_SECURITY.md` file

**Files**: `supabase/migrations/`, Supabase Dashboard

---

### 2.5 API Response Consistency

**Problem**: Edge functions return different response formats and HTTP status codes inconsistently.

**Improvements**:
- Standardize response envelope: `{ data: T, error: null } | { data: null, error: { message, code } }`
- Use consistent HTTP status codes (200, 400, 401, 403, 404, 500)
- Add response type definitions shared between frontend and backend

---

### 2.6 Supabase Configuration Hardening

**Problem**: `supabase/config.toml` has a short JWT expiry (600s) but multiple redirect URLs.

**Improvements**:
- Review and trim redirect URL list to only production domains
- Enable `security_captcha` for signup (currently disabled)
- Review `minimum_password_length` (currently 6 — consider increasing to 8+)
- Enable `double_confirm_changes` for profile updates

**File**: `supabase/config.toml`

---

## 3. Frontend Improvements

### 3.1 Component Refactoring

**Problem**: 13+ components exceed 500 lines, with `ClientAIAssistant.tsx` at 1,014 lines.

**Improvements**:

#### ClientAIAssistant.tsx (1,014 lines → 4–5 files)
- Extract `useChatMessages` hook (message state, localStorage persistence)
- Extract `useCrisisDetection` hook (crisis keyword detection logic)
- Extract `ChatMessageList` component (message rendering)
- Extract `ChatInput` component (input, send button, voice recorder toggle)
- Keep `ClientAIAssistant.tsx` as orchestrator (~200 lines)

#### Dashboard.tsx (726 lines → 3–4 files)
- Extract `DashboardStats` component (metrics and charts)
- Extract `ClientList` component (client management table)
- Extract `useDashboardData` hook (data fetching and state)

#### AuthPage.tsx (559 lines → 3 files)
- Extract `LoginForm` component
- Extract `SignupForm` component
- Extract `useAuthFlow` hook (auth state machine)

#### Form Components (20 forms with shared patterns)
- Create a `FormWrapper` higher-order component with shared layout, submit, draft, and PDF logic
- Extract common field patterns (Likert scales, text areas, date pickers) into reusable components
- Reduce form files from 500–700 lines to 150–250 lines each

---

### 3.2 TypeScript Strict Mode

**Problem**: `strict: false` in `tsconfig.app.json` disables most type safety checks.

**Improvements**:
1. Enable strict mode incrementally:
   ```json
   {
     "compilerOptions": {
       "strict": true,
       "noImplicitAny": true,
       "strictNullChecks": true
     }
   }
   ```
2. Fix all resulting type errors (estimated 100–200 errors)
3. Replace all `any` types with proper interfaces
4. Add proper types to the `useAuth` hook Profile interface

**Files**: `tsconfig.app.json`, `tsconfig.json`, throughout `src/`

---

### 3.3 State Management

**Problem**: State is scattered across `useState`, `localStorage`, `sessionStorage`, and Supabase real-time without a clear pattern.

**Improvements**:
- Add React Context for shared app state (auth user, theme, notification preferences)
- Use React Query for all server state (already partially in use)
- Remove direct `localStorage` usage for conversation history — use React Query with a `localStorage` persister instead
- Validate `sessionStorage` data before use (e.g., `pending_signup_user_type`)

---

### 3.4 Performance Optimization

**Problem**: No memoization, missing list keys, large component re-renders.

**Improvements**:
- Add `React.memo` to list-item components rendered via `.map()`
- Add `useMemo` for expensive computations (crisis keyword detection, score calculations)
- Add `useCallback` for event handlers passed as props
- Fix all missing `key` props in `.map()` calls
- Add route-level code splitting with `React.lazy` and `Suspense`

---

### 3.5 Error Boundaries

**Problem**: `ErrorBoundary.tsx` exists but may not wrap all critical routes.

**Improvements**:
- Wrap each major route section in an `ErrorBoundary`
- Add a user-friendly fallback UI for production (currently may show raw errors)
- Log errors to an external service (Sentry, LogRocket) from the error boundary
- Add error boundaries specifically around the messaging and AI assistant features

---

### 3.6 XSS Prevention

**Problem**: `dangerouslySetInnerHTML` is used in `Article.tsx` and `FormHistory.tsx` for rendering content.

**Improvements**:
- Install a sanitization library such as `DOMPurify`
- Sanitize all HTML before rendering with `dangerouslySetInnerHTML`:
  ```typescript
  import DOMPurify from 'dompurify';
  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(formattedContent) }}
  ```
- Replace `innerHTML` usage in `FormHistory.tsx` with React-based rendering

**Files**: `src/pages/Article.tsx`, `src/components/FormHistory.tsx`

---

### 3.7 Accessibility

**Problem**: Minimal ARIA attributes, no keyboard navigation testing, no screen-reader support.

**Improvements**:
- Add `aria-label` to all icon-only buttons (AI assistant toggle, voice recorder, close modals)
- Add `aria-live="polite"` to message lists and notification areas
- Add `role="alert"` to error messages and crisis disclaimers
- Ensure all form fields have associated `<label>` elements
- Add skip-to-content links
- Test with keyboard-only navigation and a screen reader

---

### 3.8 Routing Cleanup

**Problem**: Duplicate routes (`/professional-forms` and `/practitioner/forms` both exist).

**Improvements**:
- Remove deprecated routes or redirect them to canonical paths
- Add a 301 redirect from `/professional-forms` to `/practitioner/forms`
- Document the canonical route structure

**File**: `src/App.tsx`

---

## 4. Shared / Cross-Cutting Improvements

### 4.1 Testing Infrastructure

**Problem**: Zero tests exist. No test runner is configured.

**Improvements**:
1. Install Vitest (integrates with Vite): `npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom`
2. Add `vitest.config.ts`
3. Add test scripts to `package.json`: `"test": "vitest", "test:coverage": "vitest --coverage"`
4. Write tests for priority areas:
   - Zod validation schemas (`src/lib/validation.ts`)
   - Auth hooks (`src/hooks/useAuth.ts`)
   - Service functions (`src/services/`)
   - Route guards (`ProtectedRoute`, `VerifiedPractitionerRoute`)

---

### 4.2 CI/CD Pipeline

**Problem**: No CI/CD pipeline exists (no GitHub Actions, no automated builds or tests).

**Improvements**:
- Add `.github/workflows/ci.yml` with:
  - TypeScript type checking (`npx tsc --noEmit`)
  - ESLint (`npm run lint`)
  - Tests (`npm test`)
  - Build verification (`npm run build`)
  - Dependency vulnerability scanning (`npm audit`)

---

### 4.3 Documentation

**Problem**: README is a Lovable template with no project-specific documentation.

**Improvements**:
- Add project architecture overview to README
- Document the two-pathway AI assistant system
- Document the practitioner verification flow
- Add API documentation for Edge Functions
- Add a contributing guide

---

### 4.4 Environment Variable Management

**Problem**: `.env` is committed with hardcoded values. Supabase client also hardcodes keys.

**Improvements**:
- Add `.env` to `.gitignore`
- Create `.env.example` with placeholder values
- Refactor `src/integrations/supabase/client.ts` to use `import.meta.env` exclusively:
  ```typescript
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  ```

**Files**: `.gitignore`, `.env.example`, `src/integrations/supabase/client.ts`

---

### 4.5 Monitoring and Observability

**Problem**: Only Google Analytics is integrated. No error tracking or performance monitoring.

**Improvements**:
- Integrate an error tracking service (e.g., Sentry)
- Add performance monitoring (Web Vitals reporting)
- Add structured logging in Edge Functions
- Set up alerting for critical errors and security events

---

*Generated for the Groundpath project — https://github.com/ptgh/ground-path*
