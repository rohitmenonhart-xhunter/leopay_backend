const Lead = require('../models/Lead');
const User = require('../models/User');

// @desc    Create a new lead
// @route   POST /api/leads
// @access  Private
exports.createLead = async (req, res) => {
  try {
    const {
      clientName,
      companyName,
      email,
      phone,
      alternatePhone,
      address,
      businessType,
      projectRequirements,
      budget,
      additionalNotes
    } = req.body;

    // Create lead with hunter ID
    const lead = await Lead.create({
      hunter: req.user._id,
      clientName,
      companyName,
      email,
      phone,
      alternatePhone,
      address,
      businessType,
      projectRequirements,
      budget,
      additionalNotes
    });

    res.status(201).json({
      success: true,
      lead
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Get all leads for a hunter
// @route   GET /api/leads
// @access  Private
exports.getLeads = async (req, res) => {
  try {
    const leads = await Lead.find({ hunter: req.user._id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: leads.length,
      leads
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Get hunter stats
// @route   GET /api/leads/stats
// @access  Private
exports.getStats = async (req, res) => {
  try {
    // Get total leads count
    const totalLeads = await Lead.countDocuments({ hunter: req.user._id });
    
    // Get converted leads count (completed status)
    const convertedLeads = await Lead.countDocuments({ 
      hunter: req.user._id,
      status: 'completed'
    });
    
    // Get total earnings
    const earningsResult = await Lead.aggregate([
      { $match: { hunter: req.user._id, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$commissionEarned' } } }
    ]);
    
    const totalEarnings = earningsResult.length > 0 ? earningsResult[0].total : 0;
    
    res.status(200).json({
      success: true,
      stats: {
        totalLeads,
        convertedLeads,
        totalEarnings
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Get all leads (admin only)
// @route   GET /api/leads/all
// @access  Private/Admin
exports.getAllLeads = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this resource'
      });
    }
    
    const leads = await Lead.find().populate('hunter', 'name email').sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: leads.length,
      leads
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Update lead status (admin only)
// @route   PUT /api/leads/:id/status
// @access  Private/Admin
exports.updateLeadStatus = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this resource'
      });
    }
    
    const { status, projectValue } = req.body;
    
    // Validate status
    const validStatuses = ['pending', 'contacted', 'in_progress', 'completed', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }
    
    // Find lead
    const lead = await Lead.findById(req.params.id);
    
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }
    
    // Update lead
    lead.status = status;
    
    // If status is completed, update project value and calculate commission
    if (status === 'completed' && projectValue) {
      lead.projectValue = projectValue;
      lead.commissionEarned = projectValue * lead.commissionRate;
    }
    
    await lead.save();
    
    res.status(200).json({
      success: true,
      lead
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
}; 