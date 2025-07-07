const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      phone,
      dashboardAccess: false,
      trainingProgress: 0,
      videosWatched: [],
      quizPassed: false,
      meetingScheduled: false
    });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        dashboardAccess: user.dashboardAccess,
        trainingProgress: user.trainingProgress,
        videosWatched: user.videosWatched,
        quizPassed: user.quizPassed,
        meetingScheduled: user.meetingScheduled
      },
      token
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`Login attempt for email: ${email}`);

    // Check if email and password are provided
    if (!email || !password) {
      console.log('Email or password missing');
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Check if user exists
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      console.log(`User not found: ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    console.log(`User found: ${user.email}, role: ${user.role}`);
    console.log(`Stored hashed password: ${user.password}`);

    // Check if password matches using the model method
    const isMatch = await user.matchPassword(password);
    console.log(`Password match result using model method: ${isMatch}`);
    
    // Direct bcrypt comparison for debugging
    const bcrypt = require('bcryptjs');
    const directMatch = await bcrypt.compare(password, user.password);
    console.log(`Direct bcrypt comparison result: ${directMatch}`);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        dashboardAccess: user.dashboardAccess,
        trainingProgress: user.trainingProgress,
        videosWatched: user.videosWatched,
        quizPassed: user.quizPassed,
        meetingScheduled: user.meetingScheduled
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        dashboardAccess: user.dashboardAccess,
        trainingProgress: user.trainingProgress,
        videosWatched: user.videosWatched,
        quizPassed: user.quizPassed,
        meetingScheduled: user.meetingScheduled
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Update user training progress
// @route   PUT /api/auth/training
// @access  Private
exports.updateTrainingProgress = async (req, res) => {
  try {
    const { trainingProgress, quizPassed, meetingScheduled, dashboardAccess, videoId } = req.body;
    
    // Find user and update
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Update fields if provided
    if (trainingProgress !== undefined) user.trainingProgress = trainingProgress;
    if (quizPassed !== undefined) user.quizPassed = quizPassed;
    if (meetingScheduled !== undefined) user.meetingScheduled = meetingScheduled;
    if (dashboardAccess !== undefined) user.dashboardAccess = dashboardAccess;
    
    // Add video to watched list if provided and not already in the list
    if (videoId !== undefined && !user.videosWatched.includes(videoId)) {
      user.videosWatched.push(videoId);
    }
    
    // If quiz failed, reset videos watched
    if (quizPassed === false && trainingProgress === 0) {
      user.videosWatched = [];
    }
    
    await user.save();
    
    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        dashboardAccess: user.dashboardAccess,
        trainingProgress: user.trainingProgress,
        videosWatched: user.videosWatched,
        quizPassed: user.quizPassed,
        meetingScheduled: user.meetingScheduled
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Get all candidates who have passed the quiz
// @route   GET /api/auth/admin/candidates
// @access  Private/Admin
exports.getCandidates = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this resource'
      });
    }
    
    // Find all users who have passed the quiz but don't have dashboard access yet
    const candidates = await User.find({
      quizPassed: true,
      dashboardAccess: false,
      role: 'user'
    }).select('-password');
    
    res.status(200).json({
      success: true,
      candidates
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Schedule meeting with candidate
// @route   PUT /api/auth/admin/schedule/:userId
// @access  Private/Admin
exports.scheduleMeeting = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this resource'
      });
    }
    
    const { meetingDate, meetingTime } = req.body;
    
    if (!meetingDate || !meetingTime) {
      return res.status(400).json({
        success: false,
        message: 'Please provide meeting date and time'
      });
    }
    
    // Find user and update
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Update meeting status
    user.meetingScheduled = true;
    
    // In a real app, you would store meeting details
    // For this demo, we're just setting the flag
    
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Meeting scheduled successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        meetingScheduled: user.meetingScheduled
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Approve dashboard access
// @route   PUT /api/auth/admin/approve/:userId
// @access  Private/Admin
exports.approveDashboardAccess = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this resource'
      });
    }
    
    // Find user and update
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check if meeting was scheduled
    if (!user.meetingScheduled) {
      return res.status(400).json({
        success: false,
        message: 'Meeting must be scheduled before approving dashboard access'
      });
    }
    
    // Update dashboard access
    user.dashboardAccess = true;
    
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Dashboard access approved successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        dashboardAccess: user.dashboardAccess
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
}; 