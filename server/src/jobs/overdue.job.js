import cron from 'node-cron';
import { Op } from 'sequelize';
import { Subscription, Plan } from '../models/index.js';
import { toDateString } from '../services/billing.service.js';

let task = null;

/**
 * Sweeps for subscriptions that have passed their expiryDate and autoClose is enabled.
 */
export const runOverdueAndExpirySweep = async (todayStr = toDateString(new Date())) => {
  console.log(`[Overdue/Expiry Sweep] Running for date: ${todayStr}...`);

  const expiredSubs = await Subscription.findAll({
    include: [
      {
        model: Plan,
        as: 'plan',
        where: { autoClose: true },
      },
    ],
    where: {
      status: 'active',
      expiryDate: {
        [Op.ne]: null,
        [Op.lte]: todayStr,
      },
    },
  });

  let closedCount = 0;
  for (const sub of expiredSubs) {
    sub.status = 'closed';
    sub.closedAt = new Date();
    sub.closeReason = 'Auto-closed upon reaching plan expiry date';
    await sub.save();
    closedCount += 1;
  }

  console.log(`[Overdue/Expiry Sweep] Closed ${closedCount} expired subscriptions.`);
  return { closedCount };
};

export const startOverdueJob = () => {
  // Runs daily at 02:00 AM UTC
  const cronExpression = '0 2 * * *';

  task = cron.schedule(cronExpression, async () => {
    try {
      await runOverdueAndExpirySweep();
    } catch (err) {
      console.error('[Overdue Cron] Error during sweep:', err);
    }
  });

  console.log(`[Overdue Cron] Scheduled with expression: "${cronExpression}"`);
  return task;
};

export const stopOverdueJob = () => {
  if (task) {
    task.stop();
    task = null;
  }
};
