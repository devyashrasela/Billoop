# Brightloop Subscription Management System: Architecture

> Source of truth for the build. Read fully before writing code. If something is ambiguous, follow the **Decisions** section; do not invent alternatives.

---

## 0. Decisions (locked)

| Area | Decision |
|---|---|
| Frontend | React + Vite, **two apps**: `portal` (customers) and `ops` (admin + staff) |
| Router | React Router v6+ |
| State | Redux Toolkit. **RTK Query** for all server data; plain slices only for `auth` and `ui` |
| Styling | Plain CSS. Every component and page has its own co-located `.css`. One global `variables.css` holds all design tokens |
| Backend | Express, ES modules (`"type": "module"`), MVC + service layer |
| Database | MySQL 8 with **Sequelize** ORM |
| Auth | Short-lived JWT access token (in memory) + refresh token (httpOnly cookie) |
| Payments | **Manual recording only** (v1). No online gateway. Schema leaves room to add one later |
| Monorepo | npm workspaces: `server`, `portal`, `ops`, `shared` |
| Performance | Every list/report endpoint responds in **< 2 s** with thousands of subscriptions |

---

## 1. Problem summary

Brightloop Software sells subscription products (monthly/yearly plans, add-ons, product variants). Today everything is in spreadsheets: missed renewals, hand-typed invoices, manual payment matching, quarterly manual reports. The system must run the full lifecycle:

**Products → Plans → Quotation templates → Subscriptions → Auto-generated invoices → Payments → Reports**

Three roles:
- **Admin**: controls everything, only one who can add staff, create discounts, taxes, products, plans.
- **Staff** (internal): day-to-day work with limited access.
- **Customer**: sees only their own subscriptions and invoices via the portal.

---

## 2. Repository layout

```
brightloop/
├── package.json                 npm workspaces root
├── ARCHITECTURE.md
├── SETUP.md
├── shared/
│   ├── styles/base.css          reset + base elements (imported by both apps)
│   ├── validators/password.js   password rule (used by both apps)
│   └── constants/               roles, statuses, billing periods
├── server/
│   ├── package.json             "type": "module"
│   ├── .env.example
│   └── src/
│       ├── app.js               express app (no listen)
│       ├── server.js            listen + start jobs
│       ├── config/              env.js, db.js, mail.js
│       ├── models/              one file per model + index.js (associations)
│       ├── controllers/         thin: parse → service → respond
│       ├── services/            all business logic
│       ├── routes/              index.js, auth, portal/*, ops/*
│       ├── middleware/          authenticate, authorize, validate, errorHandler, rateLimit
│       ├── validators/          Zod (or Joi) request schemas
│       ├── jobs/                billing.job.js, overdue.job.js (node-cron)
│       ├── seeders/             admin user, taxes, payment terms, sample data
│       └── utils/               ApiError, asyncHandler, pagination, numbering, money
├── portal/                      React + Vite (customers)
└── ops/                         React + Vite (admin + staff)
```

---

## 3. Backend architecture

### 3.1 Layering rules
- **Routes** map URL → middleware chain → controller.
- **Controllers** are thin: validate input (via middleware), call one service function, send the response. No business logic, no direct model queries beyond trivial reads.
- **Services** hold all business rules (billing, discounts, tax, state transitions, reports). Services are the only layer that opens transactions.
- **Models** define schema, associations, indexes. No business logic.
- Throw `ApiError(status, message, fieldErrors?)`. One `errorHandler` middleware formats every error as:
  ```json
  { "status": 422, "message": "Validation failed", "fieldErrors": { "email": "Already registered" } }
  ```
- Use `asyncHandler` to wrap async controllers.

### 3.2 Route namespaces
```
/api/auth/*       public + shared auth (register, login, refresh, logout, forgot, reset)
/api/portal/*     role: customer only; data always scoped to the token's customer
/api/ops/*        role: admin | staff; per-route authorize() for admin-only actions
```
Customer scoping rule: **the customer ID always comes from the verified token, never from the request body or URL.**

