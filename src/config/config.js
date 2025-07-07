const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Environment validation function
const validateEnv = () => {
  const requiredEnvVars = [
    'PORT', 
    'MONGO_URI', 
    'JWT_SECRET', 
    'JWT_EXPIRE'
  ];
  
  const missingVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
};

// Validate environment variables
validateEnv();

// Parse CORS origin configuration
const parseCorsOrigin = (corsValue) => {
  if (!corsValue) return 'http://localhost:5173';
  if (corsValue === '*') return '*';
  
  // Check if it's a comma-separated list
  if (corsValue.includes(',')) {
    return corsValue.split(',').map(origin => origin.trim());
  }
  
  return corsValue;
};

// Default values for optional configs
const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5001', 10),
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpire: process.env.JWT_EXPIRE || '7d',
  mongoPoolSize: parseInt(process.env.MONGO_POOL_SIZE || '10', 10),
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  corsOrigin: parseCorsOrigin(process.env.CORS_ORIGIN),
  adminEmail: process.env.ADMIN_EMAIL || 'admin@leopay.mockello.com',
  adminPassword: process.env.ADMIN_PASSWORD || 'admin123',
  adminName: process.env.ADMIN_NAME || 'Admin',
  logLevel: process.env.LOG_LEVEL || 'info',
  enableHttps: process.env.ENABLE_HTTPS === 'true'
};

module.exports = config; 