# Lovable Prompts for Groundpath

> Ready-to-use prompts for the [Lovable](https://lovable.dev) AI editor. Each prompt is self-contained and can be pasted directly into the Lovable chat. They are organized by category and priority.
>
> **How to use**: Copy a prompt, paste it into your Lovable project chat, and let Lovable implement the changes. Review the diff before accepting.

---

## Table of Contents

1. [Security Fixes](#1-security-fixes)
2. [Backend Improvements](#2-backend-improvements)
3. [Frontend — Component Refactoring](#3-frontend--component-refactoring)
4. [Frontend — Type Safety](#4-frontend--type-safety)
5. [Frontend — Performance](#5-frontend--performance)
6. [Frontend — Accessibility](#6-frontend--accessibility)
7. [Frontend — UX Improvements](#7-frontend--ux-improvements)
8. [Testing](#8-testing)
9. [Documentation and DevOps](#9-documentation-and-devops)

---

## 1. Security Fixes

### Prompt 1.1 — Restrict CORS on Edge Functions

```
Update ALL Supabase Edge Functions to restrict CORS origins. Currently every function
uses 'Access-Control-Allow-Origin': '*'. Change them to only allow requests from our
production domain.

Replace the CORS headers in every function under supabase/functions/ with:

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://groundpath.com.au',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Make sure to also allow the Lovable preview domain by checking the Origin header and
returning the appropriate domain. Keep the OPTIONS preflight handler working correctly.
Do this for all 10 edge functions.
```

### Prompt 1.2 — Fix Open Redirect Vulnerability

```
In src/components/AuthPage.tsx there is an open redirect vulnerability. The component
reads a ?redirect= query parameter and navigates to it without validation. An attacker
could craft a URL like /practitioner/auth?redirect=https://evil.com to redirect users
after login.

Fix this by:
1. Creating a whitelist of allowed redirect paths (internal paths only, like /dashboard,
   /practitioner/dashboard, /messages, /practitioner/messages, /practitioner/forms)
2. Validating the redirect parameter against this whitelist before navigating
3. If the redirect is not in the whitelist, navigate to the default dashboard instead
4. Make sure the redirect value starts with '/' and does not contain '//' to prevent
   protocol-relative URLs
```

### Prompt 1.3 — Add JWT Auth to Unprotected Edge Functions

```
The following Supabase Edge Functions have NO authentication and can be called by anyone:
- supabase/functions/send-email/index.ts
- supabase/functions/send-newsletter/index.ts
- supabase/functions/generate-articles/index.ts
- supabase/functions/check-links/index.ts

Add JWT authentication to each of these functions. Use the same pattern that
message-notification uses: extract the Authorization header, verify the JWT token
using supabase.auth.getUser(), and return a 401 error if the token is invalid or
missing. Only authenticated users should be able to trigger these functions.
```

### Prompt 1.4 — Sanitize HTML to Prevent XSS

```
Install DOMPurify and use it to sanitize all HTML content that is rendered using
dangerouslySetInnerHTML.

Affected files:
1. src/pages/Article.tsx - article content is rendered as raw HTML
2. src/components/FormHistory.tsx - print styles are set via innerHTML

For Article.tsx, wrap the content with DOMPurify.sanitize() before passing it to
dangerouslySetInnerHTML.

For FormHistory.tsx, replace the innerHTML/appendChild approach with a React-based
solution using a style tag rendered within the component.

Install DOMPurify with: npm install dompurify @types/dompurify
```

### Prompt 1.5 — Use Environment Variables for Supabase Client

```
In src/integrations/supabase/client.ts, the Supabase URL and publishable key are
hardcoded as string constants. Refactor this to use Vite environment variables instead:

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

Add validation to throw a clear error if these variables are missing:

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error('Missing Supabase environment variables. Check your .env file.');
}

This removes hardcoded values from the source code.
```

---

## 2. Backend Improvements

### Prompt 2.1 — Add Rate Limiting to AI Assistant

```
Improve the rate limiting in supabase/functions/ai-assistant/index.ts. Currently it
uses a simple in-memory counter per userId. This resets when the function cold-starts.

Improve it by:
1. Storing rate limit data in a Supabase table called 'rate_limits' with columns:
   identifier (text), request_count (integer), window_start (timestamptz)
2. Implementing a sliding window rate limit of 30 requests per 5 minutes per user
3. Returning a 429 Too Many Requests response with a Retry-After header when the
   limit is exceeded
4. Creating the migration for the rate_limits table
5. Apply the same pattern to client-ai-assistant with a limit of 15 requests per
   5 minutes per IP address
```

### Prompt 2.2 — Standardize Edge Function Error Responses

```
Create a shared error response utility in supabase/functions/_shared/errors.ts that
all Edge Functions can use. The utility should:

1. Define standard error codes: UNAUTHORIZED, FORBIDDEN, VALIDATION_ERROR,
   RATE_LIMITED, NOT_FOUND, INTERNAL_ERROR
2. Provide a createErrorResponse function that returns a properly formatted Response:
   { error: { message: string, code: string } } with the correct HTTP status code
3. Provide a createSuccessResponse function: { data: T }
4. Include the CORS headers automatically

Then update all 10 Edge Functions to use this shared utility instead of manually
constructing Response objects. This ensures consistent error format across all endpoints.
```

### Prompt 2.3 — Add Input Validation with Zod to Edge Functions

```
Add Zod input validation to the Edge Functions that accept user input. Install Zod
as a dependency for the Deno edge functions using npm: specifier or import from esm.sh.

Add request body validation to:

1. ai-assistant: Validate { message: string (1-5000 chars), conversationId?: string (uuid) }
2. client-ai-assistant: Validate { message: string (1-2000 chars), country?: string }
3. send-email: Validate { to: string (email), subject: string (1-200), body: string (1-10000) }
4. message-notification: Validate { conversationId: string (uuid), messageText: string }
5. verify-halaxy-url: Validate { url: string (valid URL, must contain halaxy.com) }

Return a 400 Bad Request with the Zod validation error message if validation fails.
Use the shared error response utility if it exists.
```

### Prompt 2.4 — Improve AI Conversation Security

```
In supabase/functions/ai-assistant/index.ts, the function saves conversations to the
database but does not verify that the authenticated user owns the conversation they
are writing to.

Fix this by:
1. When saving a conversation, verify the conversation belongs to the authenticated
   user by checking the user_id column matches the JWT user ID
2. When loading conversation history, filter by user_id
3. Return 403 Forbidden if a user tries to access another user's conversation
4. Add the same check for updating existing conversations
```

---

## 3. Frontend — Component Refactoring

### Prompt 3.1 — Split ClientAIAssistant into Smaller Components

```
The ClientAIAssistant.tsx component is over 1000 lines and needs to be split into
smaller, focused components. Refactor it into:

1. src/hooks/useChatMessages.ts - Custom hook that manages:
   - Message state (messages array)
   - localStorage persistence (save/load)
   - Message sending logic (API call to client-ai-assistant)
   - Loading state

2. src/hooks/useCrisisDetection.ts - Custom hook that:
   - Contains the crisis keyword detection logic
   - Returns whether crisis content was detected
   - Returns the appropriate crisis response

3. src/components/ai/ChatMessageList.tsx - Component that:
   - Receives messages array as a prop
   - Renders the message list with proper styling
   - Auto-scrolls to the latest message
   - Shows typing indicator

4. src/components/ai/ChatInput.tsx - Component that:
   - Handles text input and send button
   - Manages the input state
   - Calls onSend callback

5. Keep ClientAIAssistant.tsx as the orchestrator that combines these pieces.
   It should be under 200 lines after refactoring.

Preserve all existing functionality. Do not change any behavior.
```

### Prompt 3.2 — Extract Shared Form Logic

```
The 20 clinical form components in src/components/forms/ share a lot of duplicated
logic: form setup with react-hook-form, auto-save drafts, PDF export, submit handling,
and layout.

Create a reusable form infrastructure:

1. src/components/forms/FormWrapper.tsx - A wrapper component that provides:
   - Consistent page layout with header, form area, and action buttons
   - Auto-save draft functionality (using the existing useFormDraft hook)
   - PDF export button (using existing pdfService)
   - Submit and clear buttons
   - Client selection modal integration
   - Props: formTitle, formId, children (form fields), onSubmit, validationSchema

2. src/components/forms/fields/LikertScale.tsx - Reusable Likert scale component
   (used by PHQ-9, GAD-7, DASS-21, K10) with:
   - Question text, field name, scale labels
   - Radio button group with proper accessibility

3. src/components/forms/fields/ScoredSection.tsx - Component for scored form sections
   that auto-calculates and displays totals

Apply FormWrapper to PHQ9Form.tsx and GAD7Form.tsx as examples. Keep all other forms
working as they are.
```

### Prompt 3.3 — Refactor Dashboard Component

```
src/components/Dashboard.tsx is 726 lines and combines data fetching, statistics,
client management, and multiple tab panels.

Split it into:

1. src/hooks/useDashboardData.ts - Hook for fetching and managing dashboard data:
   - Profile data, client list, form submissions, messages
   - Loading and error states
   - Refresh functions

2. src/components/dashboard/DashboardStats.tsx - Statistics cards and charts

3. src/components/dashboard/DashboardHeader.tsx - Header with practitioner info
   and quick actions

Keep the existing Dashboard.tsx as a layout component that combines these sub-components.
Preserve all existing tab functionality and data flow.
```

### Prompt 3.4 — Refactor AuthPage Component

```
src/components/AuthPage.tsx is 559 lines with 14+ useState calls. Split it into:

1. src/hooks/useAuthFlow.ts - Custom hook managing the auth state machine:
   - Current step (login, signup, verify, complete)
   - Form values and validation
   - Supabase auth operations (signIn, signUp, resetPassword)
   - Redirect logic (with whitelist validation)

2. src/components/auth/LoginForm.tsx - Login form UI
3. src/components/auth/SignupForm.tsx - Signup form UI with role selection
4. src/components/auth/VerifyEmail.tsx - Email verification step

Keep AuthPage.tsx as the container that renders the correct step.
Preserve all existing auth functionality including practitioner signup flow.
```

---

## 4. Frontend — Type Safety

### Prompt 4.1 — Enable TypeScript Strict Mode

```
Enable TypeScript strict mode in the project. Update tsconfig.app.json to set:

{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}

Then fix all resulting type errors. The main areas that will need fixes are:

1. src/hooks/useAuth.ts - Replace all 'any' types in the Profile interface with
   proper typed interfaces
2. src/services/ - Replace all Record<string, any> with proper form data types
3. src/components/ - Fix all catch (error: any) blocks to use proper error types
4. Replace all 'as any' type assertions with proper types or type guards

Work through the errors systematically. Start with the hooks, then services, then
components. Do not suppress errors with // @ts-ignore.
```

### Prompt 4.2 — Type the useAuth Hook Profile

```
In src/hooks/useAuth.ts, the Profile interface uses 'any' for several fields:
- supervisor_details?: any
- emergency_contact?: any
- halaxy_integration?: any
- linkedin_verified_data?: any
- notification_preferences?: any

Replace these with proper typed interfaces based on the database schema in
src/integrations/supabase/types.ts and the actual usage in components like
Dashboard.tsx and ProfessionalProfileModal.tsx.

Create the interfaces in a new file src/types/profile.ts and export them.
Update useAuth.ts and all components that use these fields.
```

---

## 5. Frontend — Performance

### Prompt 5.1 — Add Route-Level Code Splitting

```
Add route-level code splitting to src/App.tsx using React.lazy and Suspense.
Lazy-load all page components and heavy feature components:

import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('@/components/Dashboard'));
const ProfessionalForms = lazy(() => import('@/pages/ProfessionalForms'));
const Messages = lazy(() => import('@/pages/Messages'));
const ClientDashboard = lazy(() => import('@/pages/ClientDashboard'));
const Resources = lazy(() => import('@/pages/Resources'));
const Article = lazy(() => import('@/pages/Article'));
const VoiceSessionPage = lazy(() => import('@/pages/VoiceSession'));
const AuthPage = lazy(() => import('@/components/AuthPage'));

// Lazy-load all form components too
const PHQ9Form = lazy(() => import('@/components/forms/PHQ9Form'));
// ... etc for all forms

Wrap the Routes in a Suspense with a loading fallback:
<Suspense fallback={<div className="flex items-center justify-center min-h-screen">
  <div className="animate-spin h-8 w-8 border-4 border-sage-500 border-t-transparent rounded-full" />
</div>}>

Make sure default exports exist for all lazy-loaded components.
```

### Prompt 5.2 — Fix Missing Keys and Add Memoization

```
Find and fix all React rendering performance issues:

1. Find all .map() calls that are missing key props and add stable keys. Check:
   - src/components/ClientAIAssistant.tsx (message list, country selector)
   - src/components/forms/ClientSelectionModal.tsx (client list)
   - src/components/messaging/ConversationList.tsx (conversation items)
   - src/components/Dashboard.tsx (client rows, form submissions)

2. Add React.memo to components rendered in lists:
   - src/components/PractitionerCard.tsx
   - src/components/messaging/TypingIndicator.tsx
   - Any component that is rendered inside a .map() and receives stable props

3. Add useMemo to expensive computations:
   - Crisis keyword detection in ClientAIAssistant.tsx
   - Score calculations in form components (PHQ9, GAD7, DASS21)
   - Filtered/sorted lists in Dashboard.tsx

4. Add useCallback to event handlers passed as props to child components.
```

---

## 6. Frontend — Accessibility

### Prompt 6.1 — Add ARIA Labels to Interactive Elements

```
Improve accessibility across the application:

1. Add aria-label to all icon-only buttons:
   - AI assistant toggle button (floating chat button)
   - Close buttons on modals
   - Voice recorder toggle
   - Send message button
   - Navigation menu toggle (mobile)

2. Add aria-live="polite" to dynamic content areas:
   - Message list in MessageThread.tsx
   - AI assistant response area in ClientAIAssistant.tsx and AIAssistant.tsx
   - Toast/notification container
   - Form score displays

3. Add role="alert" to:
   - Crisis disclaimer in CrisisDisclaimer.tsx
   - Form validation error messages
   - Authentication error messages

4. Add aria-labelledby to form sections in clinical forms:
   - Each section heading should have an id
   - The section content should reference it with aria-labelledby

5. Ensure all modals:
   - Trap focus when open
   - Return focus to trigger element when closed
   - Have aria-modal="true" and role="dialog"
   - The shadcn Dialog component should handle most of this, verify it works
```

### Prompt 6.2 — Keyboard Navigation

```
Ensure the application is fully navigable by keyboard:

1. Add a "Skip to main content" link at the top of the page that is visible on focus:
   - Add it in src/components/Header.tsx or src/App.tsx
   - Style: visually hidden until focused, then positioned at top of page
   - Target: a #main-content id on the main content area

2. Ensure the AI assistant chat can be opened and closed with keyboard:
   - Enter/Space to toggle the chat
   - Escape to close
   - Tab to navigate between input and send button

3. Verify tab order is logical in:
   - Clinical forms (fields should tab in reading order)
   - Dashboard tabs
   - Messaging interface (conversation list → message thread → input)

4. Add keyboard shortcuts:
   - Escape to close any open modal
   - Enter to submit forms (already handled by react-hook-form in most cases)
```

---

## 7. Frontend — UX Improvements

### Prompt 7.1 — Add Loading States and Skeletons

```
Add proper loading states throughout the application. Currently many components show
blank screens while data loads.

1. Create a src/components/ui/skeleton-card.tsx component that shows a pulse animation
   placeholder matching the card layout

2. Add skeleton loading states to:
   - Dashboard.tsx: Show skeleton cards while profile/stats load
   - Messages.tsx: Show skeleton conversation list and message area
   - ProfessionalForms.tsx: Show skeleton form cards
   - Resources.tsx: Show skeleton article cards
   - FormHistory.tsx: Show skeleton table rows

3. Use the Suspense fallback for route-level loading

4. Add loading spinners to:
   - Form submit buttons (disable and show spinner during submission)
   - AI assistant send button (show spinner while waiting for response)
   - PDF export button (show progress indicator)
```

### Prompt 7.2 — Improve Error Messages

```
Replace generic error messages with user-friendly, actionable messages:

1. In src/services/messagingService.ts:
   - Instead of throwing raw Supabase errors, wrap them:
     "Unable to load messages. Please check your internet connection and try again."
   - For auth errors: "Your session has expired. Please log in again."

2. In src/components/AuthPage.tsx:
   - Instead of "Invalid login credentials", show:
     "The email or password you entered is incorrect. Please try again or reset
     your password."
   - For rate limiting: "Too many login attempts. Please wait a few minutes and
     try again."

3. In AI assistant components:
   - Instead of "Error in client-ai-assistant function", show:
     "I'm having trouble connecting right now. Please try again in a moment."
   - For rate limiting: "I need a short break. Please try again in a minute."

4. Add a global error handler that shows a user-friendly toast for uncaught errors
   instead of crashing the page.
```

### Prompt 7.3 — Add Form Auto-Save Indicator

```
The form components use the useFormDraft hook for auto-saving drafts, but there is no
visual indicator showing the save status.

Add a small status indicator to the form header area that shows:
- "Draft saved" with a green checkmark when the draft was saved successfully
- "Saving..." with a spinner while saving
- "Unsaved changes" with a yellow dot when there are unsaved changes
- The last saved timestamp in relative format (e.g., "Saved 2 minutes ago")

Add this to the InteractiveFormLayout component so it appears on all forms
automatically. Use the existing useFormDraft hook's state to drive the indicator.
```

---

## 8. Testing

### Prompt 8.1 — Set Up Vitest Testing Infrastructure

```
Set up Vitest as the testing framework for this project:

1. Install dependencies:
   npm install -D vitest @testing-library/react @testing-library/jest-dom
   @testing-library/user-event jsdom

2. Create vitest.config.ts in the project root:
   import { defineConfig } from 'vitest/config';
   import react from '@vitejs/plugin-react-swc';
   import path from 'path';

   export default defineConfig({
     plugins: [react()],
     test: {
       globals: true,
       environment: 'jsdom',
       setupFiles: './src/test/setup.ts',
       css: true,
     },
     resolve: {
       alias: {
         '@': path.resolve(__dirname, './src'),
       },
     },
   });

3. Create src/test/setup.ts:
   import '@testing-library/jest-dom';

4. Add to package.json scripts:
   "test": "vitest",
   "test:run": "vitest run",
   "test:coverage": "vitest run --coverage"

5. Create a sample test file src/lib/validation.test.ts that tests the Zod schemas
   in validation.ts with at least 5 test cases covering valid and invalid inputs.
```

### Prompt 8.2 — Add Auth Guard Tests

```
Create tests for the route guard components. Create the following test files:

1. src/components/__tests__/ProtectedRoute.test.tsx
   - Test that unauthenticated users are redirected to /practitioner/auth
   - Test that authenticated users can access the protected content
   - Test that loading state shows a spinner

2. src/components/__tests__/VerifiedPractitionerRoute.test.tsx
   - Test that unverified practitioners are redirected to /practitioner/verify
   - Test that verified practitioners can access the content
   - Test that non-practitioner users are redirected

3. src/components/__tests__/AuthenticatedRoute.test.tsx
   - Test that unauthenticated users are redirected
   - Test that authenticated users (any role) can access content

Mock the useAuth hook to control the auth state in tests. Mock the react-router-dom
Navigate component to verify redirect behavior.
```

---

## 9. Documentation and DevOps

### Prompt 9.1 — Update README with Project Documentation

```
Replace the current template README.md with comprehensive project documentation:

# Groundpath

A mental health and social work platform connecting practitioners with clients
through clinical assessments, secure messaging, AI-assisted support, and
voice counselling sessions.

Include these sections:

## Features
- List the key features: clinical forms, messaging, AI assistants, voice sessions,
  PDF export, practitioner verification, client management

## Tech Stack
- Frontend: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
- Backend: Supabase (PostgreSQL, Auth, Edge Functions, Real-time)
- AI: OpenAI via Supabase Edge Functions
- Voice: ElevenLabs integration

## Getting Started
- Prerequisites (Node.js 18+, npm)
- Clone and install
- Set up environment variables (reference .env.example)
- Run development server

## Project Structure
- Explain src/ directory layout
- Explain supabase/ directory layout
- List key files and their purpose

## Available Scripts
- npm run dev, build, lint, preview, test

## Architecture
- Two-pathway AI assistant system (client vs practitioner)
- Authentication and authorization flow
- Practitioner verification process

## Clinical Forms
- List all 20 forms with brief descriptions

## Contributing
- Basic contribution guidelines
```

### Prompt 9.2 — Add GitHub Actions CI Pipeline

```
Create a GitHub Actions CI workflow at .github/workflows/ci.yml that runs on every
push and pull request:

name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npx tsc --noEmit
      - run: npm run build
      - run: npm test -- --run (only if tests exist)

This ensures code quality is maintained on every change.
```

### Prompt 9.3 — Create .env.example File

```
Create a .env.example file in the project root with placeholder values for all
required environment variables. This helps new developers set up the project:

# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-key
VITE_SUPABASE_PROJECT_ID=your-project-id

# Halaxy Booking Integration
VITE_HALAXY_EMBED_URL=https://www.halaxy.com/book/widget/your-practitioner-url

# Legacy keys (used by some Supabase tooling)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-key

Add comments explaining each variable and where to find the values.
Also add .env to .gitignore if it is not already there.
```

---

## Prompt Sequencing Guide

For best results, execute prompts in this order:

### Phase 1 — Security (Do First)
1. Prompt 1.5 — Environment variables
2. Prompt 1.2 — Open redirect fix
3. Prompt 1.4 — XSS sanitization
4. Prompt 1.3 — Edge function auth
5. Prompt 1.1 — CORS restriction

### Phase 2 — Foundation
6. Prompt 9.3 — .env.example
7. Prompt 8.1 — Testing setup
8. Prompt 9.2 — CI pipeline

### Phase 3 — Code Quality
9. Prompt 4.2 — Type the Profile interface
10. Prompt 2.2 — Standardize error responses
11. Prompt 2.3 — Edge function validation

### Phase 4 — Refactoring
12. Prompt 3.1 — Split ClientAIAssistant
13. Prompt 3.2 — Extract shared form logic
14. Prompt 3.3 — Refactor Dashboard
15. Prompt 3.4 — Refactor AuthPage

### Phase 5 — Performance and UX
16. Prompt 5.1 — Code splitting
17. Prompt 5.2 — Keys and memoization
18. Prompt 7.1 — Loading states
19. Prompt 7.2 — Error messages

### Phase 6 — Accessibility
20. Prompt 6.1 — ARIA labels
21. Prompt 6.2 — Keyboard navigation

### Phase 7 — Advanced Backend
22. Prompt 2.1 — Rate limiting
23. Prompt 2.4 — Conversation security

### Phase 8 — Polish
24. Prompt 4.1 — TypeScript strict mode
25. Prompt 7.3 — Auto-save indicator
26. Prompt 8.2 — Auth guard tests
27. Prompt 9.1 — README update

---

*Generated for the Groundpath project — https://github.com/ptgh/ground-path*
