import { Op } from 'sequelize';
import { sequelize } from '../config/db.js';
import { Discount } from '../models/Discount.js';
import { Product } from '../models/Product.js';
import { DiscountProduct } from '../models/DiscountProduct.js';
import { ApiError } from '../utils/ApiError.js';
import { paginate, paginationMeta } from '../utils/pagination.js';

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

  return sequelize.transaction(async (t) => {
    const discount = await Discount.create(discountData, { transaction: t });

    if (discount.scope === 'product' && productIds.length > 0) {
      const records = productIds.map((productId) => ({
        discountId: discount.id,
        productId,
      }));
      await DiscountProduct.bulkCreate(records, { transaction: t });
    }

    return getDiscountById(discount.id);
  });
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

  return sequelize.transaction(async (t) => {
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

    return getDiscountById(id);
  });
};

export const deleteDiscount = async (id) => {
  const discount = await getDiscountById(id);
  await discount.destroy(); // Soft delete
  return { id, message: 'Discount deleted successfully' };
};
