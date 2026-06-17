const rateLimit = require('express-rate-limit');

const makeMsg = (msg) => ({ success: false, message: msg });

const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 3,
  keyGenerator: (req) => req.body?.phone || req.ip,
  message: makeMsg('Too many OTP requests. Please wait 10 minutes.'),
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => req.body?.phone || req.ip,
  message: makeMsg('Too many login attempts. Please try again in 15 minutes.'),
});

const refreshLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: makeMsg('Too many token refresh requests.'),
});

module.exports = { otpLimiter, loginLimiter, refreshLimiter };
