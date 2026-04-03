# Full-Stack Audit Instructions

> **Purpose**: Step-by-step instructions for an AI model (or human reviewer) to perform a comprehensive full-stack audit of the Groundpath mental-health and social-work platform.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Pre-Audit Checklist](#2-pre-audit-checklist)
3. [Frontend Audit](#3-frontend-audit)
4. [Backend Audit](#4-backend-audit)
5. [Security Audit](#5-security-audit)
6. [Performance Audit](#6-performance-audit)
7. [Accessibility Audit](#7-accessibility-audit)
8. [Code Quality Audit](#8-code-quality-audit)
9. [Database and Data Layer Audit](#9-database-and-data-layer-audit)
10. [Testing Audit](#10-testing-audit)
11. [Deployment and DevOps Audit](#11-deployment-and-devops-audit)
12. [Reporting Template](#12-reporting-template)

---

## 1. Project Overview

**Groundpath** is a Lovable-generated full-stack web application for mental-health practitioners and clients. Key features include:

- **Practitioner dashboard** with client management, clinical assessment forms (PHQ-9, GAD-7, DASS-21, MSE, Suicide Risk, etc.), and progress notes
- **Client-facing portal** with messaging, AI assistant, voice counselling sessions, and booking integration
- **AI assistants** — two separate pathways: one for practitioners (JWT-protected) and one for public clients (unauthenticated)
- **Real-time messaging** between clients and practitioners via Supabase subscriptions
- **PDF export** for completed clinical forms

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript 5, Vite 5, Tailwind CSS 3, shadcn/ui (Radix UI) |
| State/Data | React Query (TanStack), React Hook Form, Zod |
| Backend | Supabase (PostgreSQL 15, Auth, Edge Functions, Real-time) |
| Edge Functions | Deno runtime (10 serverless functions) |
| Hosting | Lovable / custom static host |

### Repository Structure

```
src/
├── components/        # 56 React components (forms/, messaging/, dashboard/, ui/, booking/)
├── pages/             # 12 page-level components
├── services/          # 7 service modules (messaging, PDF, AI, forms, clients, notes, mailing)
├── hooks/             # 7 custom React hooks (auth, drafts, mailing, typing, unread, mobile, toast)
├── integrations/      # Supabase client and auto-generated DB types
├── lib/               # Utilities and Zod validation schemas
└── assets/            # Static images

supabase/
├── functions/         # 10 Edge Functions (AI, email, newsletter, notifications, verification)
├── migrations/        # SQL schema migrations
└── config.toml        # Supabase project configuration
```

---

## 2. Pre-Audit Checklist

Before starting the audit, confirm the following:

- [ ] Clone the repository and run `npm install`
- [ ] Verify the project builds cleanly with `npm run build`
- [ ] Run the linter with `npm run lint` and note any existing issues
- [ ] Review `.env` for environment variables (note: the file contains Supabase publishable keys)
- [ ] Review `supabase/config.toml` for function access policies and auth settings
- [ ] Review `src/integrations/supabase/types.ts` to understand the database schema
- [ ] Review `src/App.tsx` to understand routing and auth guards

---

## 3. Frontend Audit

### 3.1 Component Architecture

Examine the following areas:

- **Component sizes**: Flag any component exceeding 500 lines. Currently known oversized components:
  - `ClientAIAssistant.tsx` (~1,014 lines)
  - `ProfessionalProfileModal.tsx` (~910 lines)
  - `Dashboard.tsx` (~726 lines)
  - `FormHistory.tsx` (~678 lines)
  - `ClientIntakeForm.tsx` (~687 lines)
  - 8+ additional components over 500 lines
- **Single Responsibility**: Check whether components mix business logic, state management, and presentation
- **Component reuse**: Look for duplicated patterns across form components that could be extracted into shared abstractions

### 3.2 Routing and Navigation

- **File**: `src/App.tsx` (lines 138–192)
- Verify all routes use appropriate auth guards (`ProtectedRoute`, `VerifiedPractitionerRoute`, `AuthenticatedRoute`)
- Check for route duplication (e.g., `/professional-forms` and `/practitioner/forms` point to the same component)
- Verify the `AIAssistantRouter` correctly conditionally renders client vs. practitioner AI assistant

### 3.3 State Management

- **Auth state**: `src/hooks/useAuth.ts` — verify auth lifecycle handling
- Check for prop drilling across component trees
- Look for state stored in `localStorage`/`sessionStorage` that could be manipulated (e.g., `pending_signup_user_type` in `AuthPage.tsx`)
- Count `useState` calls per component — components with 10+ state variables need refactoring

### 3.4 Form Handling

- All 20 clinical forms use `react-hook-form` + `zod`
- Verify validation schemas in `src/lib/validation.ts` match form fields
- Check that form submissions are sanitized before sending to Supabase
- Verify PDF export (`src/services/pdfService.ts`) handles edge cases (empty fields, special characters)

### 3.5 Error Handling

- Check for `ErrorBoundary` usage — there is one at `src/components/ErrorBoundary.tsx`, verify it wraps key routes
- Look for unhandled Promise rejections in async operations
- Verify error messages don't expose sensitive data (database errors, stack traces)

---

## 4. Backend Audit

### 4.1 Edge Functions Inventory

Audit each of the 10 Supabase Edge Functions:

| Function | Path | Expected Auth | CORS |
|----------|------|--------------|------|
| `ai-assistant` | `supabase/functions/ai-assistant/` | JWT required | Restrict to app domain |
| `client-ai-assistant` | `supabase/functions/client-ai-assistant/` | Public (rate-limited) | Restrict to app domain |
| `auth-email-hook` | `supabase/functions/auth-email-hook/` | API key (webhook) | Restrict to Supabase |
| `send-email` | `supabase/functions/send-email/` | JWT required | Restrict to app domain |
| `send-newsletter` | `supabase/functions/send-newsletter/` | JWT required | Restrict to app domain |
| `weekly-newsletter` | `supabase/functions/weekly-newsletter/` | Cron/internal | No external access |
| `message-notification` | `supabase/functions/message-notification/` | JWT required | Restrict to app domain |
| `verify-halaxy-url` | `supabase/functions/verify-halaxy-url/` | Public | Restrict to app domain |
| `check-links` | `supabase/functions/check-links/` | Internal only | No external access |
| `generate-articles` | `supabase/functions/generate-articles/` | Admin only | No external access |

For each function, verify:
- [ ] Authentication is enforced as expected
- [ ] CORS headers restrict origins (not `*`)
- [ ] Input is validated and sanitized
- [ ] Rate limiting is implemented
- [ ] Error responses don't leak server internals
- [ ] External API calls have timeouts and retry logic

### 4.2 Database Operations

- Review all Supabase queries in `src/services/` for:
  - Proper use of Row Level Security (RLS)
  - Query efficiency (avoid N+1 patterns)
  - Data filtering at the database level (not client-side)
- Check `src/integrations/supabase/types.ts` for schema consistency

### 4.3 Authentication Flow

- **File**: `src/components/AuthPage.tsx` — review the full login/signup flow
- Verify email verification is enforced before granting access
- Check practitioner verification workflow (`src/pages/PractitionerVerify.tsx`)
- Review `supabase/config.toml` for JWT expiry, redirect URLs, and refresh token settings

---

## 5. Security Audit

### 5.1 Critical Checks

| Check | Files to Examine | What to Look For |
|-------|-----------------|-----------------|
| **Hardcoded credentials** | `src/integrations/supabase/client.ts`, `.env` | API keys in source code |
| **Open CORS** | All files in `supabase/functions/` | `Access-Control-Allow-Origin: *` |
| **Open redirects** | `src/components/AuthPage.tsx` | Unvalidated `?redirect=` parameter |
| **XSS** | `src/pages/Article.tsx`, `src/components/FormHistory.tsx` | `dangerouslySetInnerHTML`, `innerHTML` |
| **Session fixation** | `src/components/AuthPage.tsx` | `sessionStorage` user type can be manipulated |
| **Missing auth** | `supabase/functions/send-email/`, `generate-articles/` | Endpoints without JWT verification |
| **Sensitive data exposure** | `src/services/`, `src/components/ClientAIAssistant.tsx` | `console.log` with user data, localStorage |

### 5.2 OWASP Top 10 Checklist

- [ ] **A01 Broken Access Control** — Verify RLS policies, auth guards, function-level auth
- [ ] **A02 Cryptographic Failures** — Check for sensitive data in transit/at rest, verify HTTPS
- [ ] **A03 Injection** — Check for SQL injection (Supabase parameterizes queries), XSS via `dangerouslySetInnerHTML`
- [ ] **A04 Insecure Design** — Review two-pathway AI assistant design, session management
- [ ] **A05 Security Misconfiguration** — CORS `*`, disabled TypeScript strict mode, debug logging
- [ ] **A06 Vulnerable Components** — Check `package.json` dependencies for known CVEs
- [ ] **A07 Auth Failures** — Review JWT handling, session persistence, refresh token rotation
- [ ] **A08 Data Integrity** — Verify form data validation, check for unsigned data in transit
- [ ] **A09 Logging & Monitoring** — Check for audit trail, error tracking, security event logging
- [ ] **A10 SSRF** — Check edge functions that make outbound HTTP requests (`check-links`, `verify-halaxy-url`)

### 5.3 Dependency Security

Run `npm audit` and review output. Key areas:
- Check `html2canvas` for known vulnerabilities
- Verify `@supabase/supabase-js` is up-to-date
- Review all Radix UI component versions

---

## 6. Performance Audit

### 6.1 Bundle Size

- Run `npm run build` and check `dist/` output size
- Identify large dependencies: `gsap`, `recharts`, `jspdf`, `html2canvas`
- Check for tree-shaking effectiveness with Vite

### 6.2 React Rendering

- **React.memo**: Check if list item components (e.g., `PractitionerCard`, form option rows) are memoized
- **useMemo/useCallback**: Verify expensive computations and callbacks are memoized
- **Key props**: Look for `.map()` calls without stable `key` props
- **Component splits**: Large components (1,000+ lines) cause full re-renders on any state change

### 6.3 Data Loading

- Check React Query configurations (stale time, cache time, refetch policies)
- Verify pagination is used for large data sets (messages, form submissions, clients)
- Check for waterfall requests (sequential dependent fetches)

### 6.4 Assets

- Verify images are optimized (check `src/assets/` and `public/`)
- Check for lazy loading of route-level components
- Review `index.html` for render-blocking resources

---

## 7. Accessibility Audit

### 7.1 WCAG 2.1 Level AA Checks

- [ ] All interactive elements have visible focus indicators
- [ ] All images have meaningful `alt` text
- [ ] Form inputs have associated `<label>` elements
- [ ] Color contrast meets 4.5:1 ratio for normal text
- [ ] Page content is navigable by keyboard alone
- [ ] ARIA roles and attributes are used correctly
- [ ] Dynamic content changes are announced to screen readers
- [ ] Modal dialogs trap focus correctly

### 7.2 Clinical Forms

Clinical assessment forms (PHQ-9, GAD-7, etc.) require special accessibility attention:
- Radio button groups must have `role="radiogroup"` and `aria-labelledby`
- Score calculations should be announced when updated
- Form validation errors must be linked to fields with `aria-describedby`

### 7.3 Messaging Interface

- Real-time message updates need `aria-live="polite"` regions
- Voice counselling session controls need ARIA labels
- Typing indicators should be announced

---

## 8. Code Quality Audit

### 8.1 TypeScript

- **Strict mode**: Currently disabled in `tsconfig.app.json` — document all `any` type usages
- Search for `as any` type assertions (30+ instances expected)
- Check `Record<string, any>` usage in service files
- Verify `useAuth` hook types (multiple `any` fields in Profile interface)

### 8.2 ESLint

- Run `npm run lint` and document results
- Review `eslint.config.js` for rule coverage
- Check for disabled rules that should be enabled

### 8.3 Code Duplication

- Look for repeated patterns across the 20 form components
- Check for duplicated Supabase query patterns in services
- Identify shared logic that could be extracted into hooks or utilities

### 8.4 Documentation

- Check for JSDoc comments on exported functions
- Verify README accuracy
- Look for outdated or missing documentation

---

## 9. Database and Data Layer Audit

### 9.1 Schema Review

- Review `src/integrations/supabase/types.ts` for the complete schema
- Verify foreign key relationships are properly defined
- Check for missing indexes on frequently queried columns
- Look for columns storing sensitive data without encryption

### 9.2 Row Level Security (RLS)

- Verify RLS policies exist for all tables containing user data
- Check that users can only read/write their own records
- Verify practitioner-specific data is restricted by role
- Test that anonymous users cannot access protected data

### 9.3 Migrations

- Review `supabase/migrations/` for schema evolution
- Check for destructive migrations without data preservation
- Verify migration order and dependencies

---

## 10. Testing Audit

### 10.1 Current State

- **No test infrastructure exists** — no test runner, no test files, no CI test pipeline
- This is a critical gap for a healthcare application

### 10.2 Recommended Coverage

Priority areas for initial test coverage:
1. Authentication flows (login, signup, verification)
2. Authorization guards (ProtectedRoute, VerifiedPractitionerRoute)
3. Clinical form validation (Zod schemas)
4. Service layer functions (messaging, PDF generation)
5. Edge function input validation and auth checks

---

## 11. Deployment and DevOps Audit

### 11.1 Build Pipeline

- Verify `npm run build` succeeds without errors or warnings
- Check for environment-specific build configurations
- Review Vite config for production optimizations

### 11.2 Environment Management

- Verify `.env` is in `.gitignore` (currently it is NOT — the `.env` file is committed)
- Check for sensitive values in committed configuration files
- Review Supabase config for production readiness

### 11.3 Monitoring

- Check for error tracking integration (Sentry, LogRocket, etc.)
- Review Google Analytics setup (`src/components/GoogleAnalytics.tsx`)
- Verify logging in edge functions

---

## 12. Reporting Template

Use this template to document findings:

```markdown
## Audit Finding: [TITLE]

**Severity**: Critical / High / Medium / Low
**Category**: Security / Performance / Accessibility / Code Quality / Testing
**File(s)**: path/to/file.tsx (lines X-Y)

### Description
[What the issue is]

### Evidence
[Code snippet or test result]

### Impact
[What could go wrong]

### Recommendation
[How to fix it]

### Effort Estimate
[Small / Medium / Large]
```

### Summary Scorecard

| Category | Grade | Notes |
|----------|-------|-------|
| Security | ? / A-F | |
| Performance | ? / A-F | |
| Accessibility | ? / A-F | |
| Code Quality | ? / A-F | |
| Testing | ? / A-F | |
| DevOps | ? / A-F | |

---

*Generated for the Groundpath project — https://github.com/ptgh/ground-path*
