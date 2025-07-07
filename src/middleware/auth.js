const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/config');
const { ErrorResponse } = require('./error');
const { logger } = require('../utils/logger');

// Protect routes
exports.protect = async (req, res, next) => {
  let token;

  // Check if token exists in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    // Check if token exists in cookies
    token = req.cookies.token;
  }

  // Check if token exists
  if (!token) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, config.jwtSecret);

    // Add expiration check
    const currentTime = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < currentTime) {
      return next(new ErrorResponse('Token expired. Please log in again.', 401));
    }

    // Get user from token
    const user = await User.findById(decoded.id);

    if (!user) {
      return next(new ErrorResponse('User no longer exists', 401));
    }

    // Add user to request
    req.user = user;
    next();
  } catch (error) {
    logger.error({
      type: 'auth-error',
      message: error.message,
      stack: error.stack,
      endpoint: req.originalUrl
    });
    
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ErrorResponse('User not found in request', 500));
    }
    
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(
          `User role ${req.user.role} is not authorized to access this route`,
          403
        )
      );
    }
    
    next();
  };
}; 