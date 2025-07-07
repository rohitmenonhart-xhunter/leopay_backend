const mongoose = require('mongoose');
const config = require('../config/config');
const { logger } = require('./logger');

// Configure Mongoose options
const mongooseOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: config.mongoPoolSize,
  serverSelectionTimeoutMS: 30000, // 30 seconds
  socketTimeoutMS: 45000, // 45 seconds
  heartbeatFrequencyMS: 10000, // 10 seconds
  family: 4 // Use IPv4
};

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongoUri, mongooseOptions);
    
    logger.info({
      type: 'database',
      message: `MongoDB Connected: ${conn.connection.host}`,
      databaseName: conn.connection.name
    });
    
    // Connection success event
    mongoose.connection.on('connected', () => {
      logger.info({
        type: 'database',
        message: 'MongoDB connection established successfully'
      });
    });
    
    // Connection error event
    mongoose.connection.on('error', (err) => {
      logger.error({
        type: 'database-error',
        message: 'MongoDB connection error',
        error: err.message,
        stack: err.stack
      });
    });
    
    // Connection disconnected event
    mongoose.connection.on('disconnected', () => {
      logger.warn({
        type: 'database',
        message: 'MongoDB connection disconnected'
      });
    });
    
    // Node process ends, close the connection
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info({
        type: 'database',
        message: 'MongoDB connection closed due to app termination'
      });
      process.exit(0);
    });
    
    return conn;
  } catch (err) {
    logger.error({
      type: 'database-error',
      message: 'MongoDB connection error',
      error: err.message,
      stack: err.stack
    });
    
    // Retry connection after delay
    logger.info({
      type: 'database',
      message: 'Retrying MongoDB connection in 5 seconds...'
    });
    
    setTimeout(() => {
      connectDB();
    }, 5000);
  }
};

module.exports = connectDB; 