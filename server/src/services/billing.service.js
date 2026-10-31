import { Op } from 'sequelize';
import { env } from '../config/env.js';
import { addMoney, subtractMoney, multiplyMoney } from '../utils/money.js';
import { getNextSequenceNumber } from '../utils/numbering.js';
import {
  sequelize,
  Subscription,
  SubscriptionLine,
  Plan,
  PaymentTerm,
  Tax,
  Product,
  ProductVariant,
  Invoice,
  InvoiceLine,
  Sequence,
} from '../models/index.js';
import { computeLineTax, sumLineTaxes } from './tax.service.js';
import { applyDiscounts } from './discount.service.js';

/**
 * Format a Date object to YYYY-MM-DD
 * @param {Date|string} d
 * @returns {string}
 */
export const toDateString = (d) => {
  const date = new Date(d);
  return date.toISOString().split('T')[0];
};

/**
 * Advances a YYYY-MM-DD date by one billing period.
 *
 * @param {string} dateStr - YYYY-MM-DD
 * @param {'daily'|'weekly'|'monthly'|'yearly'} period
 * @returns {string} New YYYY-MM-DD
 */
export const advancePeriod = (dateStr, period) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  switch (period) {
    case 'daily':
      date.setUTCDate(date.getUTCDate() + 1);
      break;
    case 'weekly':
      date.setUTCDate(date.getUTCDate() + 7);
      break;
    case 'monthly':
      date.setUTCMonth(date.getUTCMonth() + 1);
      break;
    case 'yearly':
      date.setUTCFullYear(date.getUTCFullYear() + 1);
      break;
    default:
      date.setUTCMonth(date.getUTCMonth() + 1);
  }

  return date.toISOString().split('T')[0];
};

/**
 * Calculates periodEnd: start + period - 1 day.
 *
 * @param {string} periodStartStr - YYYY-MM-DD
 * @param {'daily'|'weekly'|'monthly'|'yearly'} period
 * @returns {string} Period end YYYY-MM-DD
 */
export const calculatePeriodEnd = (periodStartStr, period) => {
  const nextStart = advancePeriod(periodStartStr, period);
  const [year, month, day] = nextStart.split('-').map(Number);
  const endDate = new Date(Date.UTC(year, month - 1, day - 1));
  return endDate.toISOString().split('T')[0];
};

/**
 * Adds dueDays to an issue date to calculate dueDate.
 *
 * @param {string} issueDateStr - YYYY-MM-DD
 * @param {number} dueDays
 * @returns {string} Due date YYYY-MM-DD
 */
export const calculateDueDate = (issueDateStr, dueDays = 0) => {
  const [year, month, day] = issueDateStr.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + (Number(dueDays) || 0)));
  return date.toISOString().split('T')[0];
};

/**
 * Generates an invoice for a single billing cycle of a subscription.
 * Runs inside its own database transaction with row-level locking.
 *
 * @param {number} subscriptionId
 * @param {string} todayStr - YYYY-MM-DD
 * @returns {Promise<{ invoice: Invoice|null, alreadyBilled: boolean, closed: boolean }>}
 */