### 3.3 Auth
- **Register** (portal only): creates a `User(role=customer)` + `Customer` profile in one transaction. Email unique (case-insensitive, store lowercased).
- **Password rule**: length **> 8** (minimum 9), at least one uppercase, one lowercase, one special character. Same rule enforced on server (Zod) and client (`shared/validators/password.js`). Hash with bcrypt (cost 12).
- **Login**: returns `{ accessToken, user }` (access token 15 min) and sets refresh cookie (`httpOnly`, `sameSite`, `secure` in prod, 7 days, path `/api/auth`). Refresh tokens are **rotated** on each use; store hashed in `RefreshToken` table; reuse of a revoked token revokes the whole family.
- **Ops login** rejects `customer` role; **portal login** rejects `admin`/`staff`. (UX split plus server enforcement.)
- **Forgot password**: always respond 200 (do not reveal whether the email exists). Generate a random 32-byte token, store **SHA-256 hash** + expiry (30 min) on the user, email the link (`PORTAL_URL` for customers, `OPS_URL` for staff/admin). Reset invalidates all refresh tokens.
- **Add staff**: `POST /api/ops/staff`, admin only. Admin sets name + email; system generates a one-time password-set link (reuses reset-token mechanism) or admin supplies a temp password that meets the rule.
- Rate-limit `/auth/login`, `/auth/forgot-password`, `/auth/register`.

### 3.4 Permission matrix

| Capability | Admin | Staff | Customer |
|---|---|---|---|
| Products, variants, plans | Create/Edit/Delete | Read | none |
| Taxes, payment terms, discounts | Create/Edit/Delete | Read | none |
| Quotation templates | Full | Read/use | none |
| Add/manage staff | Yes | No | No |
| Customers | Full | Create/Edit | Own profile only |
| Subscriptions | Full | Create/Edit/Transition | Own: view, pause/close/renew if plan allows |
| Invoices | Full | Confirm/Cancel/Send/Print | Own: view/print |
| Payments | Full | Record | Own: view |
| Reports/Dashboard | Full | Read | none |

---

## 4. Data model (Sequelize)

All tables: `id` (BIGINT UNSIGNED auto-increment PK), `createdAt`, `updatedAt`. Money is `DECIMAL(12,2)`; tax rates `DECIMAL(5,2)`. **Never use floats for money.** Use `paranoid` (soft delete) only on Product, Plan, Tax, Discount, Template.

### Identity
| Model | Fields |
|---|---|
| **User** | email (unique, lowercased), passwordHash, role ENUM(admin,staff,customer), name, isActive, resetTokenHash, resetExpiresAt, lastLoginAt |
| **RefreshToken** | userId, tokenHash, familyId, expiresAt, revokedAt |
| **Customer** | userId (unique FK), name, company, phone, addressLine1, addressLine2, city, state, postalCode, country, taxId |

### Catalog
| Model | Fields |
|---|---|
| **Product** | name, type (ENUM: service, software, addon, other), salesPrice, costPrice, notes, isActive |
| **ProductVariant** | productId, attribute (e.g. "Brand"), value (e.g. "Odoo"), extraPrice (e.g. 560.00). Unique (productId, attribute, value) |
| **Plan** | name, price, billingPeriod ENUM(daily,weekly,monthly,yearly), minQty, availableFrom, availableTo, autoClose BOOL, allowEarlyClose BOOL, allowPause BOOL, allowRenew BOOL, isActive |
| **Tax** | name, rate (percent), type ENUM(percentage, fixed), isActive |
| **PaymentTerm** | name (e.g. "Net 15"), dueDays |
| **QuotationTemplate** | name, planId, validityDays, isActive |
| **TemplateLine** | templateId, productId, variantId (nullable), qty, taxId (nullable) |

