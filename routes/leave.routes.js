const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/leave.management.controller');
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/roleCheck'); // ✅ FIXED: Import from roleCheck

// ==================== LEAVE CREDITS ====================

// ✅ Bulk create leave credits (SuperAdmin only) - Once per year
router.post(
  '/leave-credits/bulk',
  protect,
  authorize('superadmin'), // ✅ FIXED: Use authorize instead of authorizeRoles
  leaveController.bulkCreateLeaveCredits
);

// ✅ Get all leave credits (SuperAdmin only) - for editing
router.get(
  '/leave-credits/all',
  protect,
  authorize('superadmin'),
  leaveController.getAllLeaveCredits
);

// ✅ Update individual user's leave credit (SuperAdmin only)
router.put(
  '/leave-credits/:id',
  protect,
  authorize('superadmin'),
  leaveController.updateUserLeaveCredit
);

// ✅ Get my leave credit (All users)
router.get(
  '/myleave-credits',
  protect,
  authorize('member', 'teamlead', 'projectlead'),
  leaveController.getMyLeaveCredit
);

// ==================== LEAVE APPLICATIONS ====================

// ✅ Apply for leave (All users except superadmin)
router.post(
  '/apply',
  protect,
  authorize('member', 'teamlead', 'projectlead'),
  leaveController.applyLeave
);

// ✅ Get my leave applications (All users)
router.get(
  '/my-applications',
  protect,
  authorize('member', 'teamlead', 'projectlead'),
  leaveController.getMyLeaveApplications
);

// ✅ Get all leave applications (SuperAdmin/TeamLead)
router.get(
  '/all-applications',
  protect,
  authorize('superadmin', 'teamlead'),
  leaveController.getAllLeaveApplications
);

// ✅ Get pending leave applications (SuperAdmin/TeamLead)
router.get(
  '/pending-applications',
  protect,
  authorize('superadmin', 'teamlead'),
  leaveController.getPendingLeaveApplications
);

// ✅ Update leave application status (Approve/Reject)
router.put(
  '/applications/:id/status',
  protect,
  authorize('superadmin'),
  leaveController.updateLeaveApplicationStatus
);

module.exports = router;