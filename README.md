# Brightloop — Subscription Management & Billing System

Brightloop is a production-grade, full-lifecycle subscription management and automated recurring billing platform built with Node.js, Express, Sequelize (MySQL 8), and dual React + Vite applications.

---

## 🏗️ Architecture & Monorepo Structure

Brightloop is structured as an **npm workspaces** monorepo:

```
Billoop/
├── server/          # Express API server with Sequelize ORM & Node-Cron billing engine
├── ops/             # React + Vite internal operations & admin console (port 5174)
├── portal/          # React + Vite customer self-service billing portal (port 5173)
├── shared/          # Shared constants, CSS design tokens, and password validators
├── package.json     # Workspaces root manifest & unified dev scripts
└── ARCHITECTURE.md  # Architectural specification & decisions
```

---

## ⚡ Key Highlights & Engineering Standards

- **Recurring Billing Engine ("Never Twice, Never Skipped")**:
  - Daily automated sweep (`node-cron`) for active subscriptions due for billing.
  - Row-level database locking (`SELECT ... FOR UPDATE`) in isolated transactions.
  - Hard double-billing immunity via unique composite index on `invoices(subscriptionId, periodStart)`.
  - Automatic catch-up loop handling downtime and period rollover safely.
- **Financial Math Precision**:
  - All monetary values are handled in minor units (integer cents) via `utils/money.js` to eliminate binary floating point errors.
  - Frozen `InvoiceLine` snapshots ensure price/tax edits never retroactively rewrite historical invoices.
- **Security & Authentication**:
  - Short-lived JWT access tokens (15-minute in-memory).
  - Long-lived session refresh tokens (7 days, `httpOnly`, `sameSite`, path-restricted cookies).
  - Cryptographic token family rotation with automatic reuse detection (revokes entire token family if a stolen token is replayed).
  - Brute-force protection on all auth endpoints via `express-rate-limit`.
  - Security headers enforced with `helmet` and strict `cors`.
- **Performance & Monitoring**:
  - `Server-Timing` headers appended to responses for millisecond-level telemetry.
  - Slow request warnings automatically logged for operations exceeding thresholds.

---

## 🚀 Quick Start & Development

### 1. Prerequisites
- **Node.js 20 LTS** or newer
- **npm 10+**
- **Aiven for MySQL 8** (or MySQL 8 instance with SSL support)

### 2. Environment Setup
Create `server/.env` based on `server/.env.example`:

```env
PORT=4000
NODE_ENV=development
DB_URL=mysql://<USER>:<PASSWORD>@<HOST>:<PORT>/brightloop?ssl-mode=REQUIRED
DB_SSL_CA_PATH=./certs/ca.pem
DB_POOL_MAX=8

JWT_ACCESS_SECRET=your-random-64-char-secret-string
PORTAL_URL=http://localhost:5173
OPS_URL=http://localhost:5174

BILLING_CRON="0 1 * * *"
BILLING_AUTO_CONFIRM=true
SEED_ADMIN_EMAIL=admin@brightloop.test
SEED_ADMIN_PASSWORD=Admin@Brightloop2026!
```

### 3. Database Migrations & Seeding
From the project root:

```bash
# Run all Umzug database migrations
npm run migrate

# Seed default administrator, standard GST taxes, and Net-15/30 payment terms
npm run seed
```

### 4. Running the Applications

```bash
# Start backend API (http://localhost:4000)
npm run dev:server

# Start Ops Console (http://localhost:5174)
npm run dev:ops

# Start Customer Portal (http://localhost:5173)
npm run dev:portal
```

---

## 🧪 Testing

Brightloop uses Node.js's native test runner (`node:test`) for ultra-fast, zero-dependency integration testing:

```bash
# Run all server tests (auth, billing engine, MRR metrics, sequence numbers, models)
npm test
```

To test frontend production builds:

```bash
npm run build -w ops
npm run build -w portal
```

---

## 📡 API Surface Summary

| Namespace | Path | Access | Description |
|---|---|---|---|
| **Auth** | `POST /api/auth/register` | Public | Customer account registration |
| **Auth** | `POST /api/auth/login` | Public | Login (returns access token + sets refresh cookie) |
| **Auth** | `POST /api/auth/refresh` | Public | Rotates refresh token & issues new access token |
| **Auth** | `POST /api/auth/logout` | Public | Clears session & revokes refresh token |
| **Auth** | `POST /api/auth/forgot-password` | Public | Sends password reset email |
| **Auth** | `POST /api/auth/reset-password` | Public | Verifies token & updates password |
| **Auth** | `GET /api/auth/me` | Authenticated | Current user profile |
| **Ops Staff** | `GET /api/ops/staff` | Admin | List all staff members |
| **Ops Staff** | `POST /api/ops/staff` | Admin | Invite/create new operator |
| **Ops Staff** | `PATCH /api/ops/staff/:id` | Admin | Update staff name or active status |
| **Ops Staff** | `DELETE /api/ops/staff/:id` | Admin | Soft-deactivate staff member |
| **Ops Billing** | `POST /api/ops/billing/run-now` | Staff/Admin | Manually trigger billing sweep |
| **Ops Dashboard** | `GET /api/ops/dashboard/summary` | Staff/Admin | Real-time MRR, ARR, and KPIs |
| **Ops Reports** | `GET /api/ops/reports/revenue` | Staff/Admin | Historical collections & rail breakdown |
| **Ops Reports** | `GET /api/ops/reports/growth` | Staff/Admin | Net subscription growth report |
| **Ops Reports** | `GET /api/ops/reports/aging` | Staff/Admin | Overdue AR aging risk analysis |
