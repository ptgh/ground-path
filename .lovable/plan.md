

## Plan: Skip Organizer Validation in microsoft-org-connect

**Problem:** The Microsoft Entra tenant can't grant `User.Read.All` admin consent, which blocks the organizer validation step. The token exchange itself works fine.

**Solution:** Remove the Graph API user lookup (lines 112-132) from the edge function. Store the integration record immediately after successful token exchange.

### Changes

**1. Update `supabase/functions/microsoft-org-connect/index.ts`**
- Remove the `GET /v1.0/users/{email}` call (lines 112-132)
- Set `service_identity_reference` to `null` instead of `organizerData.id`
- Remove `organizerData.displayName` from the success response
- Keep everything else (auth check, token exchange, upsert) unchanged

**2. Redeploy `microsoft-org-connect`**

This is a minimal, safe change — one block of code removed, no new dependencies.

