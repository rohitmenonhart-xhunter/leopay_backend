const express = require('express');
const {
  createLead,
  getLeads,
  getStats,
  getAllLeads,
  updateLeadStatus
} = require('../controllers/leads');
const { protect } = require('../middleware/auth');
const cors = require('cors');

const router = express.Router();

// CORS options
const corsOptions = {
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true
};

// Apply CORS to all routes in this router
router.use(cors(corsOptions));

// Routes with explicit OPTIONS handlers
router.options('/', cors(corsOptions));
router.options('/stats', cors(corsOptions));
router.options('/all', cors(corsOptions));
router.options('/:id/status', cors(corsOptions));

// Hunter routes
router.post('/', protect, createLead);
router.get('/', protect, getLeads);
router.get('/stats', protect, getStats);

// Admin routes
router.get('/all', protect, getAllLeads);
router.put('/:id/status', protect, updateLeadStatus);

module.exports = router; 