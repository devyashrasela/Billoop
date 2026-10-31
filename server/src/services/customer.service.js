import { Op } from 'sequelize';
import bcrypt from 'bcrypt';
import crypto from 'node:crypto';
import { sequelize } from '../config/db.js';
import { Customer } from '../models/Customer.js';
import { User } from '../models/User.js';
import { Subscription } from '../models/Subscription.js';
import { Plan } from '../models/Plan.js';
import { ApiError } from '../utils/ApiError.js';
import { paginate, paginationMeta } from '../utils/pagination.js';

export const listCustomers = async (query = {}) => {
  const { page, limit, offset } = paginate(query);
  const where = {};

  if (query.q) {
    where[Op.or] = [
      { name: { [Op.like]: `%${query.q}%` } },
      { company: { [Op.like]: `%${query.q}%` } },
      { phone: { [Op.like]: `%${query.q}%` } },
      { '$user.email$': { [Op.like]: `%${query.q}%` } },
    ];
  }

  const { rows, count } = await Customer.findAndCountAll({
    where,
    limit,
    offset,
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'email', 'isActive', 'lastLoginAt'],
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

export const getCustomerById = async (id) => {
  const customer = await Customer.findByPk(id, {
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'email', 'isActive', 'lastLoginAt'],
      },
      {
        model: Subscription,
        as: 'subscriptions',
        include: [{ model: Plan, as: 'plan' }],
      },
    ],
  });
  if (!customer) throw new ApiError(404, 'Customer not found');
  return customer;
};

export const createCustomer = async (data) => {
  const { email, ...customerData } = data;

  const existingUser = await User.findOne({ where: { email: email.toLowerCase() } });
  if (existingUser) {
    throw new ApiError(409, 'A user with this email already exists', {
      email: 'Email address is already registered',
    });
  }

  const createdCustomer = await sequelize.transaction(async (t) => {
    // Generate secure random temp password for customer account
    const tempPassword = `Brightloop@${crypto.randomBytes(4).toString('hex')}1`;
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    const user = await User.create(
      {
        email: email.toLowerCase(),
        passwordHash,
        role: 'customer',
        name: customerData.name,
        isActive: true,
      },
      { transaction: t }
    );

    const customer = await Customer.create(
      {
        ...customerData,
        userId: user.id,
      },
      { transaction: t }
    );

    return customer;
  });

  return getCustomerById(createdCustomer.id);
};

export const updateCustomer = async (id, data) => {
  const customer = await getCustomerById(id);

  await sequelize.transaction(async (t) => {
    await customer.update(data, { transaction: t });

    if (data.name && customer.user) {
      await User.update(
        { name: data.name },
        { where: { id: customer.userId }, transaction: t }
      );
    }
  });

  return getCustomerById(id);
};

