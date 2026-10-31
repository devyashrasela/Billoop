import app from './app.js';
import { env } from './config/env.js';
import { sequelize } from './config/db.js';

const start = async () => {
  await sequelize.authenticate();
  console.log('MySQL connected');
  app.listen(env.port, () => console.log(`API on http://localhost:${env.port}`));
};

start().catch((e) => {
  console.error('Startup failed', e);
  process.exit(1);
});
