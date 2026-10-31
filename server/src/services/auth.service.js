import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { sequelize, User, RefreshToken, Customer } from '../models/index.js';
import { ROLES } from '../../../shared/constants/index.js';
import { sendPasswordResetEmail } from './mail.service.js';

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

/**
 * Generates short-lived access token (15m).
 */
export const generateAccessToken = (user, customerId = null) => {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      customerId,
    },
    env.jwt.accessSecret,
    { expiresIn: env.jwt.accessTtl }
  );
};

/**
 * Generates a refresh token pair: raw token for cookie, hashed for DB storage.
 */
export const createRefreshToken = async (userId, familyId = null, transaction = null) => {
  const rawToken = crypto.randomBytes(40).toString('hex');
  const tokenHash = hashToken(rawToken);
  const currentFamilyId = familyId || crypto.randomUUID();
  const expiresAt = new Date(Date.now() + env.refreshTtlDays * 24 * 60 * 60 * 1000);

  await RefreshToken.create(
    {
      userId,
      tokenHash,
      familyId: currentFamilyId,
      expiresAt,
    },
    { transaction }
  );

  return { rawToken, familyId: currentFamilyId };
};

/**
 * Register a new customer via portal.
 */
export const register = async ({
  email,
  password,
  name,
  company,
  phone,
  addressLine1,
  city,
  state,
  postalCode,
  country,
  taxId,
}) => {
  const normalizedEmail = email.trim().toLowerCase();

  const existing = await User.findOne({ where: { email: normalizedEmail } });
  if (existing) {
    throw new ApiError(422, 'Validation failed', {
      email: 'An account with this email address already exists.',
    });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const result = await sequelize.transaction(async (t) => {
    const user = await User.create(
      {
        email: normalizedEmail,
        passwordHash,
        name,
        role: ROLES.CUSTOMER,
        isActive: true,
      },
      { transaction: t }
    );

    const customer = await Customer.create(
      {
        userId: user.id,
        name,
        company,
        phone,
        addressLine1,
        city,
        state,
        postalCode,
        country,
        taxId,
      },
      { transaction: t }
    );

    const { rawToken } = await createRefreshToken(user.id, null, t);
    const accessToken = generateAccessToken(user, customer.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        customerId: customer.id,
      },
      accessToken,
      refreshToken: rawToken,
    };
  });

  return result;
};

/**
 * Authenticate user and issue access + refresh tokens.
 */
export const login = async ({ email, password, client }) => {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({
    where: { email: normalizedEmail },
    include: [{ model: Customer, as: 'customer', attributes: ['id'] }],
  });

  if (!user || !user.isActive) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) {
    throw new ApiError(401, 'Invalid email or password');
  }

  // Client vs Role verification
  if (client === 'ops' && user.role === ROLES.CUSTOMER) {
    throw new ApiError(403, 'Customer accounts cannot access the Ops console.');
  }

  if (client === 'portal' && user.role !== ROLES.CUSTOMER) {
    throw new ApiError(403, 'Staff or admin accounts must log in via the Ops console.');
  }

  const customerId = user.customer ? user.customer.id : null;
  const { rawToken } = await createRefreshToken(user.id);
  const accessToken = generateAccessToken(user, customerId);

  user.lastLoginAt = new Date();
  await user.save();

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      customerId,
    },
    accessToken,
    refreshToken: rawToken,
  };
};

/**
 * Refresh access token using token rotation and token-family reuse detection.
 */
export const refresh = async (rawRefreshToken) => {
  if (!rawRefreshToken) {
    throw new ApiError(401, 'Refresh token is required');
  }

  const tokenHash = hashToken(rawRefreshToken);
  const tokenRecord = await RefreshToken.findOne({ where: { tokenHash } });

  if (!tokenRecord) {
    throw new ApiError(401, 'Invalid refresh token');
  }

  // Token reuse detection: if already revoked, revoke whole token family immediately
  if (tokenRecord.revokedAt) {
    await RefreshToken.update(
      { revokedAt: new Date() },
      { where: { familyId: tokenRecord.familyId } }
    );
    throw new ApiError(401, 'Security alert: Refresh token has been reused. All sessions terminated.');
  }

  if (new Date() > new Date(tokenRecord.expiresAt)) {
    throw new ApiError(401, 'Refresh token expired');
  }

  const user = await User.findByPk(tokenRecord.userId, {
    include: [{ model: Customer, as: 'customer', attributes: ['id'] }],
  });

  if (!user || !user.isActive) {
    throw new ApiError(401, 'Account inactive or deleted');
  }

  // Mark current token revoked and issue successor in the same family
  tokenRecord.revokedAt = new Date();
  await tokenRecord.save();

  const { rawToken: newRefreshToken } = await createRefreshToken(user.id, tokenRecord.familyId);
  const customerId = user.customer ? user.customer.id : null;
  const accessToken = generateAccessToken(user, customerId);

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      customerId,
    },
    accessToken,
    refreshToken: newRefreshToken,
  };
};

/**
 * Logout and revoke refresh token.
 */
export const logout = async (rawRefreshToken) => {
  if (rawRefreshToken) {
    const tokenHash = hashToken(rawRefreshToken);
    await RefreshToken.update({ revokedAt: new Date() }, { where: { tokenHash } });
  }
  return { success: true };
};

/**
 * Request password reset link.
 */
export const forgotPassword = async ({ email, client }) => {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ where: { email: normalizedEmail, isActive: true } });

  // Always return success even if user not found to avoid account enumeration
  if (!user) {
    return {
      message: 'If an account matches that email address, a password reset link has been sent.',
    };
  }

  const rawResetToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawResetToken);
  const expiresAt = new Date(Date.now() + env.resetTtlMinutes * 60 * 1000);

  user.resetTokenHash = tokenHash;
  user.resetExpiresAt = expiresAt;
  await user.save();

  // Determine portal vs ops frontend URL based on user role or client
  const isOpsUser = user.role === ROLES.ADMIN || user.role === ROLES.STAFF || client === 'ops';
  const baseUrl = isOpsUser ? env.opsUrl || 'http://localhost:5174' : env.portalUrl || 'http://localhost:5173';
  const resetUrl = `${baseUrl}/reset-password?token=${rawResetToken}`;

  await sendPasswordResetEmail({
    to: user.email,
    name: user.name,
    resetUrl,
  });

  return {
    message: 'If an account matches that email address, a password reset link has been sent.',
  };
};

/**
 * Reset password using valid one-time token.
 */
export const resetPassword = async ({ token, password }) => {
  const tokenHash = hashToken(token);
  const user = await User.findOne({ where: { resetTokenHash: tokenHash } });

  if (!user || !user.resetExpiresAt || new Date() > new Date(user.resetExpiresAt)) {
    throw new ApiError(400, 'Password reset link is invalid or has expired.');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  user.passwordHash = passwordHash;
  user.resetTokenHash = null;
  user.resetExpiresAt = null;
  await user.save();

  // Invalidate all active refresh tokens for this user
  await RefreshToken.update({ revokedAt: new Date() }, { where: { userId: user.id } });

  return { message: 'Password has been successfully updated. You may now log in.' };
};