### Transactions
| Model | Fields |
|---|---|
| **Subscription** | number (unique, e.g. `SUB-2026-000123`), customerId, planId, templateId (nullable), paymentTermId, status ENUM(draft, quotation, confirmed, active, closed), isPaused BOOL, startDate, expiryDate, nextBillingDate, quotationValidUntil, closedAt, closeReason, createdBy |
| **SubscriptionLine** | subscriptionId, productId, variantId (nullable), description, qty, unitPrice, taxId (nullable), amount (qty × unitPrice, pre-tax) |
| **Discount** | name, code (nullable, unique), type ENUM(fixed, percent), value, minPurchase, minQty, startDate, endDate, usageLimit (nullable = unlimited), usedCount (default 0), scope ENUM(product, subscription), isActive |
| **DiscountProduct** | discountId, productId (join table for product-scoped discounts) |
| **SubscriptionDiscount** | subscriptionId, discountId (explicit attachment of a subscription-scoped discount) |
| **Invoice** | number (unique, `INV-2026-000456`), subscriptionId, customerId, periodStart, periodEnd, issueDate, dueDate, status ENUM(draft, confirmed, paid, cancelled), subtotal, discountTotal, taxTotal, total, amountPaid (default 0), sentAt, cancelledAt |
| **InvoiceLine** | invoiceId, productId, variantId, description, qty, unitPrice, discountAmount, taxId, taxRate (snapshot), taxAmount, lineTotal |
| **Payment** | invoiceId, method ENUM(cash, bank_transfer, card, upi, cheque, other), amount, paidOn, note, recordedBy |
| **AuditLog** | actorId, entity, entityId, action, before (JSON), after (JSON), at |
| **Sequence** | key (e.g. `invoice-2026`), lastValue. Used for gap-free numbering inside transactions |

**InvoiceLine is a snapshot.** Copy price, tax rate and description at billing time so later catalog edits never rewrite history.

### Required indexes (performance + correctness)
- `User(email)` unique
- `Subscription(status, nextBillingDate)`, `Subscription(customerId)`, `Subscription(number)` unique
- `Invoice(status, dueDate)`, `Invoice(customerId, status)`, `Invoice(subscriptionId)`, `Invoice(number)` unique
- **`Invoice(subscriptionId, periodStart)` UNIQUE**: the hard guarantee against double billing
- `Payment(invoiceId)`, `Payment(paidOn)`
- `Discount(isActive, startDate, endDate)`, `DiscountProduct(discountId, productId)` unique
- Foreign keys on every `*Id` column

---

## 5. State machines

All transitions live in service functions that reject illegal moves with `ApiError(409)` and write an `AuditLog` entry.

### Subscription
```
Draft → Quotation → Confirmed → Active → Closed
```
- `Draft → Quotation`: lines present, customer + plan set. Sets `quotationValidUntil = today + template.validityDays`.
- `Quotation → Confirmed`: customer/staff accepts; must be before `quotationValidUntil`.
- `Confirmed → Active`: on or after `startDate`; sets `nextBillingDate = startDate`.
- `Active → Closed`:
  - **auto**: if `plan.autoClose` and `expiryDate` reached (daily job);
  - **early**: only if `plan.allowEarlyClose`;
  - **manual by admin** always allowed.
- **Pause** (`isPaused`): only if `plan.allowPause`; paused subscriptions are skipped by billing, and `nextBillingDate` resumes on unpause.
- **Renew**: only if `plan.allowRenew`; extends `expiryDate` by one plan term (or creates a successor subscription; implement as extend-in-place for v1).
- Plan availability: a subscription cannot be created from a plan outside `availableFrom/To`, and `quantity >= plan.minQty` is enforced.

### Invoice
```
Draft → Confirmed → Paid          (Cancelled = side exit from Draft/Confirmed)
```
- `Confirm`: freezes totals, assigns number if not already.
- `Cancel`: allowed on Draft/Confirmed with no payments; does **not** free the billing period (unique index remains, which prevents re-billing the same period by accident). Staff can raise a manual replacement.
- `Paid`: set automatically when `amountPaid >= total`.
- **Overdue is derived, never stored**: `status = confirmed AND amountPaid < total AND dueDate < today`.
- `Send`: emails the invoice (PDF or HTML) to the customer and sets `sentAt`. `Print`: server-rendered printable HTML/PDF view.

