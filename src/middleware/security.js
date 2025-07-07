const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const config = require('../config/config');
const { logger } = require('../utils/logger');

// Rate limiting middleware
const rateLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs, // 15 minutes by default
  max: config.rateLimitMax, // 100 requests per windowMs by default
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later.'
  },
  handler: (req, res, next, options) => {
    logger.warn({
      type: 'rate-limit',
      message: `Rate limit exceeded: ${options.message.message}`,
      ip: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress
    });
    res.status(options.statusCode).json(options.message);
  }
});

// Security middleware setup
const securityMiddleware = (app) => {
  // Set security HTTP headers
  app.use(helmet());
  
  // Rate limiting
  app.use('/api/', rateLimiter);
  
  // Sanitize data
  app.use(mongoSanitize());
  
  // Prevent XSS attacks
  app.use(xss());
  
  // Prevent HTTP Parameter Pollution
  app.use(hpp());
  
  // Set secure cookies in production
  if (config.env === 'production') {
    app.set('trust proxy', 1); // Trust first proxy
  }
  
  return app;
};

module.exports = securityMiddleware; 