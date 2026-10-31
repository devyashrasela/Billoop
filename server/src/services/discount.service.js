import { Op } from 'sequelize';
import { sequelize } from '../config/db.js';
import { Discount } from '../models/Discount.js';
import { Product } from '../models/Product.js';
import { DiscountProduct } from '../models/DiscountProduct.js';
import { SubscriptionDiscount } from '../models/SubscriptionDiscount.js';
import { ApiError } from '../utils/ApiError.js';
import { paginate, paginationMeta } from '../utils/pagination.js';
import { calculateDiscount, addMoney, subtractMoney } from '../utils/money.js';

export const listDiscounts = async (query = {}) => {
  const { page, limit, offset } = paginate(query);
  const where = {};

  if (query.scope) {
    where.scope = query.scope;
  }

  if (query.isActive !== undefined && query.isActive !== '') {
    where.isActive = query.isActive === 'true' || query.isActive === true;
  }

  if (query.q) {
    where[Op.or] = [
      { name: { [Op.like]: `%${query.q}%` } },
      { code: { [Op.like]: `%${query.q}%` } },
    ];
  }

  const { rows, count } = await Discount.findAndCountAll({
    where,
    limit,
    offset,
    include: [
      {
        model: Product,
        as: 'products',
        through: { attributes: [] },
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

export const getDiscountById = async (id) => {
  const discount = await Discount.findByPk(id, {
    include: [
      {
        model: Product,
        as: 'products',
        through: { attributes: [] },
      },
    ],
  });
  if (!discount) throw new ApiError(404, 'Discount not found');
  return discount;
};

export const createDiscount = async (data) => {
  const { productIds = [], ...discountData } = data;

  if (discountData.code) {
    const existingCode = await Discount.findOne({ where: { code: discountData.code } });
    if (existingCode) {
      throw new ApiError(409, 'A discount with this coupon code already exists', {
        code: 'Discount code must be unique',
      });
    }
  }

  if (discountData.startDate > discountData.endDate) {
    throw new ApiError(422, 'Start date cannot be after end date', {
      startDate: 'Start date must be before or equal to end date',
    });
  }

  const createdDiscount = await sequelize.transaction(async (t) => {
    const discount = await Discount.create(discountData, { transaction: t });

    if (discount.scope === 'product' && productIds.length > 0) {
      const records = productIds.map((productId) => ({
        discountId: discount.id,
        productId,
      }));
      await DiscountProduct.bulkCreate(records, { transaction: t });
    }

    return discount;
  });

  return getDiscountById(createdDiscount.id);
};

export const updateDiscount = async (id, data) => {
  const discount = await getDiscountById(id);
  const { productIds, ...discountData } = data;

  if (discountData.code && discountData.code !== discount.code) {
    const existingCode = await Discount.findOne({
      where: { code: discountData.code, id: { [Op.ne]: id } },
    });
    if (existingCode) {
      throw new ApiError(409, 'A discount with this coupon code already exists', {
        code: 'Discount code must be unique',
      });
    }
  }

  const start = discountData.startDate || discount.startDate;
  const end = discountData.endDate || discount.endDate;
  if (start > end) {
    throw new ApiError(422, 'Start date cannot be after end date', {
      startDate: 'Start date must be before or equal to end date',
    });
  }

  await sequelize.transaction(async (t) => {
    await discount.update(discountData, { transaction: t });

    if (productIds !== undefined) {
      await DiscountProduct.destroy({ where: { discountId: id }, transaction: t });
      if (discount.scope === 'product' && productIds.length > 0) {
        const records = productIds.map((productId) => ({
          discountId: id,
          productId,
        }));
        await DiscountProduct.bulkCreate(records, { transaction: t });
      }
    }
  });

  return getDiscountById(id);
};

export const deleteDiscount = async (id) => {
  const discount = await getDiscountById(id);
  await discount.destroy(); // Soft delete
  return { id, message: 'Discount deleted successfully' };
};

/**
 * Checks if a discount is within active date range and usage limits.
 *
 * @param {Discount} discount
 * @param {string|Date} todayStr - YYYY-MM-DD
 * @returns {boolean}
 */
export const isDiscountActive = (discount, todayStr) => {
  if (!discount || !discount.isActive) return false;

  const today = new Date(todayStr);
  const start = new Date(discount.startDate);
  const end = new Date(discount.endDate);

  if (today < start || today > end) return false;

  if (discount.usageLimit !== null && discount.usageLimit !== undefined) {
    if (discount.usedCount >= discount.usageLimit) return false;
  }

  return true;
};

/**
 * Evaluates and applies eligible discounts for a subscription's billing cycle.
 *
 * @param {Object} params
 * @param {import('../models/Subscription.js').Subscription} params.subscription
 * @param {Array<Object>} params.lines - Prepared subscription lines [{ productId, unitPrice, qty, amount }]
 * @param {string} params.todayStr - YYYY-MM-DD
 * @param {import('sequelize').Transaction} params.transaction
 * @returns {Promise<{ linesWithDiscounts: Array<Object>, totalDiscount: number, appliedDiscounts: Array<Discount> }>}
 */
export const applyDiscounts = async ({ subscription, lines, todayStr, transaction }) => {
  const subtotal = lines.reduce((acc, l) => addMoney(acc, l.amount), 0);
  const totalQty = lines.reduce((acc, l) => acc + (Number(l.qty) || 1), 0);

  // 1. Fetch subscription-attached discounts
  const subDiscounts = await Discount.findAll({
    include: [
      {
        model: SubscriptionDiscount,
        as: 'subscriptionDiscounts',
        where: { subscriptionId: subscription.id },
      },
    ],
    where: {
      scope: 'subscription',
      isActive: true,
      startDate: { [Op.lte]: todayStr },
      endDate: { [Op.gte]: todayStr },
    },
    transaction,
  });

  // 2. Fetch product-scoped discounts matching any line items
  const productIds = lines.map((l) => l.productId);
  const productDiscounts = await Discount.findAll({
    include: [
      {
        model: DiscountProduct,
        as: 'discountProducts',
        where: { productId: { [Op.in]: productIds } },
      },
    ],
    where: {
      scope: 'product',
      isActive: true,
      startDate: { [Op.lte]: todayStr },
      endDate: { [Op.gte]: todayStr },
    },
    transaction,
  });

  const allCandidateDiscounts = [...subDiscounts, ...productDiscounts];
  const appliedDiscounts = [];

  // Deep clone line objects to attach discount amounts
  const updatedLines = lines.map((l) => ({
    ...l,
    discountAmount: 0.0,
  }));

  // A. Process Product-Scoped Discounts first
  for (const disc of productDiscounts) {
    if (!isDiscountActive(disc, todayStr)) continue;

    // Filter matching lines for this product discount
    const matchingProductIds = (disc.discountProducts || []).map((dp) => dp.productId);
    const matchingLines = updatedLines.filter((l) => matchingProductIds.includes(l.productId));

    const matchingSubtotal = matchingLines.reduce((acc, l) => addMoney(acc, l.amount), 0);
    const matchingQty = matchingLines.reduce((acc, l) => acc + (Number(l.qty) || 1), 0);

    // Validate minimum purchase and min qty requirements
    if (disc.minPurchase && matchingSubtotal < Number(disc.minPurchase)) continue;
    if (disc.minQty && matchingQty < Number(disc.minQty)) continue;

    // Attempt atomic usage increment with concurrency guard
    const claimed = await claimDiscountUsage(disc.id, disc.usageLimit, transaction);
    if (!claimed) continue; // exhausted concurrently

    appliedDiscounts.push(disc);

    // Apply to matching lines
    for (const line of matchingLines) {
      const remainingBase = subtractMoney(line.amount, line.discountAmount);
      if (remainingBase <= 0) continue;

      const saving = calculateDiscount({
        baseAmount: remainingBase,
        value: disc.value,
        type: disc.type,
      });

      line.discountAmount = addMoney(line.discountAmount, saving);
    }
  }

  // B. Process Subscription-Scoped Discounts
  for (const disc of subDiscounts) {
    if (!isDiscountActive(disc, todayStr)) continue;

    if (disc.minPurchase && subtotal < Number(disc.minPurchase)) continue;
    if (disc.minQty && totalQty < Number(disc.minQty)) continue;

    const claimed = await claimDiscountUsage(disc.id, disc.usageLimit, transaction);
    if (!claimed) continue;

    appliedDiscounts.push(disc);

    // Distribute subscription discount across lines proportionally or sequentially up to cap
    let remainingDiscountToDistribute = calculateDiscount({
      baseAmount: subtotal,
      value: disc.value,
      type: disc.type,
    });

    for (const line of updatedLines) {
      if (remainingDiscountToDistribute <= 0) break;

      const remainingLineBase = subtractMoney(line.amount, line.discountAmount);
      if (remainingLineBase <= 0) continue;

      const toDeduct = Math.min(remainingLineBase, remainingDiscountToDistribute);
      line.discountAmount = addMoney(line.discountAmount, toDeduct);
      remainingDiscountToDistribute = subtractMoney(remainingDiscountToDistribute, toDeduct);
    }
  }

  const totalDiscount = updatedLines.reduce((acc, l) => addMoney(acc, l.discountAmount), 0);

  return {
    linesWithDiscounts: updatedLines,
    totalDiscount,
    appliedDiscounts,
  };
};

/**
 * Concurrency-safe atomic discount usage claim.
 * Executes: UPDATE discounts SET usedCount = usedCount + 1 WHERE id = ? AND (usageLimit IS NULL OR usedCount < usageLimit)
 *
 * @param {number} discountId
 * @param {number|null} usageLimit
 * @param {import('sequelize').Transaction} transaction
 * @returns {Promise<boolean>} True if successfully claimed, false if exhausted
 */
export const claimDiscountUsage = async (discountId, usageLimit, transaction) => {
  const where = { id: discountId };
  if (usageLimit !== null && usageLimit !== undefined) {
    where.usedCount = { [Op.lt]: usageLimit };
  }

  const [affectedRows] = await Discount.update(
    { usedCount: Discount.sequelize.literal('usedCount + 1') },
    { where, transaction }
  );

  return affectedRows > 0;
};