---

## 6. Business services

### 6.1 Tax service
- Admin defines taxes. Each subscription line references a tax.
- Per line: `taxAmount = round((lineAmount - lineDiscount) × rate / 100, 2)`. Tax is added on top of price.
- Rounding is done per line, then summed. Centralize in `utils/money.js` (work in integer minor units internally, or use `decimal.js`).

### 6.2 Discount service
- Admin only creates discounts. A discount is **eligible** for an invoice when all hold:
  `isActive` ∧ `startDate ≤ today ≤ endDate` ∧ `usedCount < usageLimit` (or unlimited) ∧ `subtotal ≥ minPurchase` ∧ `qty ≥ minQty` (qty of matching lines).
- **Scope = product**: applies to lines whose product is in `DiscountProduct`. **Scope = subscription**: applies to the whole subtotal for subscriptions it is attached to (`SubscriptionDiscount`).
- `percent` → `base × value / 100`; `fixed` → `min(value, base)`. Discount never exceeds the base.
- If several are eligible, apply in a deterministic order (largest saving first) and cap the total so a line never goes negative. (Stacking is allowed up to the cap; document in code.)
- `usedCount` is incremented **inside the billing transaction** with a conditional update (`UPDATE ... SET usedCount = usedCount + 1 WHERE id = ? AND (usageLimit IS NULL OR usedCount < usageLimit)`); if 0 rows change, skip that discount. This enforces the limit under concurrency.
- Discounts appear on the next invoice automatically and stop when expired or exhausted. No manual step.

### 6.3 Billing engine ("never twice, never skipped")
Triggered by a daily cron (`jobs/billing.job.js`) and by an admin/staff "Run billing" action (`POST /api/ops/billing/run`).

1. Select `Subscription` where `status='active' AND isPaused=false AND nextBillingDate <= today` (uses the `(status, nextBillingDate)` index). Process in **batches** (e.g. 200).
2. For each subscription, **in its own transaction**:
   a. `SELECT ... FOR UPDATE` the subscription row.
   b. Re-check `nextBillingDate <= today` (another worker may have processed it).
   c. Compute `periodStart = nextBillingDate`, `periodEnd` = start + plan period − 1 day.
   d. Build the invoice from lines (snapshot), apply eligible discounts, calculate tax, compute totals, `dueDate = issueDate + paymentTerm.dueDays`.
   e. Insert Invoice + InvoiceLines (status `confirmed` or `draft`, configurable via `BILLING_AUTO_CONFIRM`).
   f. Advance `nextBillingDate` by one period.
   g. If `plan.autoClose` and the next period would pass `expiryDate`, close the subscription.
3. **Catch-up loop**: if `nextBillingDate` is multiple periods behind (downtime), repeat step 2 until it is in the future. Each period gets its own invoice.
4. **Idempotency**: the unique index `(subscriptionId, periodStart)` is the final guard. A duplicate-key error is caught and treated as "already billed", not a failure.
5. One failing subscription must not abort the batch; log the error, continue, and return a summary `{ processed, skipped, failed: [{id, reason}] }`.
6. `jobs/overdue.job.js` (daily): no state change needed because overdue is derived; this job only sends reminder emails (optional v1.1) and auto-closes expired subscriptions.

### 6.4 Payment service
- `POST /api/ops/invoices/:id/payments` with `{ method, amount, paidOn, note }`.
- In a transaction: lock the invoice, validate `status = confirmed`, `amount > 0`, `amount ≤ total − amountPaid`; insert Payment; add to `amountPaid`; if `amountPaid >= total` set `status='paid'`.
- Partial payments are allowed.

### 6.5 Numbering
Use the `Sequence` table with `SELECT ... FOR UPDATE` inside the creating transaction for gap-free, race-safe numbers: `SUB-YYYY-######`, `INV-YYYY-######`.

