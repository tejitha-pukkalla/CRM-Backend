const mongoose = require("mongoose");

const LeaveCreditSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  year: { 
    type: Number, 
    required: true 
  },
  
  // Annual Leave (default yearly allocation)
  annualLeave: {
    total: { type: Number, default: 12 }, // 12 days per year (1 per month)
    used: { type: Number, default: 0 },
  },
  
  // Additional leave types (optional, admin can add)
  sickLeave: {
    total: { type: Number, default: 0 },
    used: { type: Number, default: 0 },
  },
  maternityLeave: {
    total: { type: Number, default: 0 },
    used: { type: Number, default: 0 },
  },
  bereavementLeave: {
    total: { type: Number, default: 0 },
    used: { type: Number, default: 0 },
  },
  
  // Effective date
  effectiveFrom: { 
    type: Date, 
    required: true 
  },
  
  // Loss of Pay counter
  lossOfPayCount: { 
    type: Number, 
    default: 0 
  },
  
  // Who created this credit
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
}, { 
  timestamps: true 
});

// Unique constraint: One leave credit per user per year
LeaveCreditSchema.index({ userId: 1, year: 1 }, { unique: true });

// Virtual to calculate remaining leaves
LeaveCreditSchema.virtual('remainingAnnualLeave').get(function() {
  return this.annualLeave.total - this.annualLeave.used;
});

LeaveCreditSchema.set('toJSON', { virtuals: true });
LeaveCreditSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model("LeaveCredit", LeaveCreditSchema);