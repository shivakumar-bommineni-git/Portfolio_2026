# SecurePay — Setup Guide

## Prerequisites
- Node.js 18+
- PostgreSQL 14+

---

## 1. PostgreSQL Setup

```sql
CREATE DATABASE securepay_db;
```

---

## 2. Backend Setup

```bash
cd backend
npm install

# Copy and fill in your values
cp .env.example .env

# Create database tables
npm run db:setup

# Start dev server
npm run dev
```

### Required `.env` values:
| Key | Description |
|-----|-------------|
| `DB_PASSWORD` | Your PostgreSQL password |
| `JWT_ACCESS_SECRET` | Long random string (64+ chars) |
| `JWT_REFRESH_SECRET` | Different long random string |
| `COOKIE_SECRET` | Random cookie signing secret |
| `TWILIO_*` | Leave blank for dev (OTP prints to console) |

---

## 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

---

## Security Features

| Feature | Implementation |
|---------|---------------|
| JWT storage | HttpOnly cookies (immune to XSS) |
| CSRF protection | SameSite=Strict cookies |
| Password hashing | bcrypt (cost factor 12) |
| OTP | Cryptographically secure 6-digit, 5-min expiry, bcrypt-hashed |
| OTP brute-force | Max 3 attempts then invalidated |
| Login brute-force | Account locked 30 min after 5 failures |
| Rate limiting | OTP: 3/10min · Login: 5/15min · Global: 200/15min |
| Token refresh | Rotation on every refresh (old token invalidated) |
| Security headers | Helmet.js (CSP, HSTS, X-Frame-Options, etc.) |
| Input validation | express-validator on all endpoints |
| Request size limit | 10kb max body |

---

## API Endpoints

```
POST /api/auth/send-otp              — Send registration OTP
POST /api/auth/register              — Register with OTP
POST /api/auth/login                 — Login
POST /api/auth/forgot-password/send-otp
POST /api/auth/forgot-password/reset
POST /api/auth/refresh               — Refresh access token
POST /api/auth/logout                — Logout (requires auth)
GET  /api/auth/me                    — Get current user (requires auth)
```

---

## Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use HTTPS (access_token cookie requires `secure: true`)
- [ ] Set real Twilio credentials
- [ ] Use strong, unique JWT secrets
- [ ] Enable PostgreSQL SSL
- [ ] Set up a reverse proxy (nginx)
