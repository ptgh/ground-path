
I know what needs correcting.

1. What went wrong
- The chat card and voice card are not sharing one true modal shell.
- `ClientAIAssistant.tsx` uses `DialogContent`, while `VoiceCounsellingSession.tsx` uses its own custom portal container.
- The last change resized the voice setup card as well, so both cards drifted away from the original AI voice card you wanted to preserve.

2. What I would change
- Use the original AI voice setup card as the source of truth.
- Restore the voice setup modal in `VoiceCounsellingSession.tsx` to the original proportions/spacings from your reference.
- Then update the chat modal in `ClientAIAssistant.tsx` to match that exact outer shell: width, max width, height/max height, radius, border, padding and overflow behavior.
- Leave the live in-call voice screen alone; only the voice setup card should be the reference.

3. Files involved
- `src/components/VoiceCounsellingSession.tsx`
  - adjust only the `voiceState === "setup"` modal wrapper
  - remove the forced sizing that made the original voice card drift
- `src/components/ClientAIAssistant.tsx`
  - replace its independent modal sizing with the same shell as the restored voice card
  - keep the existing chat content/header/actions intact
- `src/components/ui/dialog.tsx`
  - only touch this if the shared Radix dialog defaults are fighting the exact size match

4. Rules I would follow
- No redesign
- Chat changes to match voice, not the other way around
- Preserve current controls and layout inside each card
- Make the outer box identical first, then keep internal