const rateLimit = require('express-rate-limit');

// Limit to 3 requests per minute per IP for attendance submission
const attendanceLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3,
  message: { success: false, error: 'Too many attendance attempts. Please try again later.', error_code: 'RATE_LIMIT_EXCEEDED' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = attendanceLimiter;
