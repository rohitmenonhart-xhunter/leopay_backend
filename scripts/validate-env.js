#!/usr/bin/env node

/**
 * This script validates the server environment to ensure it meets production requirements
 * Run it with: node scripts/validate-env.js
 */

const os = require('os');
const fs = require('fs');
const path = require('path');

// Load config
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const config = require('../src/config/config');

// Console formatting
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

// Start validation
console.log(`${colors.blue}===== Environment Validation for Production =====\n${colors.reset}`);

// Track validation status
const issues = [];
const warnings = [];

// System checks
console.log(`${colors.blue}System Information:${colors.reset}`);
console.log(`• Node.js Version: ${process.version}`);
console.log(`• OS: ${os.platform()} ${os.release()}`);
console.log(`• Architecture: ${os.arch()}`);
console.log(`• CPU Cores: ${os.cpus().length}`);
console.log(`• Total Memory: ${Math.round(os.totalmem() / (1024 * 1024 * 1024))} GB`);
console.log(`• Free Memory: ${Math.round(os.freemem() / (1024 * 1024 * 1024))} GB`);

// Memory check
if (os.totalmem() < 2 * 1024 * 1024 * 1024) { // Less than 2GB
  issues.push('System has less than 2GB RAM, which may be insufficient for production');
}

// CPU check
if (os.cpus().length < 2) {
  warnings.push('System has less than 2 CPU cores, which may affect performance');
}

// Environment variable checks
console.log(`\n${colors.blue}Environment Variables:${colors.reset}`);

// Check required variables
const requiredVars = [
  'PORT', 'NODE_ENV', 'MONGO_URI', 'JWT_SECRET', 'JWT_EXPIRE'
];

for (const envVar of requiredVars) {
  if (process.env[envVar]) {
    console.log(`• ${envVar}: ${colors.green}Set${colors.reset}`);
  } else {
    console.log(`• ${envVar}: ${colors.red}Missing${colors.reset}`);
    issues.push(`Required environment variable ${envVar} is not set`);
  }
}

// Check security settings
console.log(`\n${colors.blue}Security Checks:${colors.reset}`);

// JWT secret strength
if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 16) {
  console.log(`• JWT Secret Strength: ${colors.red}Weak${colors.reset}`);
  issues.push('JWT_SECRET is too short (less than 16 characters)');
} else if (process.env.JWT_SECRET) {
  console.log(`• JWT Secret Strength: ${colors.green}Good${colors.reset}`);
}

// Check HTTPS configuration
if (process.env.ENABLE_HTTPS === 'true') {
  console.log(`• HTTPS: ${colors.green}Enabled${colors.reset}`);
  
  // Check for SSL certificates
  const sslDir = path.join(__dirname, '../ssl');
  const keyPath = path.join(sslDir, 'key.pem');
  const certPath = path.join(sslDir, 'cert.pem');
  
  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    console.log(`• SSL Certificates: ${colors.green}Found${colors.reset}`);
  } else {
    console.log(`• SSL Certificates: ${colors.red}Missing${colors.reset}`);
    issues.push('HTTPS is enabled but SSL certificates are missing');
    console.log(`  Run: npm run ssl:generate`);
  }
} else {
  console.log(`• HTTPS: ${colors.yellow}Disabled${colors.reset}`);
  warnings.push('HTTPS is disabled. Consider enabling it for production');
}

// Check MongoDB connection string
if (process.env.MONGO_URI && process.env.MONGO_URI.includes('localhost')) {
  console.log(`• MongoDB: ${colors.yellow}Using localhost${colors.reset}`);
  warnings.push('MongoDB connection is using localhost, which may not be suitable for production');
} else if (process.env.MONGO_URI) {
  console.log(`• MongoDB: ${colors.green}Using remote connection${colors.reset}`);
}

// Print summary
console.log(`\n${colors.blue}Validation Summary:${colors.reset}`);

if (issues.length === 0 && warnings.length === 0) {
  console.log(`${colors.green}✓ All checks passed. Environment is ready for production.${colors.reset}`);
} else {
  if (issues.length > 0) {
    console.log(`\n${colors.red}Issues that must be fixed:${colors.reset}`);
    issues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue}`);
    });
  }
  
  if (warnings.length > 0) {
    console.log(`\n${colors.yellow}Warnings to consider:${colors.reset}`);
    warnings.forEach((warning, index) => {
      console.log(`${index + 1}. ${warning}`);
    });
  }
  
  if (issues.length > 0) {
    console.log(`\n${colors.red}❌ Environment is NOT ready for production due to the issues above.${colors.reset}`);
    process.exit(1);
  } else {
    console.log(`\n${colors.yellow}⚠️ Environment may be ready for production, but consider addressing the warnings.${colors.reset}`);
  }
} 