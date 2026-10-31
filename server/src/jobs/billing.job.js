import cron from 'node-cron';
import { env } from '../config/env.js';
import { runBillingSweep } from '../services/billing.service.js';

let task = null;

export const startBillingJob = () => {
  const cronExpression = env.billingCron || '0 1 * * *';

  if (!cron.validate(cronExpression)) {
    console.error(`[Billing Cron] Invalid cron expression: "${cronExpression}". Job not started.`);
    return null;
  }

  task = cron.schedule(cronExpression, async () => {
    console.log('[Billing Cron] Triggered scheduled billing sweep...');
    try {
      await runBillingSweep();
    } catch (err) {
      console.error('[Billing Cron] Uncaught error during sweep:', err);
    }
  });

  console.log(`[Billing Cron] Scheduled with expression: "${cronExpression}"`);
  return task;
};

export const stopBillingJob = () => {
  if (task) {
    task.stop();
    task = null;
  }
};
