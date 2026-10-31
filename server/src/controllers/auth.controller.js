import { env } from '../config/env.js';
import * as authService from '../services/auth.service.js';

const REFRESH_COOKIE_NAME = 'refreshToken';

const getCookieOptions = () => ({
  httpOnly: true,
  secure: env.nodeEnv === 'production',
  sameSite: 'lax',
  maxAge: env.refreshTtlDays * 24 * 60 * 60 * 1000,
  path: '/api/auth',
});

export const register = async (req, res) => {
  const result = await authService.register(req.body);
  res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, getCookieOptions());
  res.status(201).json({
    user: result.user,
    accessToken: result.accessToken,
  });
};

export const login = async (req, res) => {
  const result = await authService.login(req.body);
  res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, getCookieOptions());
  res.status(200).json({
    user: result.user,
    accessToken: result.accessToken,
  });
};

export const refresh = async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE_NAME] || req.body?.refreshToken;
  const result = await authService.refresh(token);
  res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, getCookieOptions());
  res.status(200).json({
    user: result.user,
    accessToken: result.accessToken,
  });
};

export const logout = async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE_NAME] || req.body?.refreshToken;
  await authService.logout(token);
  res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/auth' });
  res.status(200).json({ message: 'Logged out successfully' });
};

export const forgotPassword = async (req, res) => {
  const result = await authService.forgotPassword(req.body);
  res.status(200).json(result);
};

export const resetPassword = async (req, res) => {
  const result = await authService.resetPassword(req.body);
  res.status(200).json(result);
};

export const getMe = async (req, res) => {
  res.status(200).json({ user: req.user });
};
