import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { User, RefreshToken } from '../models/index.js';
import { ROLES } from '../../../shared/constants/index.js';
import { sendStaffInviteEmail } from './mail.service.js';

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

/**
 * List all staff and admin users.
 */
export const listStaff = async ({ page = 1, limit = 20, search }) => {
  const offset = (Number(page) - 1) * Number(limit);
  const where = {
    role: [ROLES.STAFF, ROLES.ADMIN],
  };

  const { count, rows } = await User.findAndCountAll({
    where,
    attributes: ['id', 'email', 'name', 'role', 'isActive', 'lastLoginAt', 'createdAt'],
    order: [['createdAt', 'DESC']],
    limit: Number(limit),
    offset,
  });

  return {
    data: rows,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total: count,
      totalPages: Math.ceil(count / Number(limit)),
    },
  };
};

/**
 * Create a new staff user.
 * Generates an invitation token link or sets a temporary password.
 */
export const createStaff = async ({ email, name, password }) => {
  const normalizedEmail = email.trim().toLowerCase();

  const existing = await User.findOne({ where: { email: normalizedEmail } });
  if (existing) {
    throw new ApiError(422, 'Validation failed', {
      email: 'A user with this email already exists.',
    });
  }

  let passwordHash;
  let rawResetToken = null;

  if (password) {
    passwordHash = await bcrypt.hash(password, 12);
  } else {
    // Generate a temporary random hash; user must use invitation link
    const tempSecret = crypto.randomBytes(32).toString('hex');
    passwordHash = await bcrypt.hash(tempSecret, 12);
    rawResetToken = crypto.randomBytes(32).toString('hex');
  }

  const user = await User.create({
    email: normalizedEmail,
    passwordHash,
    name,
    role: ROLES.STAFF,
    isActive: true,
    resetTokenHash: rawResetToken ? hashToken(rawResetToken) : null,
    resetExpiresAt: rawResetToken
      ? new Date(Date.now() + 48 * 60 * 60 * 1000) // 48-hour invite link
      : null,
  });

  // If invited without password, send invitation email
  if (rawResetToken) {
    const inviteUrl = `${env.opsUrl || 'http://localhost:5174'}/reset-password?token=${rawResetToken}`;
    await sendStaffInviteEmail({
      to: user.email,
      name: user.name,
      inviteUrl,
    });
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
  };
};

/**
 * Update staff details or toggle status.
 */
export const updateStaff = async (id, { name, isActive }) => {
  const staff = await User.findByPk(id);
  if (!staff || staff.role === ROLES.CUSTOMER) {
    throw new ApiError(404, 'Staff member not found');
  }

  if (name !== undefined) staff.name = name;
  if (isActive !== undefined) {
    staff.isActive = Boolean(isActive);
    if (!staff.isActive) {
      // Invalidate active sessions if staff member was deactivated
      await RefreshToken.update({ revokedAt: new Date() }, { where: { userId: staff.id } });
    }
  }

  await staff.save();

  return {
    id: staff.id,
    email: staff.email,
    name: staff.name,
    role: staff.role,
    isActive: staff.isActive,
    updatedAt: staff.updatedAt,
  };
};

/**
 * Deactivates a staff member.
 */
export const deactivateStaff = async (id, adminId) => {
  if (String(id) === String(adminId)) {
    throw new ApiError(400, 'You cannot deactivate your own admin account');
  }

  return updateStaff(id, { isActive: false });
};
