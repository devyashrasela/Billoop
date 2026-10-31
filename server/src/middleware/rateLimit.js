import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for sensitive authentication endpoints:
 * /api/auth/login, /api/auth/register, /api/auth/forgot-password
 *
 * Allows 10 requests per 15-minute window per IP.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    res.status(429).json({
      status: 429,
      message: 'Too many attempts, please try again in 15 minutes.',
    });
  },
  skip: (req) => process.env.NODE_ENV === 'test', // bypass rate limits during testing
});
