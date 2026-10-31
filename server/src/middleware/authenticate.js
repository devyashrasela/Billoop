import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { User, Customer } from '../models/index.js';

/**
 * Authentication middleware.
 * Verifies JWT bearer token from Authorization header and loads the active user.
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'Authentication required');
    }

    const token = authHeader.split(' ')[1];
    let decoded;

    try {
      decoded = jwt.verify(token, env.jwt.accessSecret);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw new ApiError(401, 'Token expired');
      }
      throw new ApiError(401, 'Invalid authentication token');
    }

    const user = await User.findByPk(decoded.sub, {
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'name', 'company'],
        },
      ],
    });

    if (!user || !user.isActive) {
      throw new ApiError(401, 'User account is inactive or no longer exists');
    }

    // Attach verified user and scoped customerId to req.user
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      customerId: user.customer ? user.customer.id : null,
    };

    next();
  } catch (err) {
    next(err);
  }
};
