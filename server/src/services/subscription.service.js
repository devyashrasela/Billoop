import { Op } from 'sequelize';
import { sequelize } from '../config/db.js';
import { Subscription } from '../models/Subscription.js';
import { SubscriptionLine } from '../models/SubscriptionLine.js';
import { Customer } from '../models/Customer.js';
import { Plan } from '../models/Plan.js';
import { PaymentTerm } from '../models/PaymentTerm.js';
import { QuotationTemplate } from '../models/QuotationTemplate.js';
import { TemplateLine } from '../models/TemplateLine.js';
import { Product } from '../models/Product.js';
import { ProductVariant } from '../models/ProductVariant.js';
import { Tax } from '../models/Tax.js';
import { recordAuditLog } from './audit.service.js';
import { ApiError } from '../utils/ApiError.js';
import { paginate, paginationMeta } from '../utils/pagination.js';
import { getNextSequenceNumber } from '../utils/numbering.js';
import { multiplyMoney } from '../utils/money.js';
import { advancePeriod } from '../services/billing.service.js';

export const listSubscriptions = async (query = {}) => {
  const { page, limit, offset } = paginate(query);
  const where = {};

  if (query.status) {
    where.status = query.status;
  }

  if (query.customerId) {
    where.customerId = query.customerId;
  }

  if (query.planId) {
    where.planId = query.planId;
  }

  if (query.q) {
    where[Op.or] = [
      { number: { [Op.like]: `%${query.q}%` } },
      { '$customer.name$': { [Op.like]: `%${query.q}%` } },
      { '$customer.company$': { [Op.like]: `%${query.q}%` } },
    ];
  }

  const { rows, count } = await Subscription.findAndCountAll({
    where,
    limit,
    offset,
    include: [
      { model: Customer, as: 'customer', attributes: ['id', 'name', 'company', 'phone'] },
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
    distinct: true,
    order: [['createdAt', 'DESC']],
  });

  return {
    data: rows,
    meta: paginationMeta(count, page, limit),
  };
};

export const getSubscriptionById = async (id) => {
  const sub = await Subscription.findByPk(id, {
    include: [
      { model: Customer, as: 'customer' },
      { model: Plan, as: 'plan' },
      { model: PaymentTerm, as: 'paymentTerm' },
      { model: QuotationTemplate, as: 'template' },
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
  if (!sub) throw new ApiError(404, 'Subscription not found');
  return sub;
};

export const createSubscription = async (data, actorId = null) => {
  const { lines = [], ...subData } = data;

  const customer = await Customer.findByPk(subData.customerId);
  if (!customer) throw new ApiError(404, 'Customer not found');

  const plan = await Plan.findByPk(subData.planId);
  if (!plan) throw new ApiError(404, 'Plan not found');

  const todayStr = new Date().toISOString().split('T')[0];
  if (plan.availableFrom && plan.availableFrom > todayStr) {
    throw new ApiError(422, 'This plan is not yet available for subscription');
  }
  if (plan.availableTo && plan.availableTo < todayStr) {
    throw new ApiError(422, 'This plan has expired and is no longer available');
  }

  const totalQty = lines.reduce((acc, l) => acc + (Number(l.qty) || 0), 0);
  if (totalQty < plan.minQty) {
    throw new ApiError(422, `Total quantity (${totalQty}) must be at least the plan's minimum quantity (${plan.minQty})`, {
      lines: `Total items must be at least ${plan.minQty}`,
    });
  }

  return sequelize.transaction(async (t) => {
    const number = await getNextSequenceNumber('subscription', t);

    const subscription = await Subscription.create(
      {
        ...subData,
        number,
        status: 'draft',
        createdBy: actorId,
      },
      { transaction: t }
    );

    const lineRecords = lines.map((l) => ({
      subscriptionId: subscription.id,
      productId: l.productId,
      variantId: l.variantId || null,
      description: l.description || null,
      qty: l.qty,
      unitPrice: l.unitPrice,
      taxId: l.taxId || null,
      amount: multiplyMoney(l.qty, l.unitPrice),
    }));

    await SubscriptionLine.bulkCreate(lineRecords, { transaction: t });

    await recordAuditLog({
      actorId,
      entity: 'subscription',
      entityId: subscription.id,
      action: 'create',
      before: null,
      after: subscription.toJSON(),
      transaction: t,
    });

    return getSubscriptionById(subscription.id);
  });
};

export const createFromTemplate = async (templateId, customerId, startDate = null, actorId = null) => {
  const template = await QuotationTemplate.findByPk(templateId, {
    include: [{ model: TemplateLine, as: 'lines' }, { model: Plan, as: 'plan' }],
  });
  if (!template) throw new ApiError(404, 'Quotation template not found');

  const customer = await Customer.findByPk(customerId);
  if (!customer) throw new ApiError(404, 'Customer not found');

  const plan = template.plan;
  const today = new Date();
  const validityDays = template.validityDays || 30;
  const validUntil = new Date(today);
  validUntil.setDate(validUntil.getDate() + validityDays);

  return sequelize.transaction(async (t) => {
    const number = await getNextSequenceNumber('subscription', t);

    const subscription = await Subscription.create(
      {
        number,
        customerId,
        planId: template.planId,
        templateId: template.id,
        paymentTermId: template.paymentTermId || 1,
        status: 'quotation',
        startDate: startDate || today.toISOString().split('T')[0],
        quotationValidUntil: validUntil.toISOString().split('T')[0],
        createdBy: actorId,
      },
      { transaction: t }
    );

    const lines = [];
    for (const tl of template.lines) {
      let unitPrice = tl.unitPrice;
      if (unitPrice === null || unitPrice === undefined) {
        const prod = await Product.findByPk(tl.productId);
        let extra = 0;
        if (tl.variantId) {
          const v = await ProductVariant.findByPk(tl.variantId);
          extra = v ? Number(v.extraPrice) : 0;
        }
        unitPrice = Number(prod.salesPrice) + extra;
      }

      lines.push({
        subscriptionId: subscription.id,
        productId: tl.productId,
        variantId: tl.variantId,
        description: null,
        qty: tl.qty,
        unitPrice,
        taxId: tl.taxId,
        amount: multiplyMoney(tl.qty, unitPrice),
      });
    }

    await SubscriptionLine.bulkCreate(lines, { transaction: t });

    await recordAuditLog({
      actorId,
      entity: 'subscription',
      entityId: subscription.id,
      action: 'create_from_template',
      before: null,
      after: subscription.toJSON(),
      transaction: t,
    });

    return getSubscriptionById(subscription.id);
  });
};

export const transitionSubscription = async (id, targetStatus, closeReason = null, actorId = null) => {
  const sub = await getSubscriptionById(id);
  const currentStatus = sub.status;
  const todayStr = new Date().toISOString().split('T')[0];

  // Allowed state machine moves: Draft -> Quotation -> Confirmed -> Active -> Closed
  const allowed = {
    draft: ['quotation', 'closed'],
    quotation: ['confirmed', 'closed'],
    confirmed: ['active', 'closed'],
    active: ['closed'],
    closed: [],
  };

  if (!allowed[currentStatus]?.includes(targetStatus)) {
    throw new ApiError(409, `Illegal status transition from '${currentStatus}' to '${targetStatus}'`);
  }

  const updates = { status: targetStatus };

  if (targetStatus === 'quotation') {
    const template = sub.templateId ? await QuotationTemplate.findByPk(sub.templateId) : null;
    const validityDays = template?.validityDays || 30;
    const d = new Date();
    d.setDate(d.getDate() + validityDays);
    updates.quotationValidUntil = d.toISOString().split('T')[0];
  }

  if (targetStatus === 'confirmed') {
    if (sub.quotationValidUntil && sub.quotationValidUntil < todayStr) {
      throw new ApiError(409, 'Quotation has expired and cannot be confirmed. Please re-quote first.');
    }
    const start = sub.startDate || todayStr;
    if (start <= todayStr) {
      updates.status = 'active';
      updates.nextBillingDate = start;
    }
  }

  if (targetStatus === 'active') {
    updates.nextBillingDate = sub.startDate || todayStr;
  }

  if (targetStatus === 'closed') {
    updates.closedAt = new Date();
    updates.closeReason = closeReason || 'Closed by staff';
  }

  return sequelize.transaction(async (t) => {
    const before = sub.toJSON();
    await sub.update(updates, { transaction: t });

    await recordAuditLog({
      actorId,
      entity: 'subscription',
      entityId: sub.id,
      action: `transition_${targetStatus}`,
      before,
      after: sub.toJSON(),
      transaction: t,
    });

    return getSubscriptionById(sub.id);
  });
};

export const pauseSubscription = async (id, actorId = null) => {
  const sub = await getSubscriptionById(id);
  if (sub.status !== 'active') {
    throw new ApiError(409, 'Only active subscriptions can be paused');
  }
  if (!sub.plan.allowPause) {
    throw new ApiError(403, 'The plan for this subscription does not permit pausing');
  }

  return sequelize.transaction(async (t) => {
    const before = sub.toJSON();
    await sub.update({ isPaused: true }, { transaction: t });
    await recordAuditLog({
      actorId,
      entity: 'subscription',
      entityId: sub.id,
      action: 'pause',
      before,
      after: sub.toJSON(),
      transaction: t,
    });
    return getSubscriptionById(sub.id);
  });
};

export const resumeSubscription = async (id, actorId = null) => {
  const sub = await getSubscriptionById(id);
  if (!sub.isPaused) {
    throw new ApiError(409, 'Subscription is not paused');
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const nextBilling = sub.nextBillingDate && sub.nextBillingDate > todayStr ? sub.nextBillingDate : todayStr;

  return sequelize.transaction(async (t) => {
    const before = sub.toJSON();
    await sub.update({ isPaused: false, nextBillingDate: nextBilling }, { transaction: t });
    await recordAuditLog({
      actorId,
      entity: 'subscription',
      entityId: sub.id,
      action: 'resume',
      before,
      after: sub.toJSON(),
      transaction: t,
    });
    return getSubscriptionById(sub.id);
  });
};

export const renewSubscription = async (id, actorId = null) => {
  const sub = await getSubscriptionById(id);
  if (!sub.plan.allowRenew) {
    throw new ApiError(403, 'The plan for this subscription does not permit renewal');
  }

  const baseDate = sub.expiryDate || new Date().toISOString().split('T')[0];
  const newExpiry = advancePeriod(baseDate, sub.plan.billingPeriod);

  return sequelize.transaction(async (t) => {
    const before = sub.toJSON();
    await sub.update({ expiryDate: newExpiry }, { transaction: t });
    await recordAuditLog({
      actorId,
      entity: 'subscription',
      entityId: sub.id,
      action: 'renew',
      before,
      after: sub.toJSON(),
      transaction: t,
    });
    return getSubscriptionById(sub.id);
  });
};

export const closeSubscription = async (id, reason = 'Cancelled by user', actorId = null) => {
  return transitionSubscription(id, 'closed', reason, actorId);
};
