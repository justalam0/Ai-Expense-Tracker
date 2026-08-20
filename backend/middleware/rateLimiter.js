const rateLimit = require('express-rate-limit');

// 1. Login Limiter: 3 requests per 15 minutes
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: { error: 'Too many login attempts, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

// 2. Register Limiter: 3 requests per 1 hour
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { error: 'Too many registration attempts, please try again after 1 hour' },
  standardHeaders: true,
  legacyHeaders: false,
});

// 3. Forgot Password Limiter: 3 requests per 1 hour
const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { error: 'Too many password reset requests, please try again after 1 hour' },
  standardHeaders: true,
  legacyHeaders: false,
});

// 4. Normal API Limiter: 100 requests per 10 minutes
const normalApiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// 5. AI API Limiter: 10 requests per 10 minutes
const aiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  message: { error: 'AI rate limit exceeded. Please try again after 10 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

// 6. Report Limiter: 5 requests per 30 minutes
const reportLimiter = rateLimit({
  windowMs: 30 * 60 * 1000,
  max: 5,
  message: { error: 'Report generation limit exceeded. Please try again after 30 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  loginLimiter,
  registerLimiter,
  forgotPasswordLimiter,
  normalApiLimiter,
  aiLimiter,
  reportLimiter,
};
