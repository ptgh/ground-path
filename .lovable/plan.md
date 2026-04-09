

## Understanding

You want exactly two places to show the blue circle (or uploaded avatar photo):
1. The big profile avatar on the Dashboard page itself
2. The practitioner's profile photo on the main public-facing practitioner card

Every other icon — the **header bar indicator** (MobileAuthIndicator) and the **bottom of the mobile menu** (AuthAwareSection) — must show the **green person icon** (`bg-primary/20` circle with green `User` icon), never the blue dot.

Currently the code in both `MobileAuthIndicator` and `AuthAwareSection` checks `profile?.avatar_url` and shows the avatar image if present. The problem is: when the profile has an avatar URL, it renders the Avatar component with a blue-tinted fallback — and even when it works, it shows the photo instead of the green icon you want in the header.

## Plan

### File: `src/components/Header.tsx`

**1. MobileAuthIndicator trigger (lines 190-201)** — Remove the avatar_url check entirely. Always render the green person icon:
```tsx
<div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20">
  <User className="h-4 w-4 text-primary" />
</div>
```

**2. AuthAwareSection trigger (lines 53-65)** — Same change. Remove the avatar/photo branch, always show the green person icon:
```tsx
<div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20">
  <User className="h-4 w-4 text-primary" />
</div>
```

### What stays the same
- Dashboard.tsx big avatar (line 302-307) — keeps showing the blue/sage avatar with photo or initial fallback
- PractitionerCard — keeps showing the practitioner's uploaded photo
- Dropdown menu content (profile card inside the dropdown) — unchanged
- Role labels,