# Groundpath Full-Stack Audit & Lovable Improvement Prompts

> **Generated:** April 2026  
> **Stack:** React 18 · TypeScript · Vite · Tailwind CSS · shadcn-ui · Supabase  
> **Scope:** Frontend (React SPA), Backend (Supabase edge functions & DB migrations)

---

## Summary

| Category | Finding Count | Severity |
|---|---|---|
| Security | 5 | 🔴 Critical / High |
| Code Quality | 6 | 🟡 Medium |
| Architecture | 4 | 🟡 Medium |
| UX / Accessibility | 5 | 🟢 Low–Medium |
| Feature Gaps | 4 | 🟢 Low–Medium |

---

## 🔴 Security

### SEC-1 — `.env` File Committed to Version Control

**Finding:** The `.env` file containing the Supabase publishable key and project URL is tracked by git and appears in the repository. The `.gitignore` does not exclude `.env`.

**Risk:** Any developer, CI runner, or third party with read access to the repository can extract these credentials.

**Fix (manual):**
```bash
echo ".env" >> .gitignore
git rm --cached .env
git commit -m "chore: remove .env from version control"
```

**Lovable Prompt:**
```
Add ".env" and ".env.local" to the .gitignore file so that environment variable files containing secrets are never committed to version control. Also add a ".env.example" file at the root of the project that lists every required environment variable with placeholder values (e.g. VITE_SUPABASE_URL=your_supabase_url_here) so developers know what to configure without exposing real secrets.
```

---

### SEC-2 — 20 npm Dependency Vulnerabilities (1 Critical, 9 High)