---

## 7. API surface (v1)

All list endpoints accept `page`, `limit` (max 100), `sort`, plus filters, and return `{ data: [], meta: { page, limit, total, totalPages } }`.

### Auth
`POST /api/auth/register` · `login` · `refresh` · `logout` · `forgot-password` · `reset-password` · `GET /api/auth/me`

### Ops (admin/staff)
```
GET/POST        /api/ops/products          (POST/PUT/DELETE admin)
GET/POST/DELETE /api/ops/products/:id/variants
GET/POST/PUT    /api/ops/plans             (write: admin)
GET/POST/PUT    /api/ops/taxes             (write: admin)
GET/POST/PUT    /api/ops/payment-terms     (write: admin)
GET/POST/PUT    /api/ops/discounts         (write: admin)
GET/POST/PUT    /api/ops/templates
GET/POST/PUT    /api/ops/customers
GET/POST/PUT    /api/ops/subscriptions
POST            /api/ops/subscriptions/from-template/:templateId
POST            /api/ops/subscriptions/:id/transition   { to }
POST            /api/ops/subscriptions/:id/pause | resume | renew | close
GET             /api/ops/invoices          filters: status, customerId, overdue, from, to, q
GET             /api/ops/invoices/:id
POST            /api/ops/invoices/:id/confirm | cancel | send
GET             /api/ops/invoices/:id/print
POST            /api/ops/invoices/:id/payments
GET             /api/ops/payments
POST            /api/ops/billing/run
GET             /api/ops/dashboard/summary
GET             /api/ops/reports/revenue | subscriptions | payments | overdue
GET/POST/PUT    /api/ops/staff             (admin only)
```

### Portal (customer, auto-scoped)
```
GET  /api/portal/me                  PUT /api/portal/me
GET  /api/portal/subscriptions       GET /api/portal/subscriptions/:id
POST /api/portal/subscriptions/:id/pause | close | renew   (only if plan flags allow)
GET  /api/portal/invoices            GET /api/portal/invoices/:id
GET  /api/portal/invoices/:id/print
GET  /api/portal/plans               (available plans, for browsing)
```

---

## 8. Reporting and the 2-second budget

