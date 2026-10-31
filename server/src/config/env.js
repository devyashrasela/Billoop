import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 4000,
  db: {
    url: process.env.DB_URL,                         // Aiven service URI (database = brightloop)
    sslCaPath: process.env.DB_SSL_CA_PATH,           // local dev: path to ca.pem
    sslCa: process.env.DB_SSL_CA,                    // deployed: PEM contents as an env var
    poolMax: Number(process.env.DB_POOL_MAX) || 8,
  },
  jwt: { accessSecret: process.env.JWT_ACCESS_SECRET, accessTtl: process.env.JWT_ACCESS_TTL || '15m' },
  refreshTtlDays: Number(process.env.REFRESH_TTL_DAYS) || 7,
  resetTtlMinutes: Number(process.env.RESET_TTL_MINUTES) || 30,
  portalUrl: process.env.PORTAL_URL,
  opsUrl: process.env.OPS_URL,
  billingCron: process.env.BILLING_CRON || '0 1 * * *',
  billingAutoConfirm: process.env.BILLING_AUTO_CONFIRM !== 'false',
  seed: {
    adminEmail: process.env.SEED_ADMIN_EMAIL || 'admin@brightloop.test',
    adminPassword: process.env.SEED_ADMIN_PASSWORD || 'Admin@12345',
  },
};
