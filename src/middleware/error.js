const { logger } = require('../utils/logger');
const config = require('../config/config');

// Custom error class
class ErrorResponse extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

// Error handler middleware
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  
  // Log error
  logger.error({
    type: 'error',
    message: err.message,
    stack: err.stack,
    statusCode: err.statusCode || 500,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress
  });

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = new ErrorResponse(message, 400);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `Duplicate field value entered for ${field}. Please use another value.`;
    error = new ErrorResponse(message, 400);
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = `Resource not found with id of ${err.value}`;
    error = new ErrorResponse(message, 404);
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = new ErrorResponse('Invalid token. Please log in again.', 401);
  }
  
  if (err.name === 'TokenExpiredError') {
    error = new ErrorResponse('Token expired. Please log in again.', 401);
  }

  // Send response
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Server Error',
    // Only include stack trace in development mode
    ...(config.env === 'development' && { stack: err.stack })
  });
};

module.exports = {
  ErrorResponse,
  errorHandler
}; 