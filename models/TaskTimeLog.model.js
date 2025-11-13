const mongoose = require('mongoose');
const { TIME_ENTRY_TYPES } = require('../config/constants');

const taskTimeLogSchema = new mongoose.Schema({
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    default: null
  },
  duration: {
    type: Number, // in minutes
    default: 0
  },
  description: {
    type: String,
    trim: true
  },
  entryType: {
    type: String,
    enum: Object.values(TIME_ENTRY_TYPES),
    default: TIME_ENTRY_TYPES.AUTOMATIC
  },
  isPaused: {
    type: Boolean,
    default: false
  },
  pausedAt: {
    type: Date,
    default: null
  },
  resumedAt: {
    type: Date,
    default: null
  },
  pauseReason: {
    type: String,
    default: null
  },
  pauseDuration: {
    type: Number, // in minutes - total pause time
    default: 0
  },
  // Array to track multiple pause/resume cycles
  pauseHistory: [{
    pausedAt: Date,
    resumedAt: Date,
    reason: String,
    duration: Number // in minutes
  }]
}, {
  timestamps: true
});

taskTimeLogSchema.index({ taskId: 1 });
taskTimeLogSchema.index({ userId: 1 });
taskTimeLogSchema.index({ startTime: 1 });
taskTimeLogSchema.index({ isPaused: 1 });

module.exports = mongoose.model('TaskTimeLog', taskTimeLogSchema);