export const processSubscriptionBillingCycle = async (subscriptionId, todayStr) => {
  return await sequelize.transaction(async (t) => {
    // 1. SELECT ... FOR UPDATE on Subscription
    const sub = await Subscription.findByPk(subscriptionId, {
      lock: t.LOCK.UPDATE,
      transaction: t,
      include: [
        { model: Plan, as: 'plan' },
        { model: PaymentTerm, as: 'paymentTerm' },
        {
          model: SubscriptionLine,
          as: 'lines',
          include: [
            { model: Product, as: 'product' },
            { model: ProductVariant, as: 'variant' },
            { model: Tax, as: 'tax' },
          ],
        },
      ],
    });

    if (!sub) {
      throw new Error(`Subscription #${subscriptionId} not found.`);
    }

    if (sub.status !== 'active' || sub.isPaused || sub.nextBillingDate > todayStr) {
      return { invoice: null, alreadyBilled: false, skipped: true };
    }

    const billingPeriod = sub.plan?.billingPeriod || 'monthly';
    const periodStart = sub.nextBillingDate;
    const periodEnd = calculatePeriodEnd(periodStart, billingPeriod);
    const dueDays = sub.paymentTerm?.dueDays || 0;
    const dueDate = calculateDueDate(todayStr, dueDays);

    // 2. Prepare line items and calculate line amounts
    const rawLines = sub.lines.map((l) => {
      const unitPrice = Number(l.unitPrice) || 0;
      const qty = Number(l.qty) || 1;
      const amount = multiplyMoney(unitPrice, qty);

      return {
        productId: l.productId,
        variantId: l.variantId || null,
        description:
          l.description ||
          `${l.product?.name || 'Service'}${l.variant ? ` (${l.variant.attribute}: ${l.variant.value})` : ''}`,
        qty,
        unitPrice,
        amount,
        tax: l.tax,
      };
    });

    // 3. Apply eligible discounts
    const { linesWithDiscounts, totalDiscount } = await applyDiscounts({
      subscription: sub,
      lines: rawLines,
      todayStr,
      transaction: t,
    });

    // 4. Calculate line-level taxes on discounted bases
    const preparedLines = linesWithDiscounts.map((l) => {
      const { taxAmount, taxRate, taxId } = computeLineTax({
        amount: l.amount,
        discount: l.discountAmount,
        tax: l.tax,
        qty: l.qty,
      });

      const lineTotal = addMoney(subtractMoney(l.amount, l.discountAmount), taxAmount);

      return {
        ...l,
        taxId,
        taxRate,
        taxAmount,
        lineTotal,
      };
    });

    // 5. Calculate invoice totals
    const subtotal = preparedLines.reduce((acc, l) => addMoney(acc, l.amount), 0);
    const discountTotal = totalDiscount;
    const taxTotal = sumLineTaxes(preparedLines);
    const total = addMoney(subtractMoney(subtotal, discountTotal), taxTotal);

    // 6. Generate gap-free invoice number
    const invoiceNumber = await getNextSequenceNumber({
      type: 'invoice',
      transaction: t,
      SequenceModel: Sequence,
    });

    // 7. Insert Invoice
    let invoice;
    try {
      invoice = await Invoice.create(
        {
          number: invoiceNumber,
          subscriptionId: sub.id,
          customerId: sub.customerId,
          periodStart,
          periodEnd,
          issueDate: todayStr,
          dueDate,
          status: env.billingAutoConfirm ? 'confirmed' : 'draft',
          subtotal,
          discountTotal,
          taxTotal,
          total,
          amountPaid: 0.0,
        },
        { transaction: t }
      );
    } catch (err) {
      // Idempotency: Unique constraint on (subscriptionId, periodStart)
      if (err.name === 'SequelizeUniqueConstraintError') {
        console.warn(`[Billing] Period ${periodStart} already billed for Subscription #${sub.id}. Skipping.`);
        return { invoice: null, alreadyBilled: true };
      }
      throw err;
    }

    // 8. Insert snapshot InvoiceLines
    const invoiceLineRecords = preparedLines.map((l) => ({
      invoiceId: invoice.id,
      productId: l.productId,
      variantId: l.variantId,
      description: l.description,
      qty: l.qty,
      unitPrice: l.unitPrice,
      discountAmount: l.discountAmount,
      taxId: l.taxId,
      taxRate: l.taxRate,
      taxAmount: l.taxAmount,
      lineTotal: l.lineTotal,
    }));

    await InvoiceLine.bulkCreate(invoiceLineRecords, { transaction: t });

    // 9. Advance subscription nextBillingDate
    const nextDate = advancePeriod(periodStart, billingPeriod);
    sub.nextBillingDate = nextDate;

    // 10. Check autoClose rule
    let closed = false;
    if (sub.plan?.autoClose && sub.expiryDate && nextDate > sub.expiryDate) {
      sub.status = 'closed';
      sub.closedAt = new Date();
      sub.closeReason = 'Subscription reached plan expiry date';
      closed = true;
    }

    await sub.save({ transaction: t });

    return { invoice, alreadyBilled: false, closed };
  });
};

/**
 * Runs the daily billing sweep across all due subscriptions.
 * Implements catch-up loops for subscriptions multiple periods behind.
 *
 * @param {Object} [options]
 * @param {string} [options.todayStr] - Override date for manual or testing runs
 * @param {number} [options.batchSize=200]
 * @returns {Promise<{ processed: number, invoicesGenerated: number, skipped: number, failed: Array<Object> }>}
 */
export const runBillingSweep = async ({ todayStr = toDateString(new Date()), batchSize = 200 } = {}) => {
  console.log(`[Billing Engine] Starting sweep for date: ${todayStr}...`);

  const summary = {
    processed: 0,
    invoicesGenerated: 0,
    skipped: 0,
    failed: [],
  };

  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const dueSubscriptions = await Subscription.findAll({
      where: {
        status: 'active',
        isPaused: false,
        nextBillingDate: { [Op.lte]: todayStr },
      },
      attributes: ['id', 'number', 'nextBillingDate'],
      limit: batchSize,
      offset,
      order: [['id', 'ASC']],
    });

    if (dueSubscriptions.length === 0) {
      hasMore = false;
      break;
    }

    for (const sub of dueSubscriptions) {
      summary.processed += 1;

      try {
        // Catch-up loop: process periods until nextBillingDate is in the future
        let keepProcessing = true;
        let cyclesForThisSub = 0;

        while (keepProcessing && cyclesForThisSub < 100) {
          cyclesForThisSub += 1;
          const result = await processSubscriptionBillingCycle(sub.id, todayStr);

          if (result.invoice) {
            summary.invoicesGenerated += 1;
          } else if (result.alreadyBilled || result.skipped) {
            summary.skipped += 1;
            keepProcessing = false;
            break;
          }

          if (result.closed) {
            keepProcessing = false;
            break;
          }

          // Check if subscription has caught up to today
          const freshSub = await Subscription.findByPk(sub.id, {
            attributes: ['status', 'isPaused', 'nextBillingDate'],
          });
          if (
            !freshSub ||
            freshSub.status !== 'active' ||
            freshSub.isPaused ||
            freshSub.nextBillingDate > todayStr
          ) {
            keepProcessing = false;
          }
        }
      } catch (err) {
        console.error(`[Billing Error] Subscription #${sub.id} (${sub.number}) failed:`, err.message);
        summary.failed.push({
          id: sub.id,
          number: sub.number,
          reason: err.message,
        });
      }
    }

    offset += batchSize;
  }

  console.log(
    `[Billing Engine] Sweep complete. Invoices: ${summary.invoicesGenerated}, Processed: ${summary.processed}, Failed: ${summary.failed.length}.`
  );

  return summary;
};
