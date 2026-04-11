

## Next Steps: Per-Day Hour Customization + Client Notification on Status Change from Dashboard

Based on the current state, the outlined next steps that remain are:

1. **Per-day hour customization** -- let practitioners set different start/end times for each working day
2. **Trigger client status-change notifications from the practitioner dashboard** -- the edge function exists but the `NativeBooking.tsx` status update handler needs to actually call it
3. **CalendarTilePopover client name resolution** -- currently shows "Client session" instead of the actual client name

### Plan

#### 1. Per-day hour customization (Settings view)

**File**: `src/components/dashboard/NativeBooking.tsx`

- Change `AvailabilitySettings` so `startHour` and `endHour` become per-day arrays: `daySettings: { startHour: number; endHour: number }[]` (7 entries, one per day)
- Update the Settings UI: when a working day is toggled on, show start/end selectors for that specific day
- Update `handleSaveSettings` to generate availability slots with per-day hours
- Update DEFAULT_SETTINGS accordingly
- Update hydration from `halaxy_integration` to read the new shape

#### 2. Trigger client notification on confirm/decline

**File**: `src/components/dashboard/NativeBooking.tsx`

- In the existing `handleUpdateBookingStatus` function (or equivalent), after the status update succeeds, invoke the `booking-notification` edge function with `{ type: 'status_change', bookingId, newStatus }`
- The edge function already handles `status_change` -- just need the client-side call

#### 3. Show client name in CalendarTilePopover

**File**: `src/components/booking/CalendarTilePopover.tsx` + `NativeBooking.tsx`

- When fetching bookings in `NativeBooking.tsx`, also fetch client profiles to get display names and attach `client_name` to the booking objects
- Pass client name through to CalendarTilePopover and display it instead of generic "Client session"

### Technical details

- Settings shape change: `{ workingDays: boolean[], daySettings: { startHour: number, endHour: number }[] }` replaces flat `startHour`/`endHour`
- Backward compatible: if old shape detected (flat hours), convert to per-day on load
- No database schema changes needed -- all stored in `halaxy_integration` JSONB and existing `pract