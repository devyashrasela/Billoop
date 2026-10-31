# Brightloop: Initial Setup Instructions

> For the coding agent. Follow in order. Read `ARCHITECTURE.md` first; it is the source of truth. This file covers **Milestone 1 (Scaffold)** only: after it, the server, both React apps, and the database connection must run. Do not build features yet.

---

## 0. Prerequisites

- Node.js **20 LTS or newer**, npm 10+
- MySQL **8.x** running locally
- Git

Verify:
```bash
node -v && npm -v && mysql --version
```

Create the database:
```sql
CREATE DATABASE brightloop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

---

## 1. Monorepo root

```bash
mkdir brightloop && cd brightloop
git init
npm init -y
mkdir server portal ops shared
```

Replace root `package.json` with:
```json
{
  "name": "brightloop",
  "private": true,
  "workspaces": ["server", "portal", "ops", "shared"],
  "scripts": {
    "dev:server": "npm run dev -w server",
    "dev:portal": "npm run dev -w portal",
    "dev:ops": "npm run dev -w ops",
    "seed": "npm run seed -w server",
    "test": "npm run test -w server"
  }
}
```

Root `.gitignore`:
```
node_modules
dist
.env
*.log
.DS_Store
```

---

## 2. `shared` workspace

```bash
cd shared
npm init -y
```
Set `"name": "@brightloop/shared"`, `"type": "module"`, `"version": "1.0.0"` in its `package.json`.

Create:
```
shared/
├── styles/base.css
├── validators/password.js
└── constants/index.js
```

`shared/validators/password.js`
```js
// Rule: more than 8 chars (min 9), 1 uppercase, 1 lowercase, 1 special character
export const PASSWORD_RULES = [
  { id: 'length',  label: 'More than 8 characters', test: (p) => p.length > 8 },
  { id: 'upper',   label: 'One uppercase letter',   test: (p) => /[A-Z]/.test(p) },
  { id: 'lower',   label: 'One lowercase letter',   test: (p) => /[a-z]/.test(p) },
  { id: 'special', label: 'One special character',  test: (p) => /[^A-Za-z0-9\s]/.test(p) },
];

export const isValidPassword = (p = '') => PASSWORD_RULES.every((r) => r.test(p));
```

`shared/constants/index.js`
```js
export const ROLES = { ADMIN: 'admin', STAFF: 'staff', CUSTOMER: 'customer' };
export const BILLING_PERIODS = ['daily', 'weekly', 'monthly', 'yearly'];
export const SUBSCRIPTION_STATUS = ['draft', 'quotation', 'confirmed', 'active', 'closed'];
export const INVOICE_STATUS = ['draft', 'confirmed', 'paid', 'cancelled'];
export const PAYMENT_METHODS = ['cash', 'bank_transfer', 'card', 'upi', 'cheque', 'other'];
```

`shared/styles/base.css`: a minimal reset only (box-sizing, margin reset, `img{max-width:100%}`, `button{font:inherit}`, `body{font-family:var(--font-body)}`). It must reference only variables, never hard-coded colors.

---

## 3. Server

```bash
cd ../server
npm init -y
npm i express cors helmet cookie-parser morgan dotenv sequelize mysql2 \
      bcrypt jsonwebtoken zod nodemailer node-cron express-rate-limit
npm i -D nodemon
```

`server/package.json` must contain:
```json
{
  "name": "@brightloop/server",
  "type": "module",
  "scripts": {
    "dev": "nodemon src/server.js",
    "start": "node src/server.js",
    "seed": "node src/seeders/index.js",
    "test": "node --test"
  }
}
```

Create the structure:
```bash
mkdir -p src/{config,models,controllers,services,routes/portal,routes/ops,middleware,validators,jobs,seeders,utils}
touch src/app.js src/server.js
touch src/config/{env.js,db.js,mail.js}
touch src/models/index.js
touch src/routes/index.js
touch src/middleware/{authenticate.js,authorize.js,validate.js,errorHandler.js}
touch src/utils/{ApiError.js,asyncHandler.js,pagination.js}
```

`server/.env.example` (copy to `.env`; contents are in `ARCHITECTURE.md` §11). Create `.env` and fill DB credentials.

### 3.1 Starter files

`src/config/env.js`
```js
import 'dotenv/config';

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 4000,
  db: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  },
  jwt: { accessSecret: process.env.JWT_ACCESS_SECRET, accessTtl: process.env.JWT_ACCESS_TTL || '15m' },
  refreshTtlDays: Number(process.env.REFRESH_TTL_DAYS) || 7,
  resetTtlMinutes: Number(process.env.RESET_TTL_MINUTES) || 30,
  portalUrl: process.env.PORTAL_URL,
  opsUrl: process.env.OPS_URL,
};
```

`src/config/db.js`
```js
import { Sequelize } from 'sequelize';
import { env } from './env.js';