- Dashboard summary is **SQL aggregates** (`COUNT`, `SUM`, `GROUP BY`), never loading rows into Node:
  - Active subscriptions count
  - Revenue collected (sum of payments in range)
  - Outstanding (sum of `total − amountPaid` on confirmed invoices)
  - Overdue invoices (count + amount + top list)
  - MRR (normalize each active subscription's recurring amount to monthly)
- All lists: server-side pagination, filtering, sorting on indexed columns. `limit` capped at 100.
- Use Sequelize `include` deliberately with `attributes` lists to avoid N+1 and over-fetching; use `raw: true` for read-only aggregates.
- Add `Server-Timing`/request logging; log any request > 1 s.
- If aggregates exceed budget at scale, add a `DailySummary` table refreshed by the nightly job. Not needed for v1; design the report service so the swap is local.
- Frontend: RTK Query caching, paginated tables, skeleton loaders, no unbounded lists.

---

## 9. Frontend architecture (both apps)

### 9.1 Folder structure (identical skeleton in `portal/` and `ops/`)
```
src/
├── main.jsx
├── App.jsx                       router + layout
├── app/
│   ├── store.js                  configureStore (api reducer, auth, ui)
│   └── hooks.js                  useAppDispatch, useAppSelector
├── services/
│   ├── baseQuery.js              fetchBaseQuery + Authorization header + 401 refresh/retry with async-mutex
│   ├── api.js                    createApi({ baseQuery, tagTypes, endpoints: () => ({}) })
│   └── endpoints/                injectEndpoints per resource
├── features/
│   ├── auth/authSlice.js         user, role, accessToken (memory only), bootstrapping
│   └── ui/uiSlice.js             toasts, modals, sidebar
├── routes/
│   ├── ProtectedRoute.jsx        role-aware
│   └── index.jsx
├── components/
│   └── Button/Button.jsx + Button.css          (one folder per component)
├── pages/
│   └── Dashboard/Dashboard.jsx + Dashboard.css (one folder per page)
└── styles/
    ├── variables.css             THE global token file
    └── global.css                imports shared/styles/base.css
```

### 9.2 Apps
- **portal**: Register, Login, Forgot/Reset password, My Subscriptions (list/detail, pause/close/renew where allowed), My Invoices (list/detail/print), Profile.
- **ops**: Login, Dashboard, Products (+ variants), Plans, Taxes (admin), Payment Terms (admin), Discounts (admin), Quotation Templates, Customers, Subscriptions (list/detail/builder, status stepper), Invoices (list/detail, confirm/cancel/send/print, record payment), Payments, Reports, Staff (admin only).

### 9.3 Auth in Redux
- `accessToken` and `user` live **in memory only**. No tokens in localStorage/sessionStorage.
- On app load, call `/auth/refresh`; `bootstrapping=true` until it settles so `ProtectedRoute` does not flash the login page.
- `ProtectedRoute` checks `role`: ops admits `admin` and `staff`; portal admits `customer`. Admin-only pages are hidden for staff in the UI, but the **server is the real enforcement**.

### 9.4 RTK Query conventions
- Tags: `Subscription, Invoice, Payment, Product, Plan, Tax, Discount, Template, Customer, Staff, Dashboard`. Use per-item + `LIST` tags.

| Mutation | Invalidates |
|---|---|
| Record payment | Payment LIST, Invoice (id + LIST), Dashboard |
| Confirm/cancel/send invoice | Invoice (id + LIST), Dashboard |
| Subscription transition/pause/renew | Subscription (id + LIST), Dashboard |
| Run billing | Invoice LIST, Subscription LIST, Dashboard |
| Create/edit discount, tax, plan, product | matching LIST |

- List hooks take one args object: `useGetInvoicesQuery({ page, limit, status, customerId, from, to, sort })`.
- `keepUnusedDataFor`: 60 s default; 300 s for catalog data (taxes, plans, products, payment terms).
- Dashboard and invoice lists: `refetchOnMountOrArgChange: 60` (billing cron is invisible to the client).
- Use `skip` for dependent queries (e.g. variants after product chosen). Prefetch detail on row hover.
- Normalize errors via `transformErrorResponse` to `{ status, message, fieldErrors }`. Surface mutation failures as toasts through a listener middleware.
- Pages use generated hooks only; no raw `dispatch` for server data. Keep form state local (`useState`) unless a form spans pages (e.g. quotation builder).

### 9.5 CSS rules (plain CSS)
- **`styles/variables.css`** is the only place for design tokens: colors, spacing scale, font families/sizes, radii, shadows, z-indexes, breakpoints (as comments/documented values; use `@media` literals), transition speeds. No hard-coded colors or spacing elsewhere; always `var(--token)`.
- Each component/page imports its own `.css` next to it. **Prefix every class** with the component name in kebab-case to avoid global collisions: `.btn`, `.btn--primary`, `.btn__icon`; `.invoice-list__row`; `.dash-card`. (BEM-style.)
- No inline styles except for truly dynamic values. No CSS-in-JS, no Tailwind, no CSS modules.
- Support light theme first; tokens are structured so a dark theme can be added by overriding variables under `[data-theme="dark"]`.
- Responsive: mobile-first. Tables scroll horizontally inside a wrapper on small screens.

### 9.6 UX requirements
- Status badges for subscriptions and invoices; a status stepper on subscription detail so "anyone on the team can see where it stands".
- Overdue invoices visibly flagged.
- Every table: pagination, filters, loading skeleton, empty state, error state.
- Forms show field-level errors from `fieldErrors`. Password field shows live rule checklist.
- Accessible: labels, focus states, keyboard navigable modals.

---

## 10. Security checklist
- bcrypt (cost 12); never log passwords or tokens.
- Helmet, CORS allow-list (`PORTAL_URL`, `OPS_URL`), `credentials: true`.
- Request validation on every endpoint (Zod); reject unknown fields.
- Sequelize parameterized queries only; no raw string-built SQL.
- Rate limiting on auth routes.
- Reset and refresh tokens stored hashed.
- Customers can only access rows where `customerId` = their own; return 404 (not 403) for others' records.
- Audit log for: status transitions, payments, discount/tax/plan edits, staff creation.

---

## 11. Environment variables

`server/.env`
```
NODE_ENV=development
PORT=4000
DB_HOST=localhost
DB_PORT=3306
DB_NAME=brightloop
DB_USER=root
DB_PASSWORD=
JWT_ACCESS_SECRET=change-me
JWT_ACCESS_TTL=15m
REFRESH_TTL_DAYS=7
RESET_TTL_MINUTES=30
PORTAL_URL=http://localhost:5173
OPS_URL=http://localhost:5174
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
MAIL_FROM="Brightloop <no-reply@brightloop.test>"
BILLING_CRON=0 1 * * *
BILLING_AUTO_CONFIRM=true
SEED_ADMIN_EMAIL=admin@brightloop.test
SEED_ADMIN_PASSWORD=Admin@12345
```
`portal/.env` and `ops/.env`: `VITE_API_URL=http://localhost:4000/api`

---

## 12. Build order for the agent

Complete each milestone, run it, and verify before moving on.

1. **Scaffold**: monorepo, workspaces, server boots, both Vite apps boot, `variables.css` in place (see SETUP.md).
2. **Models + DB**: all Sequelize models, associations, indexes, unique constraints; sync/migrate; seeder for admin, taxes, payment terms.
3. **Auth end to end**: register, login, refresh rotation, logout, forgot/reset, `authenticate` + `authorize`, staff creation (admin). Frontend: auth slice, baseQuery with mutex, login/register/reset pages in both apps, `ProtectedRoute`.
4. **Catalog**: products + variants, plans, taxes, payment terms, discounts, templates (API + ops UI).
5. **Customers + subscriptions**: from-template creation, lines, state machine, pause/renew/close, status stepper UI.
6. **Billing engine**: service + cron + manual run + catch-up + idempotency. **Write tests** for double-run, concurrent run, downtime catch-up, discount limit under concurrency.
7. **Invoices**: list/detail, confirm/cancel/send/print, tax and discount display.
8. **Payments**: record, partial payments, auto-Paid, outstanding/overdue views.
9. **Dashboard and reports**: aggregates, filters, summary view; verify < 2 s on a seeded dataset.
10. **Portal**: my subscriptions, my invoices, print, profile, plan actions.
11. **Hardening**: rate limits, audit log, error toasts, empty/loading states, accessibility pass, README.

---

## 13. Acceptance criteria
- A customer can register with a valid password, log in to the portal, and sees **only** their own data.
- Duplicate email registration is rejected; weak passwords are rejected with a clear message.
- Forgot-password sends a working reset link to the registered email.
- Only admin can create staff, discounts, taxes, products and plans (verified at API level, not just UI).
- Running billing twice in a row, or concurrently, creates **no duplicate invoices**; after simulated downtime, all missed periods are billed.
- Eligible discounts appear on the next invoice automatically and stop at expiry or usage limit.
- Taxes are computed automatically from admin-defined rules.
- Recording payments updates invoice status (Confirmed → Paid) and the outstanding/overdue views.
- Dashboard shows active subscriptions, revenue, outstanding, overdue, with filters; all list and report endpoints respond in < 2 s with ≥ 10,000 seeded subscriptions.

---

## 14. Out of scope for v1 (design must not block these)
Online payment gateway (Razorpay/Stripe) · dunning email sequences · multi-currency · proration on mid-period changes · PDF generation beyond a printable HTML view · dark theme.
