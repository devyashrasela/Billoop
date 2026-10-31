import { Op } from 'sequelize';
import { PaymentTerm } from '../models/PaymentTerm.js';
import { ApiError } from '../utils/ApiError.js';
import { paginate, paginationMeta } from '../utils/pagination.js';

export const listPaymentTerms = async (query = {}) => {
  const { page, limit, offset } = paginate(query);
  const where = {};

  if (query.q) {
    where.name = { [Op.like]: `%${query.q}%` };
  }

  const { rows, count } = await PaymentTerm.findAndCountAll({
    where,
    limit,
    offset,
    order: [['dueDays', 'ASC']],
  });

  return {
    data: rows,
    meta: paginationMeta(count, page, limit),
  };
};

export const getPaymentTermById = async (id) => {
  const term = await PaymentTerm.findByPk(id);
  if (!term) throw new ApiError(404, 'Payment term not found');
  return term;
};

export const createPaymentTerm = async (data) => {
  const existing = await PaymentTerm.findOne({ where: { name: data.name } });
  if (existing) {
    throw new ApiError(409, 'Payment term with this name already exists', {
      name: 'Name must be unique',
    });
  }
  return PaymentTerm.create(data);
};

export const updatePaymentTerm = async (id, data) => {
  const term = await getPaymentTermById(id);

  if (data.name && data.name !== term.name) {
    const existing = await PaymentTerm.findOne({
      where: { name: data.name, id: { [Op.ne]: id } },
    });
    if (existing) {
      throw new ApiError(409, 'Payment term with this name already exists', {
        name: 'Name must be unique',
      });
    }
  }

  return term.update(data);
};

export const deletePaymentTerm = async (id) => {
  const term = await getPaymentTermById(id);
  await term.destroy();
  return { id, message: 'Payment term deleted successfully' };
};
