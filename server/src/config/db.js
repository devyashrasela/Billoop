import fs from 'node:fs';
import { Sequelize } from 'sequelize';
import { env } from './env.js';

if (!env.db.url) throw new Error('DB_URL is not set (Aiven service URI)');

// Aiven requires TLS. Prefer the PEM contents (deploys), fall back to a file (local dev).
const ca = env.db.sslCa || (env.db.sslCaPath && fs.readFileSync(env.db.sslCaPath, 'utf8'));
if (!ca) throw new Error('Set DB_SSL_CA or DB_SSL_CA_PATH (Aiven CA certificate)');

export const sequelize = new Sequelize(env.db.url, {
  dialect: 'mysql',
  dialectOptions: {
    ssl: { ca, rejectUnauthorized: true },
    connectTimeout: 15000,
    dateStrings: false,
  },
  timezone: '+00:00',                                  // store and read everything in UTC
  logging: env.nodeEnv === 'development' ? console.log : false,
  pool: {
    max: env.db.poolMax,   // keep below the Aiven plan's connection limit
    min: 0,
    acquire: 30000,
    idle: 10000,
    evict: 5000,           // drop idle connections before the server/proxy does
  },
  retry: { max: 3 },       // retry transient connection errors
  define: { underscored: false, freezeTableName: false },
});

