import { Op } from 'sequelize';
import { sequelize } from '../config/db.js';
import {
  Invoice,
  InvoiceLine,
  Customer,
  Subscription,
  Payment,
  Product,
  ProductVariant,
  Tax,
  Sequence,
} from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { paginate, paginationMeta } from '../utils/pagination.js';
import { recordAuditLog } from './audit.service.js';
import { getNextSequenceNumber } from '../utils/numbering.js';

export const listInvoices = async (query = {}) => {
  const { page, limit, offset } = paginate(query);
  const where = {};
  const todayStr = new Date().toISOString().split('T')[0];

  if (query.status === 'overdue') {
    where.status = 'confirmed';
    where.dueDate = { [Op.lt]: todayStr };
    where[Op.and] = sequelize.literal('amountPaid < total');
  } else if (query.status) {
    where.status = query.status;
  }

  if (query.customerId) {
    where.customerId = query.customerId;
  }

  if (query.subscriptionId) {
    where.subscriptionId = query.subscriptionId;
  }

  if (query.q) {
    where[Op.or] = [
      { number: { [Op.like]: `%${query.q}%` } },
      { '$customer.name$': { [Op.like]: `%${query.q}%` } },
      { '$customer.company$': { [Op.like]: `%${query.q}%` } },
    ];
  }

  const { rows, count } = await Invoice.findAndCountAll({
    where,
    limit,
    offset,
    order: [['issueDate', 'DESC'], ['id', 'DESC']],
    include: [
      { model: Customer, as: 'customer', attributes: ['id', 'name', 'company', 'phone'] },
      { model: Subscription, as: 'subscription', attributes: ['id', 'number'] },
      { model: Payment, as: 'payments', attributes: ['id', 'amount', 'paidOn', 'method'] },
    ],
  });

  return {
    data: rows,
    meta: paginationMeta(count, page, limit),
  };
};

export const getInvoiceById = async (id) => {
  const invoice = await Invoice.findByPk(id, {
    include: [
      { model: Customer, as: 'customer' },
      { model: Subscription, as: 'subscription' },
      {
        model: Payment,
        as: 'payments',
        separate: true,
        order: [['paidOn', 'DESC'], ['id', 'DESC']],
      },
      {
        model: InvoiceLine,
        as: 'lines',
        include: [
          { model: Product, as: 'product' },
          { model: ProductVariant, as: 'variant' },
          { model: Tax, as: 'tax' },
        ],
      },
    ],
  });

  if (!invoice) {
    throw new ApiError(404, `Invoice with ID ${id} not found`);
  }

  return invoice;
};

export const confirmInvoice = async (id, actorId = null) => {
  return await sequelize.transaction(async (t) => {
    const invoice = await Invoice.findByPk(id, {
      lock: t.LOCK.UPDATE,
      transaction: t,
    });

    if (!invoice) {
      throw new ApiError(404, `Invoice with ID ${id} not found`);
    }

    if (invoice.status !== 'draft') {
      throw new ApiError(409, `Cannot confirm an invoice that is already ${invoice.status}`);
    }

    const before = invoice.toJSON();

    // If number was a temporary placeholder or draft, assign sequence number
    if (!invoice.number || invoice.number.startsWith('DRAFT-')) {
      const invoiceNumber = await getNextSequenceNumber({
        type: 'invoice',
        transaction: t,
        SequenceModel: Sequence,
      });
      invoice.number = invoiceNumber;
    }

    invoice.status = 'confirmed';
    await invoice.save({ transaction: t });

    await recordAuditLog({
      actorId,
      entity: 'invoice',
      entityId: invoice.id,
      action: 'confirm',
      before,
      after: invoice.toJSON(),
      transaction: t,
    });
  });

  return getInvoiceById(id);
};

export const cancelInvoice = async (id, reason = null, actorId = null) => {
  await sequelize.transaction(async (t) => {
    const invoice = await Invoice.findByPk(id, {
      lock: t.LOCK.UPDATE,
      transaction: t,
    });

    if (!invoice) {
      throw new ApiError(404, `Invoice with ID ${id} not found`);
    }

    if (invoice.status === 'cancelled') {
      throw new ApiError(409, 'Invoice is already cancelled');
    }

    if (Number(invoice.amountPaid) > 0) {
      throw new ApiError(
        409,
        `Cannot cancel an invoice with recorded payments ($${Number(invoice.amountPaid).toFixed(2)})`
      );
    }

    const before = invoice.toJSON();

    invoice.status = 'cancelled';
    invoice.cancelledAt = new Date();
    await invoice.save({ transaction: t });

    await recordAuditLog({
      actorId,
      entity: 'invoice',
      entityId: invoice.id,
      action: 'cancel',
      before,
      after: { ...invoice.toJSON(), cancelReason: reason },
      transaction: t,
    });
  });

  return getInvoiceById(id);
};
