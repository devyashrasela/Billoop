import { Op, fn, col, literal } from 'sequelize';
import {
  Subscription,
  SubscriptionLine,
  Plan,
  Invoice,
  Payment,
  Customer,
} from '../models/index.js';
import { addMoney, subtractMoney } from '../utils/money.js';

/**
 * Normalizes subscription periodic revenue to Monthly Recurring Revenue (MRR).
 *
 * @param {number} amount
 * @param {'daily'|'weekly'|'monthly'|'yearly'} period
 * @returns {number}
 */
export const normalizeToMRR = (amount, period) => {
  const num = Number(amount) || 0;
  switch (period) {
    case 'daily':
      return Math.round(num * 30 * 100) / 100;
    case 'weekly':
      return Math.round(num * (52 / 12) * 100) / 100;
    case 'monthly':
      return num;
    case 'yearly':
      return Math.round((num / 12) * 100) / 100;
    default:
      return num;
  }
};

/**
 * Retrieves executive dashboard summary KPIs.
 */
export const getDashboardSummary = async () => {
  const today = new Date().toISOString().split('T')[0];

  // 1. Fetch active subscriptions with their plans and pre-computed amounts
  const activeSubs = await Subscription.findAll({
    where: {
      status: 'active',
    },
    include: [
      { model: Plan, as: 'plan', attributes: ['billingPeriod'] },
      { model: SubscriptionLine, as: 'lines', attributes: ['amount'] },
    ],
  });

  let totalMRR = 0;
  let activeCount = 0;
  let pausedCount = 0;

  for (const sub of activeSubs) {
    if (sub.isPaused) {
      pausedCount += 1;
      continue;
    }

    activeCount += 1;
    const subtotal = sub.lines.reduce((sum, line) => addMoney(sum, line.amount), 0);
    const mrrForSub = normalizeToMRR(subtotal, sub.plan?.billingPeriod || 'monthly');
    totalMRR = addMoney(totalMRR, mrrForSub);
  }

  const totalARR = Math.round(totalMRR * 12 * 100) / 100;

  // 2. Overdue Invoices
  // Derived definition: status = 'confirmed' AND amountPaid < total AND dueDate < today
  const overdueInvoices = await Invoice.findAll({
    where: {
      status: 'confirmed',
      dueDate: { [Op.lt]: today },
      [Op.and]: literal('amountPaid < total'),
    },
    attributes: ['id', 'total', 'amountPaid'],
  });

  const overdueCount = overdueInvoices.length;
  const overdueTotalAmount = overdueInvoices.reduce((sum, inv) => {
    const balance = subtractMoney(inv.total, inv.amountPaid);
    return addMoney(sum, balance);
  }, 0);

  // 3. Current Month Revenue Collected vs All-Time
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .split('T')[0];

  const monthPayments = await Payment.findAll({
    where: {
      paidOn: { [Op.gte]: startOfMonth },
    },
    attributes: ['amount'],
  });
  const monthRevenue = monthPayments.reduce((sum, p) => addMoney(sum, p.amount), 0);

  const allPayments = await Payment.findAll({
    attributes: ['amount'],
  });
  const totalRevenueAllTime = allPayments.reduce((sum, p) => addMoney(sum, p.amount), 0);

  // 4. Churn stats (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const closedSubsCount = await Subscription.count({
    where: {
      status: 'closed',
      closedAt: { [Op.gte]: thirtyDaysAgo },
    },
  });

  const baseForChurn = activeCount + closedSubsCount;
  const churnRate =
    baseForChurn > 0 ? Math.round((closedSubsCount / baseForChurn) * 1000) / 10 : 0.0;

  // 5. Recent Activity
  const recentInvoices = await Invoice.findAll({
    limit: 5,
    order: [['createdAt', 'DESC']],
    include: [{ model: Customer, as: 'customer', attributes: ['name', 'company'] }],
    attributes: ['id', 'number', 'total', 'status', 'issueDate', 'dueDate'],
  });

  const recentSubscriptions = await Subscription.findAll({
    limit: 5,
    order: [['createdAt', 'DESC']],
    include: [
      { model: Customer, as: 'customer', attributes: ['name', 'company'] },
      { model: Plan, as: 'plan', attributes: ['name', 'billingPeriod'] },
    ],
    attributes: ['id', 'number', 'status', 'startDate', 'createdAt'],
  });

  return {
    kpis: {
      mrr: totalMRR,
      arr: totalARR,
      activeSubscriptions: activeCount,
      pausedSubscriptions: pausedCount,
      overdueInvoicesCount: overdueCount,
      overdueTotalAmount,
      monthRevenue,
      totalRevenueAllTime,
      churnRate30Days: churnRate,
      closedSubscriptions30Days: closedSubsCount,
    },
    recentInvoices,
    recentSubscriptions,
  };
};