**Finding:** `npm audit` reports 20 vulnerabilities:
- **Critical:** `jspdf ≤ 4.2.0` — multiple advisories with no assigned CVE numbers:
  - PDF Object Injection via unsanitised input ([GHSA-9vjf-qc39-jprp](https://github.com/advisories/GHSA-9vjf-qc39-jprp))
  - Arbitrary JavaScript Execution via AcroForm injection ([GHSA-pqxr-3g65-p328](https://github.com/advisories/GHSA-pqxr-3g65-p328))
  - Path Traversal / Local File Inclusion ([GHSA-f8cm-6447-x5h2](https://github.com/advisories/GHSA-f8cm-6447-x5h2))
  - Denial of Service via malformed BMP/GIF dimensions ([GHSA-95fx-jjr5-f39c](https://github.com/advisories/GHSA-95fx-jjr5-f39c))
- **High:** `react-router`, `react-router-dom`, `@remix-run/router` — XSS via open redirects
- **High:** `flatted` — ReDoS in `parse()`
- **High:** `glob`, `minimatch`, `picomatch` — command injection / ReDoS
- **High:** `lodash` — prototype pollution / ReDoS
- **High:** `rollup` — source map injection

**Lovable Prompt:**
```
Run "npm audit fix --force" to upgrade vulnerable dependencies to their patched versions. After upgrading, verify that react-router-dom is at version 7.x or later (to fix the open-redirect XSS), jspdf is upgraded to the latest non-vulnerable version, and that lodash, flatted, glob, minimatch, picomatch, and rollup are all at their latest patched versions. Run "npm run build" to confirm the build still succeeds after the upgrades.
```

---

### SEC-3 — TypeScript Strict Mode Disabled

**Finding:** `tsconfig.json` sets `"strict": false`, `"strictNullChecks": false`, and `"noImplicitAny": false`. This means null-pointer dereferences, implicit `any` types, and undefined variable access are never caught at compile time.

**Impact:** 122 explicit `any` casts are already present; null-safety bugs are likely hidden throughout the codebase, including in safety-critical clinical forms.

**Lovable Prompt:**
```
Enable TypeScript strict mode gradually to improve type safety. In tsconfig.json, set "strictNullChecks": true while leaving "noImplicitAny" and "strict" as-is for now. Then fix every TypeScript error that this surfaces — primarily by adding null checks (e.g., "if (!user) return"), using optional chaining (?.), and using the nullish coalescing operator (??). Do not use "as any" or "!" non-null assertions as a workaround. Focus on the hooks (useAuth.ts, useFormDraft.ts) and services (clientService.ts, messagingService.ts) first as these are called by all components.
```

---

### SEC-4 — Manual XSS Sanitisation Instead of DOMPurify

**Finding:** `src/lib/validation.ts` implements hand-written HTML sanitisation using regex replacements. This is fragile — browser rendering engines can execute XSS payloads via vectors that simple regexes miss (e.g., `<svg onload=...>`, base64-encoded `javascript:`, CSS `expression()`).

**Lovable Prompt:**
```
Replace the hand-written sanitizeHtml function in src/lib/validation.ts with DOMPurify for robust XSS prevention. Install DOMPurify: "npm install dompurify @types/dompurify". Then rewrite sanitizeHtml to use "DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })" for plain-text fields, and "DOMPurify.sanitize(input)" where rich text is genuinely needed. Update all callers in validation.ts Zod schemas to use the new implementation. Verify the build passes.
```

---

### SEC-5 — Rate Limiting Stored Only In-Memory

**Finding:** `src/lib/validation.ts` implements a client-side rate limiter using a `Map`. This is trivially bypassed by refreshing the page, opening a new tab, or using incognito mode.

**Lovable Prompt:**
```
Remove the client-side rate-limiting logic from src/lib/validation.ts (the rateLimitStore Map and checkRateLimit function) because it can be bypassed by the client. Instead, enforce rate limits server-side in the Supabase edge functions (ai-assistant, client-ai-assistant, send-email, send-newsletter). In each edge function, check the user's IP and/or Supabase user ID against a rate limit stored in a Supabase table called "rate_limits" with columns: identifier TEXT, request_count INT, window_start TIMESTAMPTZ. If the user exceeds 10 requests per 60 seconds return HTTP 429 with a JSON error body {"error": "Too many requests"}. Create the migration for the rate_limits table in supabase/migrations/.
```

---

## 🟡 Code Quality

### CQ-1 — 125 ESLint Errors & Warnings

**Finding:** `npm run lint` reports **109 errors** and **16 warnings**:
- 95 occurrences of `@typescript-eslint/no-explicit-any` (explicit `any` types)
- 6 `no-empty` empty block statements (silent catch blocks)
- 1 `no-case-declarations` lexical declaration in switch case
- 1 `@typescript-eslint/no-require-imports` (require() in `tailwind.config.ts`)
- 2 `react-hooks/exhaustive-deps` missing hook dependencies

Top offending files: `VoiceCounsellingSession.tsx` (10 errors), `Dashboard.tsx` (9 errors), `ProfessionalProfileModal.tsx` (9 errors), `ClientAIAssistant.tsx` (5 errors).

**Lovable Prompt:**
```
Fix the ESLint errors reported by "npm run lint". Address them in this order:
1. Replace every "any" type in src/components/VoiceCounsellingSession.tsx, src/components/Dashboard.tsx, src/components/ProfessionalProfileModal.tsx, src/components/ClientAIAssistant.tsx, src/components/AIAssistant.tsx, src/components/AuthPage.tsx, src/components/Contact.tsx, src/services/messagingService.ts, and src/services/pdfService.ts with specific TypeScript interfaces or types.
2. Replace every empty catch block (catch {}) with a catch block that at minimum logs the error: catch (error) { console.error('Operation failed:', error); }.
3. Fix the lexical declaration in a case clause error in supabase/functions/send-email/index.ts by wrapping the case body in curly braces.
4. Fix the require() import in tailwind.config.ts by converting it to an ES import or using a dynamic import.
5. Add the missing dependencies to the two useEffect hooks flagged by react-hooks/exhaustive-deps.
After fixing, run "npm run lint" again and confirm there are zero errors.
```

---

### CQ-2 — Debug `console.log` / `console.error` Calls in Production Code

**Finding:** There are 91 `console.log` / `console.error` / `console.warn` calls scattered across production source files. These pollute browser consoles in production and may leak sensitive data (user IDs, session tokens, API responses).

**Lovable Prompt:**
```
Audit the codebase for every console.log, console.error, and console.warn call in src/ (not in node_modules or supabase/). Remove all console.log calls that are purely debug traces (e.g., "fetching profile", "user signed in", "data:", etc.). Keep console.error calls for genuine error logging but prefix the message with the component/function name. For example, change console.error('Error fetching profile:', error) to console.error('[useAuth] fetchProfile error:', error). After the cleanup, add the ESLint rule "no-console": ["warn", { allow: ["error", "warn"] }] to eslint.config.js so future debug logging is caught automatically.
```

---

### CQ-3 — Large Files Need Splitting

**Finding:** Several files exceed 500 lines and are difficult to maintain or review:
- `src/services/pdfService.ts` — 1 232 lines (PDF generation for every clinical form in one file)
- `src/components/ClientAIAssistant.tsx` — 1 014 lines
- `src/components/AIAssistant.tsx` — 641 lines
- `src/components/Dashboard.tsx` — 726 lines
- `src/components/ProfessionalProfileModal.tsx` — 910 lines

**Lovable Prompt:**
```
Refactor src/services/pdfService.ts (1232 lines) by splitting it into one file per clinical form type. Create a folder src/services/pdf/ and inside it create:
- index.ts (re-exports all generate* functions)
- basePdfService.ts (shared helpers: page setup, fonts, header/footer, addWrappedText, etc.)
- phq9Pdf.ts (generatePHQ9Pdf)
- gad7Pdf.ts (generateGAD7Pdf)
- dass21Pdf.ts (generateDASS21Pdf)
- clinicalFormsPdf.ts (all remaining clinical form generators)
Update all imports across the codebase. Run "npm run build" to verify no broken imports.
```

---

### CQ-4 — Missing `useEffect` Cleanup in AI Assistant Components

**Finding:** `AIAssistant.tsx` line 331 and `ClientAIAssistant.tsx` line 576: A ref value is read inside an effect cleanup function. By the time cleanup runs, `chatButtonRef.current` may point to a different DOM node than when the effect was set up, causing memory leaks or incorrect behavior.

**Lovable Prompt:**
```
Fix the React ref cleanup warnings in AIAssistant.tsx and ClientAIAssistant.tsx. In both files, find every useEffect that reads chatButtonRef.current inside its cleanup function. Copy the ref value into a local variable at the top of the effect body, and use that variable in the cleanup. For example:

useEffect(() => {
  const button = chatButtonRef.current; // capture at setup time
  if (!button) return;
  // ... setup code using button ...
  return () => {
    // use captured variable, not chatButtonRef.current
    button.removeEventListener(...);
  };
}, [deps]);
```

---

### CQ-5 — `require()` in `tailwind.config.ts`

**Finding:** `tailwind.config.ts` line 111 uses `require()` (CommonJS style) inside an ESM TypeScript file, causing the ESLint `@typescript-eslint/no-require-imports` error.

**Lovable Prompt:**
```
In tailwind.config.ts, replace the require() call on line 111 with a proper ESM import at the top of the file. For example, if the line reads:
  plugins: [require("tailwindcss-animate")]
change it to:
  import tailwindAnimate from "tailwindcss-animate";
  ...
  plugins: [tailwindAnimate]
And add "import type { Config } from 'tailwindcss';" if not already present. Run "npm run lint" to confirm the error is gone and "npm run build" to verify the build still succeeds.
```

---

### CQ-6 — No Automated Tests

**Finding:** The repository has zero test files (no `.test.ts`, `.test.tsx`, `.spec.ts`, `.spec.tsx` files) and no testing framework configured. Safety-critical flows (suicide risk forms, crisis intervention, authentication) have no automated coverage.

**Lovable Prompt:**
```
Set up Vitest with React Testing Library for unit and component tests. Install the dependencies:
  npm install --save-dev vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event

Add a vitest configuration in vite.config.ts:
  test: { globals: true, environment: 'jsdom', setupFiles: ['./src/test/setup.ts'] }

Create src/test/setup.ts that imports @testing-library/jest-dom.

Add a "test" script to package.json: "test": "vitest run".

Then write the following test files:
1. src/lib/validation.test.ts — unit tests for sanitizeHtml (verify XSS vectors are stripped), contactFormSchema (valid/invalid inputs), and aiChatSchema (prompt injection detection).
2. src/hooks/useAuth.test.ts — test that useAuth returns loading: true initially and then loading: false after a mocked Supabase session.
3. src/components/CrisisDisclaimer.test.tsx — test that the banner renders, that clicking dismiss hides it, and that it stays dismissed on re-render (localStorage).

Run "npm run test" and verify all tests pass.
```

---

## 🟡 Architecture

### ARCH-1 — Error Boundaries Only at Root Level

**Finding:** `main.tsx` wraps the entire app in a single `<ErrorBoundary>`. If any clinical form (PHQ-9, Suicide Risk, Crisis Intervention) throws an unhandled error, the entire page goes blank. Users lose unsaved form data.

**Lovable Prompt:**
```
Add localised error boundaries to the most critical parts of the application so that an error in one section doesn't crash the entire page. Create a reusable FormErrorBoundary component in src/components/FormErrorBoundary.tsx that:
- Catches React render errors in its subtree
- Displays a friendly message: "Something went wrong with this form. Your data may not have been saved. Please refresh the page or contact support."
- Has a "Try again" button that resets the error boundary state
- Logs the error to console.error

Then wrap each clinical form route in App.tsx with <FormErrorBoundary>. Also wrap <Dashboard /> and <ClientAIAssistant /> with their own <FormErrorBoundary> instances so an error in one section doesn't crash the entire authenticated experience.
```

---

### ARCH-2 — No Loading Skeleton Screens

**Finding:** When data is loading (auth, profile, form history, messages), the app shows blank areas or spinners only. There are no skeleton screens to indicate structure.

**Lovable Prompt:**
```
Add skeleton loading screens to improve perceived performance on the three most visible loading states:

1. Dashboard.tsx — while authLoading is true, show a skeleton layout matching the dashboard tabs (a skeleton avatar, three skeleton stat cards, and skeleton tab buttons) using the shadcn-ui Skeleton component.

2. FormHistory.tsx — while form history is loading, show a list of 5 skeleton card rows (each with a skeleton title line and a skeleton date line) instead of a blank area.

3. ClientDashboard.tsx — while the profile loads, show a skeleton for the welcome section and quick-action buttons.

Use the existing Skeleton component from src/components/ui/skeleton.tsx.
```

---

### ARCH-3 — Supabase Edge Functions Use Wildcard CORS

**Finding:** Every edge function (ai-assistant, client-ai-assistant, send-email, message-notification, etc.) sets `'Access-Control-Allow-Origin': '*'`. This means any website can call these functions directly.

**Lovable Prompt:**
```
Restrict CORS on all Supabase edge functions to only allow requests from the production domain and localhost. In supabase/functions/_shared/, create a cors.ts helper:

export const getAllowedOrigins = () => [
  'https://www.groundpath.com.au',
  'https://groundpath.com.au',
  'http://localhost:8080',
  'http://localhost:3000',
];

export const getCorsHeaders = (requestOrigin: string | null) => {
  const allowed = getAllowedOrigins();
  const origin = allowed.includes(requestOrigin ?? '') ? requestOrigin : allowed[0];
  return {
    'Access-Control-Allow-Origin': origin!,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
};

Then update every edge function to import and use getCorsHeaders(req.headers.get('origin')) instead of the hardcoded wildcard corsHeaders object.
```

---

### ARCH-4 — No `.env.example` for New Developers

**Finding:** New developers cloning the repository have no documentation of which environment variables to configure. The actual `.env` file was committed (see SEC-1) but it contains real credentials.

**Lovable Prompt:**
```
Create a .env.example file at the repository root listing every environment variable used by the frontend and by Supabase edge functions, with placeholder values and a one-line comment explaining each one. Include at minimum:

# Frontend (Vite) — prefix with VITE_ to expose to the browser
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Edge functions (set in Supabase dashboard → Settings → Edge Functions)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
LOVABLE_API_KEY=your_lovable_api_key_here
RESEND_API_KEY=your_resend_api_key_here
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here

Also update README.md with a "Getting started" section that tells developers to copy .env.example to .env and fill in the values before running npm run dev.
```

---

## 🟢 UX & Accessibility

### UX-1 — Client Dashboard Lacks Meaningful Content

**Finding:** `src/pages/ClientDashboard.tsx` is a minimal page (80 lines) with only quick-action buttons, an avatar upload, and a message panel. Clients have no visibility of their own wellbeing data, upcoming sessions, or progress.

**Lovable Prompt:**
```
Enhance the client dashboard (src/pages/ClientDashboard.tsx) with three new sections below the existing quick-action buttons:

1. "My Wellbeing" card — a simple mood check-in: show five emoji buttons (😔 😟 😐 🙂 😊) labelled "How are you feeling today?". When the client clicks one, save their mood as a number 1–5 to a new Supabase table called "client_mood_log" (columns: user_id UUID, mood INT, created_at TIMESTAMPTZ). Show the last 7 days of moods as a simple sparkline chart using the recharts LineChart component already in the project.

2. "Resources for You" card — display 3 featured articles from the existing resources data, styled as compact horizontal cards with a title, excerpt, and "Read more" link to /resources.

3. "Upcoming Session" card — show a Book Session button linking to the Halaxy booking page. If no session is booked, encourage the client with a short message: "Ready to connect with your practitioner? Book your next session."
```

---

### UX-2 — No Empty State Illustrations

**Finding:** When lists are empty (no messages, no form history, no notes) the app shows plain text like "No messages yet". Empty states are a missed opportunity for guiding users to take action.

**Lovable Prompt:**
```
Add illustrated empty states to the three main empty list scenarios:

1. In src/components/messaging/ConversationList.tsx — when there are no conversations, show a centred MessageCircle icon (from lucide-react, size 48, text-muted-foreground), the heading "No conversations yet", subtext "Messages from your practitioner will appear here", and a button "Start a conversation" that navigates to the messaging page.

2. In src/components/FormHistory.tsx — when there are no submitted forms, show a FileText icon, heading "No forms submitted yet", subtext "Clinical forms you complete will be saved here for your records".

3. In src/components/Dashboard.tsx notes section — when notes is empty, show a Notebook icon, heading "No notes yet", subtext "Use the + button above to add your first note".

Style each empty state consistently: flex column, items-center, gap-3, py-12, text-muted-foreground.
```

---

### UX-3 — No Accessible Focus Management After Modal Open/Close

**Finding:** Several modals (ProfessionalProfileModal, NoteModal, FormInfoModal) do not restore focus to the trigger button when they are closed. This breaks keyboard navigation and violates WCAG 2.1 guideline 2.4.3 (Focus Order).

**Lovable Prompt:**
```
Improve focus management in all Dialogs throughout the application. In src/components/ProfessionalProfileModal.tsx, src/components/NoteModal.tsx, and src/components/FormViewModal.tsx, ensure that when the dialog opens, focus is moved to the first interactive element inside the dialog (this should happen automatically with the shadcn Dialog since it uses Radix UI, but verify it). More importantly, ensure that when the dialog closes (onOpenChange(false)), focus is returned to the element that triggered the dialog. Implement this by:
1. Creating a ref to the trigger button (e.g., const triggerRef = useRef<HTMLButtonElement>(null))
2. Attaching it to the trigger: <Button ref={triggerRef}>
3. In the onOpenChange handler: if (!open) { setTimeout(() => triggerRef.current?.focus(), 0); }
Apply this pattern consistently to every modal in the application.
```

---

### UX-4 — No Toast Feedback on Form Auto-Save

**Finding:** `useFormDraft.ts` auto-saves form drafts to IndexedDB and Supabase in the background but gives no feedback to the user. If the save fails silently, the user may lose work.

**Lovable Prompt:**
```
Improve the form auto-save UX in src/hooks/useFormDraft.ts:

1. Add a "savedAt" state that stores the last successful save timestamp.
2. Display a subtle "Saved" indicator inside each clinical form that uses useFormDraft. Create a small SavedIndicator component in src/components/SavedIndicator.tsx that shows either:
   - A green CheckCircle2 icon + "Saved" text when savedAt is within the last 3 seconds
   - A subtle Clock icon + "Auto-saving…" text when a save is in progress
   - A red AlertCircle icon + "Save failed — check connection" if the last save threw an error
3. If the Supabase save fails (network error), show a toast with: toast.error("Draft not saved — working offline. Your progress is saved locally.")
4. If the save succeeds after a previous failure, show: toast.success("Draft saved")
Position the SavedIndicator in the top-right corner of the InteractiveFormLayout component.
```

---

### UX-5 — CrisisDisclaimer Stays Dismissed Across Sessions

**Finding:** `CrisisDisclaimer.tsx` stores the dismissal in `localStorage` so the crisis helpline banner never reappears once dismissed — even weeks later. On a mental health platform, critical safety information should be shown periodically.

**Lovable Prompt:**
```
Update CrisisDisclaimer.tsx so that the crisis banner dismissal expires after 24 hours instead of persisting permanently. Instead of storing a boolean "crisis-disclaimer-dismissed" in localStorage, store a timestamp: localStorage.setItem('crisis-disclaimer-dismissed-at', Date.now().toString()). On component mount, read the timestamp and only hide the banner if the stored timestamp is less than 24 hours old (Date.now() - Number(stored) < 86400000). This ensures the helpline numbers are shown at least once per day.
```

---

## 🟢 Feature Gaps

### FEAT-1 — No Offline / PWA Support Beyond Icons

**Finding:** The project has `manifest.json` and PWA icons in `public/`, but there is no service worker registered in `main.tsx`. The app will not work without an internet connection.

**Lovable Prompt:**
```
Add basic offline support using Vite PWA plugin. Install: "npm install --save-dev vite-plugin-pwa workbox-window". In vite.config.ts, add the VitePWA plugin with:
- registerType: 'autoUpdate'
- workbox.globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'] (cache all static assets)
- workbox.runtimeCaching for the Supabase API URL with a NetworkFirst strategy and a 2-minute networkTimeoutSeconds
- manifest settings using the existing manifest.json values (name, icons, theme_color)

In main.tsx, import and register the service worker: import { registerSW } from 'virtual:pwa-register'. Call registerSW({ onNeedRefresh() { toast.info("App update available — click to refresh"); } }).

This will make the app load offline from cache and show a toast when a new version is deployed.
```

---

### FEAT-2 — No In-App Notification System

**Finding:** Practitioners have no way to receive in-app notifications for new messages from clients beyond the unread count badge in the header. There is no push notification support.

**Lovable Prompt:**
```
Add a notification bell and panel to the practitioner Dashboard. 

1. Create a "notifications" table in Supabase via a new migration (supabase/migrations/) with columns: id UUID PRIMARY KEY, user_id UUID REFERENCES auth.users, title TEXT, body TEXT, link TEXT, is_read BOOLEAN DEFAULT false, created_at TIMESTAMPTZ DEFAULT now().

2. Update the message-notification edge function to insert a row into the notifications table whenever a new message arrives for a practitioner, in addition to (or instead of) the email notification.

3. Create a src/hooks/useNotifications.ts hook that subscribes to the notifications table using Supabase realtime, filtered by the current user_id.

4. Add a Bell icon button to the Header.tsx that shows a badge count of unread notifications. Clicking it opens a Popover listing the last 10 notifications with their title, body, created_at (formatted as "2 minutes ago"), and a "Mark all read" button. Clicking a notification marks it as read and navigates to its link.
```

---

### FEAT-3 — No Session Timeout Warning

**Finding:** If a practitioner's Supabase session expires while they are filling out a clinical form, they will be silently redirected to the login page and lose all unsaved data.

**Lovable Prompt:**
```
Add a session timeout warning to prevent practitioners from losing work. In src/hooks/useAuth.ts, subscribe to the Supabase TOKEN_REFRESHED and SIGNED_OUT auth events. When the TOKEN_REFRESHED event fires, check if the new session expires within 5 minutes (session.expires_at * 1000 - Date.now() < 300000). If so, show a toast warning:

toast.warning("Your session expires soon", {
  description: "Click to extend your session and avoid losing unsaved work.",
  duration: 60000,
  action: {
    label: "Extend session",
    onClick: () => supabase.auth.refreshSession(),
  },
});

When the SIGNED_OUT event fires while the user is on a form route (pathname includes /forms/), show a toast error: "Session expired — please sign in again. Use the browser back button after signing in to resume your form."
```

---

### FEAT-4 — PDF Generation Blocking the UI Thread

**Finding:** `pdfService.ts` (1 232 lines) runs synchronously on the main thread. Generating a large clinical form PDF (especially multi-page forms like BDI or Client Intake) can freeze the UI for several seconds, blocking user interaction.

**Lovable Prompt:**
```
Move PDF generation off the main thread using a Web Worker to prevent UI freezing. 

1. Create src/workers/pdfWorker.ts that imports pdfService.ts and exposes a message handler: self.onmessage = async ({ data: { formType, formData } }) => { const pdf = await generatePdf(formType, formData); self.postMessage({ pdf: pdf.output('blob') }); }.

2. Create a src/hooks/usePdfGeneration.ts hook that:
   - Spawns the worker with new Worker(new URL('../workers/pdfWorker.ts', import.meta.url), { type: 'module' })
   - Exposes a generatePdf(formType, formData) function that posts a message to the worker and returns a Promise<Blob>
   - Exposes isGenerating: boolean state
   - Terminates the worker on hook unmount

3. Update all "Download PDF" buttons across the clinical form components to use usePdfGeneration. While isGenerating is true, show a Loader2 spinner on the button and disable it.

This ensures PDF generation never blocks user interaction with the form.
```

---

## Quick-Reference Prompt Index

| # | Title | Priority |
|---|---|---|
| SEC-1 | Add .env to .gitignore | 🔴 Do first |
| SEC-2 | Upgrade vulnerable npm dependencies | 🔴 Do first |
| SEC-3 | Enable TypeScript strictNullChecks | 🔴 High |
| SEC-4 | Replace manual XSS sanitiser with DOMPurify | 🟡 High |
| SEC-5 | Move rate limiting server-side | 🟡 High |
| CQ-1 | Fix 125 ESLint errors | 🟡 Medium |
| CQ-2 | Remove debug console.log calls | 🟡 Medium |
| CQ-3 | Split pdfService.ts into modules | 🟡 Medium |
| CQ-4 | Fix useEffect ref cleanup in AI assistants | 🟡 Medium |
| CQ-5 | Fix require() in tailwind.config.ts | 🟢 Low |
| CQ-6 | Add Vitest + React Testing Library | 🟡 Medium |
| ARCH-1 | Add localised FormErrorBoundary components | 🟡 Medium |
| ARCH-2 | Add skeleton loading screens | 🟢 Low |
| ARCH-3 | Restrict Supabase edge function CORS | 🟡 Medium |
| ARCH-4 | Create .env.example for onboarding | 🟢 Low |
| UX-1 | Enhance client dashboard with wellbeing features | 🟢 Low |
| UX-2 | Add illustrated empty states | 🟢 Low |
| UX-3 | Fix modal focus management for accessibility | 🟢 Low |
| UX-4 | Add form auto-save visual feedback | 🟢 Low |
| UX-5 | Expire crisis banner dismissal after 24 hours | 🟢 Low |
| FEAT-1 | Add offline/PWA support with Vite PWA plugin | 🟢 Low |
| FEAT-2 | Add in-app notification bell for practitioners | 🟢 Low |
| FEAT-3 | Add session timeout warning | 🟡 Medium |
| FEAT-4 | Move PDF generation to Web Worker | 🟢 Low |

---

## Recommended Implementation Order

1. **SEC-1** → Immediately remove `.env` from version control and rotate the Supabase keys as a precaution.
2. **SEC-2** → Upgrade vulnerable dependencies; this may require testing form PDFs after the jsPDF upgrade.
3. **SEC-3** → Enable `strictNullChecks`; fixes here will uncover latent bugs across the codebase.
4. **CQ-1** → Fix ESLint errors; improves IDE experience and catches real bugs.
5. **ARCH-3** → Lock down CORS on edge functions before the app goes to production.
6. **SEC-4** → Swap in DOMPurify for XSS sanitisation.
7. **SEC-5** → Add server-side rate limiting to edge functions.
8. **CQ-6** → Add tests before refactoring large files (CQ-3).
9. **CQ-3** → Refactor pdfService.ts with test coverage in place.
10. Remaining UX / Feature prompts can be implemented in any order.
