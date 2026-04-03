# JWT Auth, Role Checks & CORS — Validation Notes

This document describes how to validate the security changes applied to the
Supabase Edge Functions: `send-email`, `send-newsletter`, `generate-articles`,
and `check-links`.

---

## 1. Missing `Authorization` header → `401 Unauthorized`

**Expected:** Any request with no `Authorization` header returns HTTP 401 with
`{"error":"Unauthorized"}` and does **not** expose internal details.

```bash
curl -s -o /dev/null -w "%{http_code}" \
  -X POST https://<project>.supabase.co/functions/v1/send-email \
  -H "Content-Type: application/json" \
  -d '{"type":"contact_form","to":"test@example.com","data":{}}'
# Expected: 401
```

---

## 2. Invalid / expired token → `401 Unauthorized`

**Expected:** A request with a well-formed but invalid (or expired) Bearer token
returns HTTP 401. The response body must not contain a stack trace.

```bash
curl -s -o /dev/null -w "%{http_code}" \
  -X POST https://<project>.supabase.co/functions/v1/send-newsletter \
  -H "Authorization: Bearer invalidtoken" \
  -H "Content-Type: application/json" \
  -d '{}'
# Expected: 401
```

---

## 3. Valid token but insufficient role → `403 Forbidden`

**Expected:** A request with a valid JWT for an authenticated user who does
**not** hold the required role returns HTTP 403 with `{"error":"Forbidden"}`.
The user is authenticated but not authorized for that function.

```bash
# Sign in as a regular 'user'-role account and obtain their JWT, then:
curl -s -o /dev/null -w "%{http_code}" \
  -X POST https://<project>.supabase.co/functions/v1/generate-articles \
  -H "Authorization: Bearer <VALID_USER_JWT>" \
  -H "Content-Type: application/json" \
  -d '{}'
# Expected: 403  (authenticated, but not admin)

curl -s -o /dev/null -w "%{http_code}" \
  -X POST https://<project>.supabase.co/functions/v1/check-links \
  -H "Authorization: Bearer <VALID_USER_JWT>" \
  -H "Content-Type: application/json" \
  -d '{}'
# Expected: 403  (authenticated, but not admin or internal)
```

---

## 4. Valid token with required role → `200 OK`

**Expected:** A request containing a valid JWT for an admin user is allowed
through both auth and role gates. Any subsequent error (e.g. missing API key)
produces its own status code but **not** a raw error that leaks internals.

```bash
# Obtain a valid JWT from an admin-role Supabase session, then:
curl -s -w "\n%{http_code}" \
  -X POST https://<project>.supabase.co/functions/v1/generate-articles \
  -H "Authorization: Bearer <ADMIN_JWT>" \
  -H "Content-Type: application/json" \
  -d '{}'
# Expected: 200 (or 500 with body {"success":false,"error":"Internal server error"})

# Obtain a valid JWT from an admin or internal-role Supabase session, then:
curl -s -w "\n%{http_code}" \
  -X POST https://<project>.supabase.co/functions/v1/check-links \
  -H "Authorization: Bearer <ADMIN_OR_INTERNAL_JWT>" \
  -H "Content-Type: application/json" \
  -d '{}'
# Expected: 200
```

### Role source

Both `generate-articles` and `check-links` read roles from the
`public.user_roles` table using the Supabase service-role key. This means the
check bypasses RLS and cannot be spoofed by the caller's session JWT.

| Function            | Allowed roles         |
| ------------------- | --------------------- |
| `generate-articles` | `admin`               |
| `check-links`       | `admin`, `internal`   |

To grant a user the required role, insert a row into `user_roles`:

```sql
-- Grant admin role
INSERT INTO public.user_roles (user_id, role)
VALUES ('<user-uuid>', 'admin')
ON CONFLICT DO NOTHING;

-- Grant internal role (for service/tooling accounts)
INSERT INTO public.user_roles (user_id, role)
VALUES ('<user-uuid>', 'internal')
ON CONFLICT DO NOTHING;
```

---

## 5. Blocked origin → no `Access-Control-Allow-Origin` header

**Expected:** A preflight `OPTIONS` request from a disallowed origin (e.g.
`https://evil.example.com`) receives HTTP 200/204 but the response **omits** the
`Access-Control-Allow-Origin` header, so the browser blocks the actual request.

```bash
curl -s -I \
  -X OPTIONS https://<project>.supabase.co/functions/v1/check-links \
  -H "Origin: https://evil.example.com" \
  -H "Access-Control-Request-Method: POST"
# Expected: no `Access-Control-Allow-Origin` header in response
```

---

## 6. Allowed origin → `Access-Control-Allow-Origin` echoed back

**Expected:** A preflight from an allowed origin returns the exact origin in
`Access-Control-Allow-Origin` plus `Vary: Origin`.

```bash
curl -s -I \
  -X OPTIONS https://<project>.supabase.co/functions/v1/check-links \
  -H "Origin: https://groundpath.com.au" \
  -H "Access-Control-Request-Method: POST"
# Expected: Access-Control-Allow-Origin: https://groundpath.com.au
#           Vary: Origin

# Lovable preview origin is also permitted:
curl -s -I \
  -X OPTIONS https://<project>.supabase.co/functions/v1/check-links \
  -H "Origin: https://ground-path.lovable.app" \
  -H "Access-Control-Request-Method: POST"
# Expected: Access-Control-Allow-Origin: https://ground-path.lovable.app
#           Vary: Origin
```

For `send-email` and `send-newsletter`, `http://localhost:8080` is also an
allowed origin (for local development):

```bash
curl -s -I \
  -X OPTIONS https://<project>.supabase.co/functions/v1/send-email \
  -H "Origin: http://localhost:8080" \
  -H "Access-Control-Request-Method: POST"
# Expected: Access-Control-Allow-Origin: http://localhost:8080
```

---

## Allowed origins summary

| Function            | Production origins                                                                                          | Dev origin          |
| ------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------- |
| `send-email`        | `https://groundpath.com.au`, `https://www.groundpath.com.au`, `https://ground-path.lovable.app`            | `http://localhost:8080` |
| `send-newsletter`   | `https://groundpath.com.au`, `https://www.groundpath.com.au`, `https://ground-path.lovable.app`            | `http://localhost:8080` |
| `generate-articles` | `https://groundpath.com.au`, `https://www.groundpath.com.au`, `https://ground-path.lovable.app`            | _(none)_            |
| `check-links`       | `https://groundpath.com.au`, `https://www.groundpath.com.au`, `https://ground-path.lovable.app`            | _(none)_            |

