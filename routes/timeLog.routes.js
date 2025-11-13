const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const timeLogController = require('../controllers/timeLog.controller');
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/roleCheck');
const { validate } = require('../middlewares/validate');
const { ROLES } = require('../config/constants');

// Validation Rules
const manualTimeValidation = [
  body('startTime').isISO8601().withMessage('Valid start time is required'),
  body('endTime').isISO8601().withMessage('Valid end time is required'),
  body('description').optional().trim(),
  validate
];

// ✅ Pause validation - FIXED POSITION
const pauseValidation = [
  body('reason').optional().trim(),
  validate
];

// Routes

// Get all time logs for user
router.get('/logs', protect, authorize(ROLES.MEMBER, ROLES.PROJECTLEAD, ROLES.TEAMLEAD), timeLogController.getUserTimeLogs);

// Task-specific time tracking routes
router.post('/:id/start', protect, authorize(ROLES.MEMBER, ROLES.PROJECTLEAD, ROLES.TEAMLEAD), timeLogController.startTimer);
router.post('/:id/stop', protect, authorize(ROLES.MEMBER, ROLES.PROJECTLEAD, ROLES.TEAMLEAD), timeLogController.stopTimer);

// ✅ NEW - Pause & Resume timer routes
router.post('/:id/pause', protect, authorize(ROLES.MEMBER, ROLES.PROJECTLEAD, ROLES.TEAMLEAD), pauseValidation, timeLogController.pauseTimer);
router.post('/:id/resume', protect, authorize(ROLES.MEMBER, ROLES.PROJECTLEAD, ROLES.TEAMLEAD), timeLogController.resumeTimer);

router.post('/:id/manual', protect, authorize(ROLES.MEMBER, ROLES.PROJECTLEAD, ROLES.TEAMLEAD), manualTimeValidation, timeLogController.addManualTime);
router.get('/:id/logs', protect, authorize(ROLES.MEMBER, ROLES.PROJECTLEAD, ROLES.TEAMLEAD), timeLogController.getTaskTimeLogs);

module.exports = router;