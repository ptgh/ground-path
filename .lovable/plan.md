

## Investigation: AI Assistant Two-Pathway System

### Current State

The system has **two separate AI assistants** that are both functioning, but there is a routing/rendering bug:

### The Two Pathways

| Feature | Client AI (`ClientAIAssistant`) | Practitioner AI (`AIAssistant`) |
|---|---|---|
| **Audience** | Public visitors, clients (no login needed) | Logged-in practitioners on `/practitioner/*` routes |
| **Trigger button** | Primary-colored floating button with `MessageCircle` icon | Sage-colored floating button with spiral SVG icon |
| **Edge function** | `client-ai-assistant` | `ai-assistant` |
| **Features** | Country selector (AU/UK/Global), crisis detection, session mode, booking prompts | Conversation history saved to DB, professional quick questions |
| **Tone** | Warm, supportive, client-facing | Collegial, practitioner-focused (AASW, CPD, clinical) |

### The Bug

**`Index.tsx` line 103 renders `<AIAssistant />`** (the practitioner version) directly on the homepage. Meanwhile, `App.tsx` line 185 renders `<AIAssistantRouter />` which correctly shows `<ClientAIAssistant />` on non-practitioner routes. This causes:

- The **wrong** (practitioner) assistant appearing on the homepage, or two overlapping floating buttons
- The client-facing assistant being hidden or conflicting

### Fix Plan

1. **Remove `<AIAssistant />` from `Index.tsx`** (line 103) — delete the import and the component render. The `AIAssistantRouter` in `App.tsx` already handles showing the correct assistant based on route and auth state.

2. **Verify the `AIAssistantRouter` logic** in `App.tsx` is correct:
   - Non-practitioner routes → `ClientAIAssistant` (no login required, client-facing)
   - Practitioner routes + logged in → `AIAssistant` (professional, sage-themed)
   - Practitioner routes + not logged in → nothing (correct)

3. **Ensure colour differentiation is clear**:
   - Client button: uses `sessionColor` which maps to `bg-primary` (site primary green)
   - Practitioner button: uses `bg-sage-600` (distinct sage green)
   - Both already have distinct icons (MessageCircle vs spiral SVG)

This is a one-line fix (removing the duplicate render from Index.tsx) that restores the intended two-pathway system.

