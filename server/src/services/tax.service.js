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
