const mongoose = require('mongoose');

const LeadSchema = new mongoose.Schema({
  hunter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  clientName: {
    type: String,
    required: [true, 'Please provide a client name'],
    trim: true
  },
  companyName: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    match: [
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
      'Please provide a valid email'
    ],
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Please provide a phone number'],
    trim: true
  },
  alternatePhone: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  businessType: {
    type: String,
    required: [true, 'Please provide a business type'],
    trim: true
  },
  projectRequirements: {
    type: String,
    required: [true, 'Please provide project requirements'],
    trim: true
  },
  budget: {
    type: String,
    required: [true, 'Please provide a budget range'],
    trim: true
  },
  additionalNotes: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'contacted', 'in_progress', 'completed', 'rejected'],
    default: 'pending'
  },
  commissionRate: {
    type: Number,
    default: 0.5 // 50% commission
  },
  projectValue: {
    type: Number,
    default: 0 // Value in INR
  },
  commissionEarned: {
    type: Number,
    default: 0 // Value in INR
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field on save
LeadSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Calculate commission when project is completed
LeadSchema.pre('save', function(next) {
  if (this.status === 'completed' && this.projectValue > 0) {
    this.commissionEarned = this.projectValue * this.commissionRate;
  }
  next();
});

module.exports = mongoose.model('Lead', LeadSchema); 