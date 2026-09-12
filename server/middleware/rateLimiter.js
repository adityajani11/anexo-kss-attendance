const rateLimit = require('express-rate-limit');

// Login rate limiter middleware
const loginLimiter = rateLimit({
  windowMs: (4 * 60 * 1000) + 55 * 1000, // 4 minutes 55 seconds
  max: 5, // Limit each IP to 5 requests per `windowMs`
  message: {
    message: "Too many login attempts, please try again after 10 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { loginLimiter };
