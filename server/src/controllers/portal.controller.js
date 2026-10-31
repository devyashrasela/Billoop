import { Op } from 'sequelize';
import { Customer, User, Subscription, Plan, Invoice, PaymentTerm, SubscriptionLine, Product, ProductVariant, Tax, Payment } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import * as subscriptionService from '../services/subscription.service.js';
import * as invoiceService from '../services/invoice.service.js';
import { renderInvoiceHtml } from '../services/invoicePrint.service.js';
import { paginate, paginationMeta } from '../utils/pagination.js';

/**
 * Helper to ensure req.user has an associated customerId
 */
const getCustomerId = (req) => {
  const customerId = req.user?.customerId;
  if (!customerId) {
    throw new ApiError(403, 'Your user account is not linked to a customer profile');
  }
  return customerId;
};

// ── Profile ──
export const getProfile = async (req, res, next) => {
  try {
    const customerId = getCustomerId(req);
    const customer = await Customer.findByPk(customerId, {
      include: [{ model: User, as: 'user', attributes: ['id', 'email', 'name', 'role'] }],
    });

    if (!customer) {
      throw new ApiError(404, 'Customer profile not found');
    }

    res.json(customer);
  } catch (err) {
    next(err);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const customerId = getCustomerId(req);
    const customer = await Customer.findByPk(customerId);

    if (!customer) {
      throw new ApiError(404, 'Customer profile not found');
    }

    const {
      name,
      company,
      phone,
      taxId,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
    } = req.body;

    await customer.update({
      name: name ?? customer.name,
      company: company ?? customer.company,
      phone: phone ?? customer.phone,
      taxId: taxId ?? customer.taxId,
      addressLine1: addressLine1 ?? customer.addressLine1,
      addressLine2: addressLine2 ?? customer.addressLine2,
      city: city ?? customer.city,
      state: state ?? customer.state,
      postalCode: postalCode ?? customer.postalCode,
      country: country ?? customer.country,
    });

    if (name && req.user.id) {
      await User.update({ name }, { where: { id: req.user.id } });
    }

    const updated = await Customer.findByPk(customerId, {
      include: [{ model: User, as: 'user', attributes: ['id', 'email', 'name', 'role'] }],
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
};

// ── Subscriptions ──
export const listSubscriptions = async (req, res, next) => {
  try {
    const customerId = getCustomerId(req);
    const { page, limit, offset } = paginate(req.query);

    const where = { customerId };
    if (req.query.status) {
      where.status = req.query.status;
    }

    const { rows, count } = await Subscription.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        { model: Plan, as: 'plan' },
        { model: PaymentTerm, as: 'paymentTerm' },
      ],
    });

    res.json({
      data: rows,
      meta: paginationMeta(count, page, limit),
    });
  } catch (err) {
    next(err);
  }
};

export const getSubscription = async (req, res, next) => {
  try {
    const customerId = getCustomerId(req);
    const sub = await subscriptionService.getSubscriptionById(req.params.id);

    if (String(sub.customerId) !== String(customerId)) {
      throw new ApiError(404, 'Subscription not found');
    }

    res.json(sub);
  } catch (err) {
    next(err);
  }
};

export const pauseSubscription = async (req, res, next) => {
  try {
    const customerId = getCustomerId(req);
    const sub = await subscriptionService.getSubscriptionById(req.params.id);

    if (String(sub.customerId) !== String(customerId)) {
      throw new ApiError(404, 'Subscription not found');
    }

    const updated = await subscriptionService.pauseSubscription(sub.id, req.user.id);
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

export const resumeSubscription = async (req, res, next) => {
  try {
    const customerId = getCustomerId(req);
    const sub = await subscriptionService.getSubscriptionById(req.params.id);

    if (String(sub.customerId) !== String(customerId)) {
      throw new ApiError(404, 'Subscription not found');
    }

    const updated = await subscriptionService.resumeSubscription(sub.id, req.user.id);
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

export const renewSubscription = async (req, res, next) => {
  try {
    const customerId = getCustomerId(req);
    const sub = await subscriptionService.getSubscriptionById(req.params.id);

    if (String(sub.customerId) !== String(customerId)) {
      throw new ApiError(404, 'Subscription not found');
    }

    const updated = await subscriptionService.renewSubscription(sub.id, req.user.id);
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

export const closeSubscription = async (req, res, next) => {
  try {
    const customerId = getCustomerId(req);
    const sub = await subscriptionService.getSubscriptionById(req.params.id);

    if (String(sub.customerId) !== String(customerId)) {
      throw new ApiError(404, 'Subscription not found');
    }

    if (!sub.plan.allowEarlyClose) {
      throw new ApiError(403, 'Your current plan does not permit self-service early cancellation. Please contact support.');
    }

    const reason = req.body?.reason || 'Cancelled by customer via portal';
    const updated = await subscriptionService.closeSubscription(sub.id, reason, req.user.id);
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

// ── Invoices ──
export const listInvoices = async (req, res, next) => {
  try {
    const customerId = getCustomerId(req);
    const { page, limit, offset } = paginate(req.query);

    const where = { customerId };
    if (req.query.status) {
      where.status = req.query.status;
    }

    const { rows, count } = await Invoice.findAndCountAll({
      where,
      limit,
      offset,
      order: [['issueDate', 'DESC'], ['id', 'DESC']],
      include: [
        { model: Subscription, as: 'subscription', attributes: ['id', 'number'] },
        { model: Payment, as: 'payments', attributes: ['id', 'amount', 'paidOn', 'method'] },
      ],
    });

    res.json({
      data: rows,
      meta: paginationMeta(count, page, limit),
    });
  } catch (err) {
    next(err);
  }
};

export const getInvoice = async (req, res, next) => {
  try {
    const customerId = getCustomerId(req);
    const invoice = await invoiceService.getInvoiceById(req.params.id);

    if (String(invoice.customerId) !== String(customerId)) {
      throw new ApiError(404, 'Invoice not found');
    }

    res.json(invoice);
  } catch (err) {
    next(err);
  }
};

export const printInvoice = async (req, res, next) => {
  try {
    const customerId = getCustomerId(req);
    const invoice = await invoiceService.getInvoiceById(req.params.id);

    if (String(invoice.customerId) !== String(customerId)) {
      throw new ApiError(404, 'Invoice not found');
    }

    const html = renderInvoiceHtml(invoice);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (err) {
    next(err);
  }
};

// ── Plans Catalog (Public/Customer) ──
export const listPlans = async (req, res, next) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];

    const plans = await Plan.findAll({
      where: {
        isActive: true,
        [Op.and]: [
          {
            [Op.or]: [
              { availableFrom: null },
              { availableFrom: { [Op.lte]: todayStr } },
            ],
          },
          {
            [Op.or]: [
              { availableTo: null },
              { availableTo: { [Op.gte]: todayStr } },
            ],
          },
        ],
      },
      order: [['price', 'ASC']],
    });

    res.json({ data: plans });
  } catch (err) {
    next(err);
  }
};

