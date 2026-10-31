import { Op } from 'sequelize';
import { Tax } from '../models/Tax.js';
import { ApiError } from '../utils/ApiError.js';
import { paginate, paginationMeta } from '../utils/pagination.js';

export const listTaxes = async (query = {}) => {
  const { page, limit, offset } = paginate(query);
  const where = {};

  if (query.isActive !== undefined && query.isActive !== '') {
    where.isActive = query.isActive === 'true' || query.isActive === true;
  }

  if (query.q) {
    where.name = { [Op.like]: `%${query.q}%` };
  }

  const { rows, count } = await Tax.findAndCountAll({
    where,
    limit,
    offset,
    order: [['createdAt', 'DESC']],
  });

  return {
    data: rows,
    meta: paginationMeta(count, page, limit),
  };
};

export const getTaxById = async (id) => {
  const tax = await Tax.findByPk(id);
  if (!tax) throw new ApiError(404, 'Tax not found');
  return tax;
};

export const createTax = async (data) => {
  const existing = await Tax.findOne({ where: { name: data.name } });
  if (existing) {
    throw new ApiError(409, 'A tax with this name already exists', {
      name: 'Tax name must be unique',
    });
  }
  return Tax.create(data);
};

export const updateTax = async (id, data) => {
  const tax = await getTaxById(id);

  if (data.name && data.name !== tax.name) {
    const existing = await Tax.findOne({
      where: { name: data.name, id: { [Op.ne]: id } },
    });
    if (existing) {
      throw new ApiError(409, 'A tax with this name already exists', {
        name: 'Tax name must be unique',
      });
    }
  }

  return tax.update(data);
};

export const deleteTax = async (id) => {
  const tax = await getTaxById(id);
  // Paranoid soft delete
  await tax.destroy();
  return { id, message: 'Tax deleted successfully' };
};

import { calculateTax, addMoney } from '../utils/money.js';

/**
 * Computes tax for a single line item.
 *
 * @param {Object} params
 * @param {number|string} params.amount - Base pre-tax amount (unitPrice * qty)
 * @param {number|string} [params.discount=0] - Discount amount applied to this line
 * @param {Object} [params.tax] - Tax model instance or object { id, rate, type }
 * @param {number} [params.qty=1]
 * @returns {{ taxAmount: number, taxRate: number, taxId: number|null }}
 */
export const computeLineTax = ({ amount, discount = 0, tax, qty = 1 }) => {
  if (!tax || Number(tax.rate) <= 0) {
    return {
      taxAmount: 0.0,
      taxRate: 0.0,
      taxId: tax?.id || null,
    };
  }

  const rate = Number(tax.rate);
  const type = tax.type || 'percentage';

  const taxAmount = calculateTax({
    amount,
    discount,
    rate,
    type,
    qty,
  });

  return {
    taxAmount,
    taxRate: rate,
    taxId: tax.id,
  };
};

/**
 * Computes total tax for an array of lines.
 *
 * @param {Array<{ taxAmount: number }>} lines
 * @returns {number} Sum of all line tax amounts
 */
export const sumLineTaxes = (lines = []) => {
  const taxAmounts = lines.map((line) => line.taxAmount || 0);
  return addMoney(...taxAmounts);
};
