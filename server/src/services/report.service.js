import { Op, literal } from 'sequelize';
import { Payment, Subscription, Invoice } from '../models/index.js';
import { addMoney, subtractMoney } from '../utils/money.js';

/**
 * Monthly revenue collection trend for past N months.
 *
 * @param {Object} [params]
 * @param {number} [params.months=6]
 * @returns {Promise<Array<{ month: string, revenue: number, paymentCount: number }>>}
 */
export const getMonthlyRevenueTrend = async ({ months = 6 } = {}) => {
  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - (months - 1));
  cutoffDate.setDate(1);
  const cutoffStr = cutoffDate.toISOString().split('T')[0];

  const payments = await Payment.findAll({
    where: {
      paidOn: { [Op.gte]: cutoffStr },
    },
    attributes: ['amount', 'paidOn'],
    order: [['paidOn', 'ASC']],
  });

  const monthMap = {};

  // Initialize all months in range with 0
  for (let i = 0; i < months; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - (months - 1 - i));
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthMap[key] = { month: key, revenue: 0, paymentCount: 0 };
  }

  for (const p of payments) {
    const monthKey = p.paidOn.slice(0, 7); // YYYY-MM
    if (monthMap[monthKey]) {
      monthMap[monthKey].revenue = addMoney(monthMap[monthKey].revenue, p.amount);
      monthMap[monthKey].paymentCount += 1;
    }
  }

  return Object.values(monthMap);
};

/**
 * Breakdown of revenue by payment method.
 */
export const getPaymentMethodBreakdown = async () => {
  const payments = await Payment.findAll({
    attributes: ['method', 'amount'],
  });

  const breakdown = {};
  for (const p of payments) {
    const m = p.method || 'other';
    breakdown[m] = addMoney(breakdown[m] || 0, p.amount);
  }

  return Object.entries(breakdown).map(([method, total]) => ({
    method,
    total,
  }));
};

/**
 * Monthly subscription net growth (created vs closed).
 */
export const getSubscriptionGrowthReport = async ({ months = 6 } = {}) => {
  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - (months - 1));
  cutoffDate.setDate(1);

  const monthMap = {};
  for (let i = 0; i < months; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - (months - 1 - i));
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthMap[key] = { month: key, created: 0, closed: 0, net: 0 };
  }

  const allSubs = await Subscription.findAll({
    attributes: ['createdAt', 'closedAt'],
  });

  for (const sub of allSubs) {
    const createdMonth = new Date(sub.createdAt).toISOString().slice(0, 7);
    if (monthMap[createdMonth]) {
      monthMap[createdMonth].created += 1;
    }

    if (sub.closedAt) {
      const closedMonth = new Date(sub.closedAt).toISOString().slice(0, 7);
      if (monthMap[closedMonth]) {
        monthMap[closedMonth].closed += 1;
      }
    }
  }

  for (const item of Object.values(monthMap)) {
    item.net = item.created - item.closed;
  }

  return Object.values(monthMap);
};

/**
 * Accounts Receivable Aging Report for outstanding invoices.
 */
export const getAgingInvoicesReport = async () => {
  const today = new Date().toISOString().split('T')[0];

  const outstandingInvoices = await Invoice.findAll({
    where: {
      status: 'confirmed',
      [Op.and]: literal('amountPaid < total'),
    },
    attributes: ['id', 'number', 'total', 'amountPaid', 'dueDate'],
  });

  const buckets = {
    current: { label: 'Current (Not Due)', count: 0, balance: 0 },
    days1_30: { label: '1 - 30 Days Overdue', count: 0, balance: 0 },
    days31_60: { label: '31 - 60 Days Overdue', count: 0, balance: 0 },
    days61_90: { label: '61 - 90 Days Overdue', count: 0, balance: 0 },
    days90Plus: { label: '90+ Days Overdue', count: 0, balance: 0 },
  };

  const todayMs = new Date(today).getTime();

  for (const inv of outstandingInvoices) {
    const balance = subtractMoney(inv.total, inv.amountPaid);
    const dueMs = new Date(inv.dueDate).getTime();
    const diffDays = Math.floor((todayMs - dueMs) / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      buckets.current.count += 1;
      buckets.current.balance = addMoney(buckets.current.balance, balance);
    } else if (diffDays <= 30) {
      buckets.days1_30.count += 1;
      buckets.days1_30.balance = addMoney(buckets.days1_30.balance, balance);
    } else if (diffDays <= 60) {
      buckets.days31_60.count += 1;
      buckets.days31_60.balance = addMoney(buckets.days31_60.balance, balance);
    } else if (diffDays <= 90) {
      buckets.days61_90.count += 1;
      buckets.days61_90.balance = addMoney(buckets.days61_90.balance, balance);
    } else {
      buckets.days90Plus.count += 1;
      buckets.days90Plus.balance = addMoney(buckets.days90Plus.balance, balance);
    }
  }

  return buckets;
};