export const sequelize = new Sequelize(env.db.name, env.db.user, env.db.password, {
  host: env.db.host,
  port: env.db.port,
  dialect: 'mysql',
  logging: env.nodeEnv === 'development' ? console.log : false,
  pool: { max: 15, min: 2, acquire: 30000, idle: 10000 },
  define: { underscored: false, freezeTableName: false },
});
```

`src/utils/ApiError.js`
```js
export class ApiError extends Error {
  constructor(status, message, fieldErrors) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}
```

`src/utils/asyncHandler.js`
```js
export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
```

`src/middleware/errorHandler.js`
```js
export const notFound = (req, res) =>
  res.status(404).json({ status: 404, message: 'Route not found' });

export const errorHandler = (err, req, res, _next) => {
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({
    status,
    message: status >= 500 ? 'Internal server error' : err.message,
    fieldErrors: err.fieldErrors,
  });
};
```

`src/app.js`
```js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

const app = express();
app.use(helmet());
app.use(cors({ origin: [env.portalUrl, env.opsUrl], credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
if (env.nodeEnv !== 'test') app.use(morgan('dev'));

app.use('/api', routes);
app.use(notFound);
app.use(errorHandler);

export default app;
```

`src/routes/index.js`
```js
import { Router } from 'express';
const router = Router();

router.get('/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));
// mount /auth, /portal, /ops here in later milestones

export default router;
```

`src/server.js`
```js
import app from './app.js';
import { env } from './config/env.js';
import { sequelize } from './config/db.js';

const start = async () => {
  await sequelize.authenticate();
  console.log('MySQL connected');
  app.listen(env.port, () => console.log(`API on http://localhost:${env.port}`));
};

start().catch((e) => { console.error('Startup failed', e); process.exit(1); });
```

> Models, migrations and `sequelize.sync()` come in **Milestone 2**. For now only prove the DB connection works.

---

## 4. Front-end apps (create both identically)

From the repo root:
```bash
npm create vite@latest portal -- --template react
npm create vite@latest ops    -- --template react
```
If prompted about existing files, keep the folders created earlier but let Vite populate them. Then, **inside each** of `portal` and `ops`:

```bash
npm i react-router-dom @reduxjs/toolkit react-redux async-mutex
npm i -D eslint
```
Also add the shared workspace:
```bash
# from repo root
npm i @brightloop/shared -w portal -w ops
```

Set ports in each `vite.config.js`:
```js
// portal/vite.config.js  → port 5173
// ops/vite.config.js     → port 5174
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({ plugins: [react()], server: { port: 5173, strictPort: true } }); // 5174 for ops
```

Create `.env` in each: `VITE_API_URL=http://localhost:4000/api`

### 4.1 Folder skeleton (both apps)

Delete Vite's demo files (`App.css`, `assets/react.svg`, default `index.css` content), then:
```bash
cd portal   # repeat for ops
mkdir -p src/{app,services/endpoints,features/auth,features/ui,routes,components,pages,styles}
touch src/app/{store.js,hooks.js}
touch src/services/{api.js,baseQuery.js}
touch src/features/auth/authSlice.js src/features/ui/uiSlice.js
touch src/routes/{ProtectedRoute.jsx,index.jsx}
touch src/styles/{variables.css,global.css}
```

### 4.2 `styles/variables.css` (the ONE global token file)

Same file in both apps (portal and ops may differ later in accent color only).
```css
:root {
  /* Brand */
  --color-primary: #4f46e5;
  --color-primary-hover: #4338ca;
  --color-primary-soft: #eef2ff;
  --color-accent: #0ea5e9;

  /* Semantic */
  --color-success: #16a34a;
  --color-warning: #d97706;
  --color-danger:  #dc2626;
  --color-info:    #0284c7;

  /* Neutrals */
  --color-bg: #f8fafc;
  --color-surface: #ffffff;
  --color-border: #e2e8f0;
  --color-text: #0f172a;
  --color-text-muted: #64748b;

  /* Typography */
  --font-body: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, monospace;
  --fs-xs: 0.75rem;  --fs-sm: 0.875rem; --fs-md: 1rem;
  --fs-lg: 1.25rem;  --fs-xl: 1.5rem;   --fs-2xl: 2rem;
  --fw-regular: 400; --fw-medium: 500;  --fw-bold: 700;
  --lh-base: 1.5;

  /* Spacing scale */
  --space-1: 0.25rem; --space-2: 0.5rem; --space-3: 0.75rem; --space-4: 1rem;
  --space-5: 1.5rem;  --space-6: 2rem;   --space-7: 3rem;

  /* Shape + depth */
  --radius-sm: 4px; --radius-md: 8px; --radius-lg: 12px; --radius-pill: 999px;
  --shadow-sm: 0 1px 2px rgb(0 0 0 / 0.06);
  --shadow-md: 0 4px 12px rgb(0 0 0 / 0.08);

  /* Layout */
  --sidebar-width: 240px;
  --header-height: 56px;
  --container-max: 1200px;
  /* Breakpoints (use as literals in @media): sm 640px · md 768px · lg 1024px · xl 1280px */

  /* Motion + layering */
  --transition-fast: 120ms ease;
  --transition-base: 200ms ease;
  --z-dropdown: 100; --z-modal: 200; --z-toast: 300;
}
```

`styles/global.css`
```css
@import '@brightloop/shared/styles/base.css';
```

`main.jsx` imports **in this order**: `./styles/variables.css`, `./styles/global.css`. Remove Vite's default `index.css` import.

### 4.3 Redux wiring (skeleton only)

`src/app/store.js`
```js
import { configureStore } from '@reduxjs/toolkit';
import { api } from '../services/api';
import authReducer from '../features/auth/authSlice';
import uiReducer from '../features/ui/uiSlice';

export const store = configureStore({
  reducer: { [api.reducerPath]: api.reducer, auth: authReducer, ui: uiReducer },
  middleware: (gdm) => gdm().concat(api.middleware),
  devTools: import.meta.env.DEV,
});
```

`src/app/hooks.js`
```js
import { useDispatch, useSelector } from 'react-redux';
export const useAppDispatch = useDispatch;
export const useAppSelector = useSelector;
```

`src/features/auth/authSlice.js`: slice with state `{ user: null, role: null, accessToken: null, bootstrapping: true }`, reducers `setCredentials`, `logout`, `setBootstrapped`, and selectors `selectCurrentUser`, `selectRole`, `selectIsAdmin`.

`src/features/ui/uiSlice.js`: state `{ toasts: [], modal: null, sidebarOpen: true }` with add/remove toast, open/close modal, toggle sidebar.

`src/services/baseQuery.js`: implement exactly as in the architecture notes: `fetchBaseQuery` with `credentials: 'include'`, Bearer header from `getState().auth.accessToken`, 401 → single mutex-guarded `POST /auth/refresh` → retry once → else dispatch `logout`.

`src/services/api.js`
```js
import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './baseQuery';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Subscription','Invoice','Payment','Product','Plan','Tax','Discount','Template','Customer','Staff','Dashboard'],
  endpoints: () => ({}),
});
```

`main.jsx`: wrap `<App />` in `<Provider store={store}>` and `<BrowserRouter>`.

### 4.4 Smoke-test page

Create `src/pages/Home/Home.jsx` + `Home.css` that:
- calls `GET /health` via a tiny RTK Query endpoint (`services/endpoints/healthApi.js`) and displays "API: OK" or the error;
- uses only `var(--*)` tokens in its CSS, with class names prefixed `home-`.

This proves: Vite → Redux → RTK Query → CORS → Express.

### 4.5 CSS convention reminder
Every component/page lives in its own folder with a same-named `.css`. Class names are prefixed by the component (`.btn`, `.btn--primary`, `.home-card`). No hard-coded colors or spacing; use tokens only.

---

## 5. Run and verify

Three terminals from the repo root:
```bash
npm run dev:server    # http://localhost:4000/api/health → { "ok": true }
npm run dev:portal    # http://localhost:5173
npm run dev:ops       # http://localhost:5174
```

**Milestone 1 is done when:**
- [ ] `GET http://localhost:4000/api/health` returns `{ ok: true, time }`
- [ ] Server logs "MySQL connected"
- [ ] Both apps load on 5173 and 5174 and show "API: OK" from the smoke-test page
- [ ] No CORS errors in the browser console
- [ ] Redux DevTools shows `api`, `auth`, `ui` in the store
- [ ] `variables.css` is imported once per app and the smoke page styles come from tokens
- [ ] `git commit -m "chore: scaffold monorepo"`

---

## 6. Conventions to keep for all later milestones

- ES modules everywhere; include the `.js` extension in server-side relative imports.
- Controllers stay thin; **business logic lives in `services/`**.
- Money is `DECIMAL(12,2)`; never use floats.
- Every list endpoint paginates (`page`, `limit ≤ 100`) and returns `{ data, meta }`.
- Every endpoint validates input with Zod; errors go through `ApiError` and the error handler.
- Customer-scoped queries take the customer ID from the verified token only.
- Commit per milestone with conventional messages (`feat:`, `fix:`, `chore:`).

**Next:** proceed to Milestone 2 in `ARCHITECTURE.md` §12: models, associations, indexes, seeders.
