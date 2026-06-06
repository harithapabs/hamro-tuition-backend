# Security Implementation

## Currently Active

| Layer | What it does | Status |
|---|---|---|
| **Password hashing** | bcrypt, 10 rounds | Active |
| **JWT auth** | Bearer token, 7-day expiry | Active |
| **httpOnly cookies** | JWT in `ht_token` httpOnly cookie, JS can't read | Active |
| **CSRF protection** | Signed token in non-httpOnly cookie, validated via `X-CSRF-Token` header on writes | Active |
| **Email verification** | Token emailed on register, `/verify-email` route | Active |
| **2FA (email OTP)** | Per-user toggle, 6-digit code emailed, 10 min expiry | Active |
| **Math CAPTCHA** | `GET /api/auth/captcha` — required for signup | Active |
| **Auth middleware** | Validates token + user existence (cookie or Bearer) | Active |
| **Admin middleware** | Role check on `/api/admin/*` | Active |
| **CORS** | Whitelist only `localhost:3000`, `localhost:4173` (configurable) | Active |
| **Helmet** | CSP, X-Frame-Options, HSTS, X-Content-Type-Options, Referrer-Policy, COOP/CORP | Active |
| **Rate limit (auth)** | 10 attempts / 15 min on login/register/password | Active |
| **Rate limit (general)** | 300 requests / 15 min on `/api/*` | Active |
| **Rate limit (payments)** | 20 requests / hour on `/api/payments/*` | Active |
| **Password strength** | Min 8 chars, letters + numbers | Active |
| **Email validation** | Regex check, max 254 chars | Active |
| **Generic auth errors** | Same message for wrong email vs wrong password (no enumeration) | Active |
| **Account block check** | `isBlocked` users rejected on login | Active |
| **Body size limit** | Reduced from 50 MB to 10 MB | Active |
| **JWT secret check** | Requires ≥ 32 chars in production; random fallback in dev | Active |
| **File upload validation** | Type + size check on doubts/profile | Active |
| **Static folder** | `index: false` + `X-Content-Type-Options: nosniff` | Active |
| **Error handler** | No stack traces leaked in production | Active |
| **Sentry** | Optional error monitoring (set `SENTRY_DSN` to enable) | Optional |
| **HTTPS dev** | `start.bat` offers `vite --https` on port 3001 | Optional |

## How the auth flow works now

1. **Register**: `POST /api/auth/register` with name/email/password + captcha answer → user is created, httpOnly cookie set, verification email sent
2. **Verify email**: user clicks link → `GET /api/auth/verify-email?token=...` → `emailVerified = true`
3. **Login**: `POST /api/auth/login` → if user has 2FA enabled, returns `{ requires2FA: true, twoFactorToken }` and emails a 6-digit code. Otherwise sets the auth cookie and returns user data.
4. **2FA verify**: client re-submits login with `twoFactorCode` → cookie set
5. **Every write request** (POST/PUT/PATCH/DELETE) sends `X-CSRF-Token` header (read from `ht_csrf` cookie)
6. **Logout**: `POST /api/auth/logout` → cookie cleared

## Still Recommended for Production

- ❌ Real Sentry DSN (free tier: sentry.io)
- ❌ HTTPS via Cloudflare + Let's Encrypt (auto-issues certs)
- ❌ WAF (Cloudflare free tier = DDoS protection + basic rules)
- ❌ Password reset flow (forgot password → email link)
- ❌ Refresh tokens (currently 7-day long sessions)
- ❌ Audit log of admin actions
- ❌ Move payment screenshots out of DB → S3/Cloudinary with signed URLs
- ❌ Daily DB backups + restore drill
- ❌ `npm audit` in CI

## WAF Setup (Cloudflare free)

1. Sign up at cloudflare.com
2. Add your domain, point nameservers to Cloudflare
3. Enable proxy (orange cloud) on `yourdomain.com` and `api.yourdomain.com`
4. Go to **Security → WAF** → enable "Cloudflare Managed Ruleset" (free)
5. **Security → Bots** → enable Bot Fight Mode
6. **SSL/TLS** → Full (strict)
7. **Speed → Optimization** → enable Brotli, Auto Minify
8. **Caching** → enable, but exclude `/api/*`

## Sentry Setup

1. Sign up at sentry.io (free tier = 5K events/month)
2. Create project → copy DSN
3. Backend: add `SENTRY_DSN=https://...@sentry.io/...` to `backend/.env`
4. Frontend: add `VITE_SENTRY_DSN=...` to `frontend/.env` and import in main.jsx

## Password Reset Flow

- `POST /api/auth/forgot-password { email }` → emails a 1-hour token (hashed in DB)
- `POST /api/auth/reset-password { token, newPassword }` → resets password, revokes all refresh tokens
- Frontend: `/forgot-password` and `/reset-password?token=...` pages
- "Forgot password?" link in login modal

## Refresh Tokens

- 30-day `ht_refresh` httpOnly cookie, sha256-hashed in `refreshTokens` store
- `POST /api/auth/refresh` rotates token (old deleted) so stolen token is single-use
- Frontend auto-calls `/auth/refresh` on 401 and retries the failed request once
- Logout + password reset both revoke all refresh tokens for the user

## Audit Log

- All security events (login, register, password reset) + admin actions (payment approve, etc.) logged
- Stores: action, target, userId, IP, user-agent, timestamp
- Admin view at `/dashboard/admin/audit-logs` with filter by action type
- 100 most recent logs shown (configurable via `?limit=N`)
5. Errors auto-reported

## JWT Revocation

- Every JWT includes a unique jti (random 16-byte hex)
- Revoked tokens stored in evokedTokens NeDB store with expiresAt for auto-cleanup (every hour)
- uth middleware checks: (1) jti not in revocation list, (2) user not in evokeAllForUser list
- Logout adds the JWT's jti to revocation list (decoded from cookie, expires at JWT exp)
- Password reset adds userId to evokeAllForUser ? ALL of that user's JWTs are dead (not just refresh)
- Even if a stolen JWT cookie isn't cleared client-side, the server refuses it

## NoSQL Injection Sanitizer

- Global middleware strips keys starting with $ or _ from eq.body (recursively)
- eq.params values are cast to strings (NeDB ignores string ids matching the regex anyway)
- eq.query non-primitive values are deleted
- Prevents attacks like {"email": {"": null}} that would match any user
- Verify: GET /api/courses/{"":null} returns "Course not found" instead of all courses

## Endpoint-Specific Rate Limits

- /api/auth/captcha: 60/15min (prevents captcha store memory DoS)
- /api/auth/forgot-password + /api/auth/reset-password: 5/15min (prevents email bombing)
- /api/auth/login + /api/auth/register: 10/15min (brute force)
- /api/payments/: 20/hour (payment spam)
- General /api/: 300/15min


## Single Session Per User

- Each user has a currentSessionId field (jti) in their record
- On login/register: new jti is generated and saved ? old session auto-killed
- On refresh: same jti is reused (extends session, doesn't create new one)
- On logout: currentSessionId is cleared (defense in depth)
- On auth: middleware checks decoded.jti === user.currentSessionId ? mismatch returns 401 Session ended
- Login response includes endedOtherSession: true/false in audit log metadata
- Frontend: 401 with session message ? toast "You were logged out because someone signed in from another device"

