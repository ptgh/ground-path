

## The bug

The `/book` page (`src/pages/Book.tsx`) — which is what users actually land on after selecting a practitioner and signing up — has its own booking flow that **bypasses both the check-in questions and card capture entirely**. It just inserts a `booking_requests` row and shows a toast.

The "good" flow with `PreSessionCheckIn` + `AddCardForm` lives in `NativeBookingPanel.tsx`, but **that component is never rendered anywhere in the app** (orphaned). All the polish work we did on it (auto-resume after auth, awaited card list, capture dialog) was on a component nobody sees.

That's why your test signup got no questions and no card prompt.

## The fix — wire the real flow into `/book`

Bring the check-in + card capture flow into `Book.tsx` so it runs for every booking on the public page.

### Flow after fix

```
User picks practitioner → date → slot
   ↓
Click "Request Booking"
   ↓
Not signed in?  →  /auth?redirect=/book&intent=book   (return here)
   ↓ (signed in, or returned from auth)
PreSessionCheckIn modal opens (4 steps: mood, tags, outcome, notes)
   ↓
Check if user has a card on file (await list-payment-methods)
   ↓
No card?  →  AddCardForm dialog ("Save a card to confirm booking")
   ↓
Insert booking_requests + booking_checkins rows
   ↓
Notify practitioner + client confirmation email
   ↓
Toast: "Booking request submitted"
```

### Changes

**`src/pages/Book.tsx`** — the only file that really needs surgery:
- Import `PreSessionCheckIn`, `AddCardForm`, `useSavedCards`, `useNavigate`.
- Add state: `checkInOpen`, `cardCaptureOpen`, `pendingCheckIn`.
- Split `handleBook` into two functions:
  - `handleRequestBooking()` — gates auth (redirect to `/auth?redirect=/book&intent=book`), then opens check-in.
  - `handleCheckInComplete(data)` — awaits card list, opens card capture if none, otherwise calls `submitBooking`.
  - `handleCardCaptured()` — submits the pending booking after card is saved.
  - `submitBooking(checkInData)` — does the existing insert + also writes `booking_checkins` row + sends both notification emails.
- Auto-open check-in on mount when `?intent=book` is present and a slot is selected (post-auth return).
- Render the two dialogs (`PreSessionCheckIn`, card capture `Dialog`) at the bottom of the page.

**Cleanup**: delete (or mark deprecated) `src/components/booking/NativeBookingPanel.tsx` since its logic now lives in `Book.tsx`. I'll delete it to avoid future confusion.

**No DB / RLS / edge function changes.** The `booking_checkins` table, `list-payment-methods` function, and `booking-notification` function already exist and work — they just weren't being called from the page users actually use.

### Edge cases handled

- **Slow card list on first signup**: explicit `await supabase.functions.invoke('list-payment-methods')` if `useSavedCards` is still loading, so we never skip capture for a new user.
- **Post-auth return**: `?intent=book` triggers check-in auto-open once a slot is re-selected (slot selection is local state and resets on auth navigation, so the user will pick again — acceptable for v1).
- **User abandons check-in or card**: booking is NOT created until both complete. No orphan rows.
- **User cancels card capture but already filled check-in**: pending check-in is cleared; nothing is saved.

### Quick post-fix QA you should do

1. Sign out, go to `/book`, pick practitioner → slot → click Request → expect `/auth` redirect with banner.
2. Sign up as a new client → land back on `/book` → check-in modal opens.
3. Complete 4 steps → card capture dialog appears (because new user has no card).
4. Save a test card → booking submitted, toast shown, appears in "Pending" tab.
5. Practitioner receives review-request email.

