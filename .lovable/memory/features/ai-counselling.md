---
name: AI Counselling
description: Free 24/7 voice counselling via ElevenLabs agents (Sarah/James), with focus topics, session timer, and on-device reflection journal
type: feature
---

Free, private AI voice counselling powered by ElevenLabs (`useConversation`).

Entry points:
- Header nav (public): `Mic` icon + "AI Counselling · Free" with subtle pulsing dot, links to `/voice-session`.
- Footer Quick Links: same treatment.
- HowSessionsWork section: secondary CTA "Try Free AI Counselling" beside the booking CTA.
- Hero: existing "AI Counselling" button scrolls to in-page section.
- ClientAIAssistant chat bubble: existing voice trigger.
- `/voice-session` page auto-opens the chooser on mount.

Setup screen (`VoiceCounsellingSession`):
- Counsellor selector: Sarah (female), James (male).
- Focus topic chips (FOCUS_TOPICS): Just talk / Anxiety / Low mood / Relationships / Work-Study / Grief. Topic prompt is appended to the system context so the agent opens with topic-aware framing.
- Trust strip (Free / Private / 24/7).

Active session:
- Top-left: live mm:ss timer driven by `setInterval`.
- Header shows current focus topic.
- Existing pulse-ring avatar visualisation.

End-session UX:
- If `wasConnectedRef && elapsedSeconds >= 30`, shows reflection screen instead of closing.
- Reflection saved to `localStorage` key `groundpath_ai_reflections` (capped at 25 entries).
- Reflection entry shape: `{ id, date, counsellor, topic, durationSeconds, note }`.
- "Book a human practitioner" CTA navigates to `/book` after saving.
- Crisis line reminder shown on reflection screen (Lifeline 13 11 14, Beyond Blue 1300 22 4636, 000).

Constraints:
- AU only for now (UK/OTHER kept commented for future toggle).
- Plain text only — no markdown in prompts.
- Voice agents speak phone numbers as individual digits (per system prompt).
