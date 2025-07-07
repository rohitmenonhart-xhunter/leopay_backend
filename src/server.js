const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Import utilities and config
const config = require('./config/config');
const { logger, requestLogger } = require('./utils/logger');
const connectDB = require('./utils/database');
const securityMiddleware = require('./middleware/security');
const { errorHandler } = require('./middleware/error');

// Import routes
const authRoutes = require('./routes/auth');
const leadRoutes = require('./routes/leads');

// Import models
const User = require('./models/User');

// Function to create admin account if it doesn't exist
const createAdminAccount = async () => {
  try {
    const adminEmail = config.adminEmail;
    
    // Check if admin account exists first
    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (existingAdmin) {
      logger.info({
        type: 'admin-account',
        message: 'Admin account already exists',
        email: adminEmail
      });
      
      // Force update the admin password to match .env
      existingAdmin.password = config.adminPassword;
      await existingAdmin.save();
      
      logger.info({
        type: 'admin-account',
        message: 'Admin password has been updated to match .env configuration',
        email: adminEmail
      });
      
      return;
    }
    
    // Create admin account with secure password from config
    const admin = new User({
      name: config.adminName,
      email: adminEmail,
      password: config.adminPassword,
      role: 'admin',
      dashboardAccess: true,
      trainingProgress: 3,
      videosWatched: [1, 2, 3],
      quizPassed: true,
      meetingScheduled: true
    });
    
    await admin.save();
    
    logger.info({
      type: 'admin-account',
      message: 'Admin account created successfully',
      email: adminEmail
    });
    
    // Only log admin credentials in development mode
    if (config.env === 'development') {
      logger.info({
        type: 'admin-credentials',
        message: 'Admin login credentials (DEVELOPMENT ONLY)',
        email: adminEmail,
        password: config.adminPassword
      });
    }
  } catch (error) {
    logger.error({
      type: 'admin-account-error',
      message: 'Error creating admin account',
      error: error.message,
      stack: error.stack
    });
  }
};

// Initialize Express app
const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(compression()); // Compress all responses

// CORS configuration
const corsOptions = {
  origin: config.corsOrigin === '*' 
    ? true // Allow all origins if CORS_ORIGIN is set to *
    : (config.env === 'development' 
      ? 'http://localhost:5173' 
      : Array.isArray(config.corsOrigin) 
        ? config.corsOrigin 
        : [
            'https://leopay.mockello.com', 
            'https://earnmockello-frontend.vercel.app',
            config.corsOrigin
          ].filter(Boolean)),
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true,
  maxAge: 86400 // 24 hours
};

// Print the CORS configuration for debugging
logger.info({
  type: 'cors-config',
  message: 'CORS configuration initialized',
  origin: corsOptions.origin,
  corsOriginEnv: config.corsOrigin
});

app.use(cors(corsOptions));

// Apply security middleware
securityMiddleware(app);

// Logging middleware
app.use(requestLogger);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: Date.now()
  });
});

// Default route
app.get('/', (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: 'Leopay API is running',
    environment: config.env,
    version: process.env.npm_package_version || '1.0.0'
  });
});

// 404 handler
app.use((req, res, next) => {
  const error = new Error(`Route not found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
});

// Error handling middleware
app.use(errorHandler);

// Connect to the database before starting the server
connectDB().then(() => {
  // Create admin account after successful connection
  createAdminAccount();
  
  let server;
  
  // For Render deployment, we always use HTTP since Render provides SSL
  // We only use the HTTPS config for self-hosted environments
  if (config.enableHttps && config.env === 'production' && !process.env.RENDER) {
    try {
      // HTTPS options - paths should be adjusted for your environment
      const httpsOptions = {
        key: fs.readFileSync(path.join(__dirname, '../ssl/key.pem')),
        cert: fs.readFileSync(path.join(__dirname, '../ssl/cert.pem'))
      };
      
      // Create HTTPS server
      server = https.createServer(httpsOptions, app);
      
      logger.info({
        type: 'server',
        message: 'HTTPS enabled'
      });
    } catch (error) {
      logger.error({
        type: 'https-error',
        message: 'Failed to start HTTPS server, falling back to HTTP',
        error: error.message
      });
      
      // Fallback to HTTP if HTTPS fails
      server = http.createServer(app);
    }
  } else {
    // Create HTTP server
    server = http.createServer(app);
  }
  
  // Start server
  // Render sets process.env.PORT
  const PORT = process.env.PORT || config.port;
  server.listen(PORT, '0.0.0.0', () => {
    logger.info({
      type: 'server',
      message: `Server running in ${config.env} mode on port ${PORT}`,
      port: PORT,
      environment: config.env,
      render: process.env.RENDER ? true : false
    });
  });
  
  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err) => {
    logger.error({
      type: 'unhandled-rejection',
      message: err.message,
      stack: err.stack
    });
  });
  
  // Handle uncaught exceptions
  process.on('uncaughtException', (err) => {
    logger.error({
      type: 'uncaught-exception',
      message: err.message,
      stack: err.stack
    });
    
    // Exit with failure
    process.exit(1);
  });
}).catch(err => {
  logger.error({
    type: 'startup-error',
    message: 'Failed to start server',
    error: err.message,
    stack: err.stack
  });
  
  process.exit(1);
}); 