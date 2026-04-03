# JWT Auth & CORS — Validation Notes

This document describes how to validate the security changes applied to the four
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

## 3. Valid authenticated token → `200 OK` (or `400`/`500` for business errors)

**Expected:** A request containing a valid Supabase user session JWT is allowed
past the auth gate. Any subsequent error (e.g. missing API key) produces its own
status code but **not** a raw error message that leaks internals.

```bash
# Obtain a valid JWT from your Supabase client session, then:
curl -s -w "\n%{http_code}" \
  -X POST https://<project>.supabase.co/functions/v1/generate-articles \
  -H "Authorization: Bearer <VALID_JWT>" \
  -H "Content-Type: application/json" \
  -d '{}'
# Expected: 200 (or 500 with body {"success":false,"error":"Internal server error"})
```

---

## 4. Blocked origin → no `Access-Control-Allow-Origin` header

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

## 5. Allowed origin → `Access-Control-Allow-Origin` echoed back

**Expected:** A preflight from `https://groundpath.com.au` returns the exact
origin in `Access-Control-Allow-Origin` plus `Vary: Origin`.

```bash
curl -s -I \
  -X OPTIONS https://<project>.supabase.co/functions/v1/check-links \
  -H "Origin: https://groundpath.com.au" \
  -H "Access-Control-Request-Method: POST"
# Expected: Access-Control-Allow-Origin: https://groundpath.com.au
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

| Function            | Production origins                                          | Dev origin          |
| ------------------- | ----------------------------------------------------------- | ------------------- |
| `send-email`        | `https://groundpath.com.au`, `https://www.groundpath.com.au` | `http://localhost:8080` |
| `send-newsletter`   | `https://groundpath.com.au`, `https://www.groundpath.com.au` | `http://localhost:8080` |
| `generate-articles` | `https://groundpath.com.au`, `https://www.groundpath.com.au` | _(none)_            |
| `check-links`       | `https://groundpath.com.au`, `https://www.groundpath.com.au` | _(none)_            |
