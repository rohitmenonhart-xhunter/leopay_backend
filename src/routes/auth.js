const express = require('express');
const { 
  register, 
  login, 
  getMe, 
  updateTrainingProgress,
  getCandidates,
  scheduleMeeting,
  approveDashboardAccess
} = require('../controllers/auth');
const { protect } = require('../middleware/auth');
const cors = require('cors');

const router = express.Router();

// CORS options for auth routes
const corsOptions = {
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true
};

// Apply CORS to all routes in this router
router.use(cors(corsOptions));

// Routes with explicit OPTIONS handlers
router.options('/register', cors(corsOptions));
router.options('/login', cors(corsOptions));
router.options('/me', cors(corsOptions));
router.options('/training', cors(corsOptions));
router.options('/admin/candidates', cors(corsOptions));
router.options('/admin/schedule/:userId', cors(corsOptions));
router.options('/admin/approve/:userId', cors(corsOptions));

// User routes
router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/training', protect, updateTrainingProgress);

// Admin routes
router.get('/admin/candidates', protect, getCandidates);
router.put('/admin/schedule/:userId', protect, scheduleMeeting);
router.put('/admin/approve/:userId', protect, approveDashboardAccess);

module.exports = router; 