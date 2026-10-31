import { Op } from 'sequelize';
import { Plan } from '../models/Plan.js';
import { ApiError } from '../utils/ApiError.js';
import { paginate, paginationMeta } from '../utils/pagination.js';

export const listPlans = async (query = {}) => {
  const { page, limit, offset } = paginate(query);
  const where = {};

  if (query.billingPeriod) {
    where.billingPeriod = query.billingPeriod;
  }

  if (query.isActive !== undefined && query.isActive !== '') {
    where.isActive = query.isActive === 'true' || query.isActive === true;
  }

  if (query.q) {
    where.name = { [Op.like]: `%${query.q}%` };
  }

  const { rows, count } = await Plan.findAndCountAll({
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

export const getPlanById = async (id) => {
  const plan = await Plan.findByPk(id);
  if (!plan) throw new ApiError(404, 'Plan not found');
  return plan;
};

export const createPlan = async (data) => {
  const existing = await Plan.findOne({ where: { name: data.name } });
  if (existing) {
    throw new ApiError(409, 'A plan with this name already exists', {
      name: 'Plan name must be unique',
    });
  }

  if (data.availableFrom && data.availableTo && data.availableFrom > data.availableTo) {
    throw new ApiError(422, 'Available From date cannot be after Available To date', {
      availableFrom: 'Must be before or equal to Available To',
    });
  }

  return Plan.create(data);
};

export const updatePlan = async (id, data) => {
  const plan = await getPlanById(id);

  if (data.name && data.name !== plan.name) {
    const existing = await Plan.findOne({
      where: { name: data.name, id: { [Op.ne]: id } },
    });
    if (existing) {
      throw new ApiError(409, 'A plan with this name already exists', {
        name: 'Plan name must be unique',
      });
    }
  }

  const from = data.availableFrom !== undefined ? data.availableFrom : plan.availableFrom;
  const to = data.availableTo !== undefined ? data.availableTo : plan.availableTo;
  if (from && to && from > to) {
    throw new ApiError(422, 'Available From date cannot be after Available To date', {
      availableFrom: 'Must be before or equal to Available To',
    });
  }

  return plan.update(data);
};

export const deletePlan = async (id) => {
  const plan = await getPlanById(id);
  await plan.destroy(); // Soft delete
  return { id, message: 'Plan deleted successfully' };
};
