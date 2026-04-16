

## Plan: Update Microsoft Client Secret

**What I need to do:**
Update the `MICROSOFT_CLIENT_SECRET` secret in Supabase with your new value from Microsoft Entra.

**Steps:**
1. Update the `MICROSOFT_CLIENT_SECRET` secret in Supabase Edge Function secrets
2. Redeploy the Microsoft-related edge functions so they pick up the new secret

**Functions to redeploy:**
- `microsoft-org-connect`
- `microsoft-org-refresh`
- `microsoft-org-disconnect`
- `create-org-booking-meeting`
- `sync-org-booking-calendar`

**What I need from you:**
Paste the new **Secret Value** (the long string, not the Secret ID) from Microsoft Entra.

