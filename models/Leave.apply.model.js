const mongoose = require("mongoose");

const leaveApplicationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  fromDate: {
    type: Date,
    required: true,
  },
  toDate: {
    type: Date,
    required: true,
  },
  
  // Leave Category: annual, sick, maternity, bereavement, workFromHome
  leaveCategory: {
    type: String,
    enum: ['annual', 'sick', 'maternity', 'bereavement', 'workFromHome'],
    default: 'annual',
    required: true,
  },
  
  // Duration Type: fullday, halfday-morning, halfday-evening
  durationType: {
    type: String,
    enum: ['fullday', 'halfday-morning', 'halfday-evening'],
    default: 'fullday',
    required: true,
  },
  
  // Time slot (e.g., "9:30 AM to 6:30 PM")
  timeSlot: {
    type: String,
  },
  
  // Calculated leave days (e.g., 1, 0.5, 3)
  leaveDays: {
    type: Number,
    required: true,
  },
  
  // Total hours (8 hours = 1 day, 4.5 hours = 0.5 day)
  hours: {
    type: Number,
    required: true,
  },
  
  // Month and Year for tracking
  month: {
    type: Number,
    required: true,
  },
  year: {
    type: Number,
    required: true,
  },
  
  // Loss of Pay indicator
  isLossOfPay: {
    type: Boolean,
    default: false,
  },
  lossOfPayDays: {
    type: Number,
    default: 0,
  },
  lossOfPayCount: {
    type: Number,
    default: 0,
  },
  
  // Application status
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  
  // Rejection reason (if rejected)
  rejectionReason: {
    type: String,
  },
  
  // Description/Reason for leave
  description: {
    type: String,
    default: "",
  },
  
  // Reviewed by (admin who approved/rejected)
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  reviewedAt: {
    type: Date,
  },
  
  // Applied date
  appliedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Indexes for efficient queries
leaveApplicationSchema.index({ userId: 1, year: 1, month: 1, status: 1 });
leaveApplicationSchema.index({ status: 1, appliedAt: 1 });

module.exports = mongoose.model("LeaveApplication", leaveApplicationSchema);