

## Native Booking & Calendar System -- v1 Foundation

### Summary
Add a "Booking" tab to the practitioner dashboard with a calendar/availability view, sessions list, and availability settings. UI-first with local state -- no database changes yet. Halaxy flow untouched.

### New file: `src/components/dashboard/NativeBooking.tsx`

Single component with three internal sub-views toggled by buttons:

**1. Calendar (default view)**
- Week view grid showing Mon-Sun with hourly time slots (8am-6pm)
- Placeholder availability blocks shown as sage-colored cells
- "Add Availability" button opens inline form (day picker, start/end time)
- Availability stored in local state with sample data

**2. Sessions**
- List of upcoming sessions (empty state initially)
- Session cards: client name, date/time, duration, status badge (confirmed/pending/completed)
- Empty state with Calendar icon: "No sessions yet"

**3. Availability Settings**
- Working days toggles (Mon-Fri on by default)
- Start/end time selectors
- Session duration dropdown (30/45/50/60 min)
- Buffer time dropdown (0/5/10/15 min)
- Save button shows toast: "Settings saved locally -- database sync coming soon"

**Beta banner** across all views: amber Alert component reading "Early Beta -- This is the foundation of Groundpath's native booking system. Data is not yet persisted."

### Modified file: `src/components/Dashboard.tsx`

1. Import `NativeBooking` component
2. Add "Booking" tab trigger after Overview, visible when `isAdmin || getSessionMode(profile) === 'native_beta'`
3. Add `TabsContent value="booking"` rendering `<NativeBooking />`
4. Update grid-cols count in TabsList to accommodate the new tab
5. Update "Schedule Session" quick action to switch to booking tab when in native_beta mode

### Design approach
- Follows existing dashboard patterns: Card/CardHeader/CardContent, sage color palette, StatCard style, Separator between sections
- Responsive: stacked on mobile, grid on desktop
- All state is local (useState) -- ready to swap for Supabase queries later
- No new routes, no new database tables, no changes to Halaxy embed