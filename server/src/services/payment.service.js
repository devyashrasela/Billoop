import { Op } from 'sequelize';
import { sequelize } from '../config/db.js';
import { Payment, Invoice, User, Customer } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { addMoney, subtractMoney } from '../utils/money.js';
import { paginate, paginationMeta } from '../utils/pagination.js';
import { recordAuditLog } from './audit.service.js';
import { getInvoiceById } from './invoice.service.js';

export const recordPayment = async (invoiceId, paymentData, actorId) => {
  if (!actorId) {
    throw new ApiError(401, 'Actor ID is required to record a payment');
  }

  const createdPayment = await sequelize.transaction(async (t) => {
    // Row-level lock on the target invoice
    const invoice = await Invoice.findByPk(invoiceId, {
      lock: t.LOCK.UPDATE,
      transaction: t,
    });

    if (!invoice) {
      throw new ApiError(404, `Invoice with ID ${invoiceId} not found`);
    }

    if (invoice.status !== 'confirmed') {
      throw new ApiError(
        409,
        `Payments can only be recorded for confirmed invoices. Current status: ${invoice.status}`
      );
    }

    const currentPaid = Number(invoice.amountPaid || 0);
    const invoiceTotal = Number(invoice.total || 0);
    const balanceDue = subtractMoney(invoiceTotal, currentPaid);

    const paymentAmount = Number(paymentData.amount);

    if (paymentAmount <= 0) {
      throw new ApiError(400, 'Payment amount must be greater than zero');
    }

    if (paymentAmount > balanceDue) {
      throw new ApiError(
        409,
        `Payment amount ($${paymentAmount.toFixed(2)}) exceeds balance due ($${balanceDue.toFixed(2)})`
      );
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const paidOn = paymentData.paidOn || todayStr;

    // Create Payment record
    const payment = await Payment.create(
      {
        invoiceId: invoice.id,
        method: paymentData.method,
        amount: paymentAmount,
        paidOn,
        note: paymentData.note || null,
        recordedBy: actorId,
      },
      { transaction: t }
    );

    // Update invoice amountPaid
    const newAmountPaid = addMoney(currentPaid, paymentAmount);
    invoice.amountPaid = newAmountPaid;

    if (newAmountPaid >= invoiceTotal) {
      invoice.status = 'paid';
    }

    await invoice.save({ transaction: t });

    await recordAuditLog({
      actorId,
      entity: 'payment',
      entityId: payment.id,
      action: 'record_payment',
      before: null,
      after: {
        paymentId: payment.id,
        invoiceId: invoice.id,
        amount: paymentAmount,
        method: paymentData.method,
        invoiceStatus: invoice.status,
      },
      transaction: t,
    });

    return payment;
  });

  const updatedInvoice = await getInvoiceById(invoiceId);
  return {
    payment: createdPayment,
    invoice: updatedInvoice,
  };
};

export const listPayments = async (query = {}) => {
  const { page, limit, offset } = paginate(query);
  const where = {};

  if (query.invoiceId) {
    where.invoiceId = query.invoiceId;
  }

  if (query.method) {
    where.method = query.method;
  }

  if (query.q) {
    where[Op.or] = [
      { note: { [Op.like]: `%${query.q}%` } },
      { '$invoice.number$': { [Op.like]: `%${query.q}%` } },
    ];
  }

  const { rows, count } = await Payment.findAndCountAll({
    where,
    limit,
    offset,
    order: [['paidOn', 'DESC'], ['id', 'DESC']],
    include: [
      {
        model: Invoice,
        as: 'invoice',
        attributes: ['id', 'number', 'total', 'status'],
        include: [
          { model: Customer, as: 'customer', attributes: ['id', 'name', 'company'] },
        ],
      },
      {
        model: User,
        as: 'recorder',
        attributes: ['id', 'name', 'email'],
      },
    ],
  });

  return {
    data: rows,
    meta: paginationMeta(count, page, limit),
  };
};
