const LeaveCredit = require('../models/LeaveCredit.model');
const LeaveApplication = require('../models/Leave.apply.model');
const User = require('../models/User.model');
const { ROLES } = require("../config/constants");

// ==================== LEAVE CREDITS ====================

/**
 * 📌 Bulk Create Leave Credits (SuperAdmin Only)
 * Creates 12 annual leave days (1 per month) for all eligible users
 */
exports.bulkCreateLeaveCredits = async (req, res) => {
  try {
    const { year, effectiveFrom } = req.body;

    if (!year || !effectiveFrom) {
      return res.status(400).json({ message: "❌ Year and effective date are required" });
    }

    // Check if credits for this year already exist
    const alreadyExists = await LeaveCredit.exists({ year });
    if (alreadyExists) {
      return res.status(400).json({
        message: `⚠️ Leave credits for the year ${year} have already been created.`,
      });
    }

    // Fetch only active users with allowed roles
    const allowedRoles = [ROLES.MEMBER, ROLES.TEAMLEAD, ROLES.PROJECTLEAD];
    const roleRegex = allowedRoles.map((r) => new RegExp(`^${r}$`, "i"));

    const users = await User.find({
      isActive: true,
      globalRole: { $in: roleRegex },
    });

    if (users.length === 0) {
      return res.status(200).json({
        message: `⚠️ No eligible users found.`,
        year,
        createdCount: 0,
      });
    }

    // Create leave credits for all users
    const leaveCredits = users.map((user) => ({
      userId: user._id,
      year,
      annualLeave: { total: 12, used: 0 },
      sickLeave: { total: 0, used: 0 },
      maternityLeave: { total: 0, used: 0 },
      bereavementLeave: { total: 0, used: 0 },
      effectiveFrom,
      lossOfPayCount: 0,
      createdBy: req.user._id,
    }));

    await LeaveCredit.insertMany(leaveCredits);

    res.status(201).json({
      message: `✅ Leave credits successfully created for ${users.length} users for ${year}`,
      year,
      createdCount: users.length,
    });

  } catch (error) {
    console.error("❌ Bulk leave credit error:", error);
    res.status(500).json({
      message: "❌ Failed to create leave credits",
      error: error.message,
    });
  }
};

/**
 * 📌 Get All Leave Credits (SuperAdmin)
 */
exports.getAllLeaveCredits = async (req, res) => {
  try {
    const year = req.query.year ? parseInt(req.query.year) : new Date().getFullYear();

    const credits = await LeaveCredit.find({ year })
      .populate("userId", "name email role")
      .sort({ createdAt: -1 })
      .lean();

    // Filter out superadmins
    const filteredCredits = credits.filter(
      (credit) => credit.userId?.role?.toLowerCase() !== "superadmin"
    );

    // Format response
    const formattedCredits = filteredCredits.map((credit) => ({
      _id: credit._id,
      userId: {
        name: credit.userId?.name ?? "",
        email: credit.userId?.email ?? "",
      },
      annualLeave: {
        total: credit.annualLeave?.total ?? 0,
        used: credit.annualLeave?.used ?? 0,
        remaining: (credit.annualLeave?.total ?? 0) - (credit.annualLeave?.used ?? 0),
      },
      sickLeave: {
        total: credit.sickLeave?.total ?? 0,
        used: credit.sickLeave?.used ?? 0,
        remaining: (credit.sickLeave?.total ?? 0) - (credit.sickLeave?.used ?? 0),
      },
      maternityLeave: {
        total: credit.maternityLeave?.total ?? 0,
        used: credit.maternityLeave?.used ?? 0,
        remaining: (credit.maternityLeave?.total ?? 0) - (credit.maternityLeave?.used ?? 0),
      },
      bereavementLeave: {
        total: credit.bereavementLeave?.total ?? 0,
        used: credit.bereavementLeave?.used ?? 0,
        remaining: (credit.bereavementLeave?.total ?? 0) - (credit.bereavementLeave?.used ?? 0),
      },
      lossOfPayCount: credit.lossOfPayCount ?? 0,
    }));

    res.status(200).json({
      message: `✅ Leave credits fetched successfully for ${year}`,
      totalRecords: formattedCredits.length,
      data: formattedCredits,
    });
  } catch (error) {
    console.error("❌ Get all leave credits error:", error);
    res.status(500).json({
      message: "❌ Failed to fetch leave credits",
      error: error.message,
    });
  }
};

/**
 * 📌 Update User Leave Credit (SuperAdmin)
 * Updates sick/maternity/bereavement leave for individual users
 */
exports.updateUserLeaveCredit = async (req, res) => {
  try {
    const { id } = req.params;
    const { sickLeave, maternityLeave, bereavementLeave } = req.body;

    const credit = await LeaveCredit.findById(id);
    
    if (!credit) {
      return res.status(404).json({ message: "Leave credit not found" });
    }

    // Update special leave types
    if (sickLeave !== undefined) {
      credit.sickLeave.total = parseInt(sickLeave);
    }
    if (maternityLeave !== undefined) {
      credit.maternityLeave.total = parseInt(maternityLeave);
    }
    if (bereavementLeave !== undefined) {
      credit.bereavementLeave.total = parseInt(bereavementLeave);
    }

    await credit.save();

    res.status(200).json({
      message: "Leave credit updated successfully",
      data: credit
    });
  } catch (error) {
    console.error("Update leave credit error:", error);
    res.status(500).json({ 
      message: "Failed to update leave credit", 
      error: error.message 
    });
  }
};

/**
 * 📌 Get My Leave Credit
 */
exports.getMyLeaveCredit = async (req, res) => {
  try {
    const year = parseInt(req.query.year);
    
    const credit = await LeaveCredit.findOne({
      userId: req.user._id,
      year,
    }).populate('userId', 'name email');

    if (!credit) {
      return res.status(404).json({ message: "No leave credit found for this year" });
    }

    res.status(200).json({ data: credit });
  } catch (error) {
    console.error("Get my leave credit error:", error);
    res.status(500).json({ 
      message: "Failed to fetch leave credit", 
      error: error.message 
    });
  }
};

// ==================== LEAVE APPLICATIONS ====================

/**
 * 📌 Apply for Leave
 * Logic:
 * - Annual leave: First in month cuts from annual (1 day), second+ in month = LOP
 * - Sick/Maternity/Bereavement: Uses respective balance if available, else LOP
 * - Work from Home: NOT LOP - just marks as WFH, doesn't cut leaves ✅ FIXED
 */
exports.applyLeave = async (req, res) => {
  try {
    const { fromDate, toDate, leaveCategory, durationType, timeSlot, description } = req.body;
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user || user.globalRole === "superadmin") {
      return res.status(403).json({ message: "SuperAdmin cannot apply for leave" });
    }

    const from = new Date(fromDate);
    const to = new Date(toDate);

    if (isNaN(from) || isNaN(to)) {
      return res.status(400).json({ message: "Invalid date format" });
    }
    if (to < from) {
      return res.status(400).json({ message: "End date cannot be before start date" });
    }

    const month = from.getMonth() + 1;
    const year = from.getFullYear();

    // Valid leave categories
    const validCategories = ["annual", "sick", "maternity", "bereavement", "workFromHome"];
    if (!validCategories.includes(leaveCategory)) {
      return res.status(400).json({ message: "Invalid leave category" });
    }

    // Calculate leave days and hours
    let leaveDays = 0;
    let hours = 0;

    if (fromDate === toDate) {
      // Single day
      leaveDays = durationType === "fullday" ? 1 : 0.5;
      hours = leaveDays * 9;
    } else {
      // Multiple days
      if (durationType !== "fullday") {
        return res.status(400).json({ message: "Half day leave can only be applied for a single day" });
      }
      const diffTime = Math.abs(to - from);
      leaveDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      hours = leaveDays * 9;
    }

    // Fetch leave credit
    const credit = await LeaveCredit.findOne({ userId, year });
    if (!credit) {
      return res.status(400).json({ message: "No leave credit found for this year. Please contact admin." });
    }

    // Count APPROVED annual leaves in this month
    const approvedAnnualLeavesThisMonth = await LeaveApplication.countDocuments({
      userId,
      month,
      year,
      leaveCategory: "annual",
      status: "approved"
    });

    let isLossOfPay = false;
    let lossOfPayDays = 0;
    let willCutFromAnnual = false;

    // ✅ ANNUAL LEAVE: max 1 paid per month, 2nd+ = LOP
    if (leaveCategory === "annual") {
      const remainingAnnual = credit.annualLeave.total - credit.annualLeave.used;

      // If already used 1+ approved annual leave this month OR insufficient balance
      if (approvedAnnualLeavesThisMonth >= 1 || remainingAnnual < leaveDays) {
        isLossOfPay = true;
        lossOfPayDays = leaveDays;
        willCutFromAnnual = false;
      } else {
        isLossOfPay = false;
        willCutFromAnnual = true;
      }
    }
    // ✅ WORK FROM HOME: NOT LOP - just marks as WFH
    else if (leaveCategory === "workFromHome") {
      isLossOfPay = false; // ✅ FIXED: WFH is NOT LOP
      lossOfPayDays = 0;
      willCutFromAnnual = false;
    }
    // ✅ SPECIAL LEAVES: sick, maternity, bereavement
    else {
      const typeMap = {
        sick: "sickLeave",
        maternity: "maternityLeave",
        bereavement: "bereavementLeave"
      };
      const typeKey = typeMap[leaveCategory];

      if (!credit[typeKey] || credit[typeKey].total === 0) {
        return res.status(403).json({
          message: `You are not eligible for ${leaveCategory} leave. Contact SuperAdmin.`
        });
      }

      const remaining = credit[typeKey].total - credit[typeKey].used;

      if (remaining >= leaveDays) {
        isLossOfPay = false;
      } else {
        isLossOfPay = true;
        lossOfPayDays = leaveDays;
      }
    }

    // Create leave application
    const leave = await LeaveApplication.create({
      userId,
      name: user.name,
      email: user.email,
      fromDate,
      toDate,
      leaveCategory,
      durationType,
      timeSlot,
      leaveDays,
      hours,
      month,
      year,
      isLossOfPay,
      lossOfPayDays,
      lossOfPayCount: lossOfPayDays,
      status: "pending",
      description,
    });

    const message = isLossOfPay
      ? `⚠️ Leave applied as Loss of Pay (${lossOfPayDays} day${lossOfPayDays > 1 ? "s" : ""}).`
      : willCutFromAnnual
      ? `✅ Leave applied. Will deduct ${leaveDays} day(s) from annual leave upon approval.`
      : `✅ Leave applied successfully.`;

    res.status(201).json({
      message,
      data: leave,
      info: { 
        isLossOfPay, 
        lossOfPayDays, 
        leaveCategory, 
        willCutFromAnnual,
        approvedAnnualLeavesThisMonth 
      }
    });
  } catch (error) {
    console.error("Apply leave error:", error);
    res.status(500).json({ message: "Failed to apply leave", error: error.message });
  }
};

/**
 * 📌 Get My Leave Applications
 */
exports.getMyLeaveApplications = async (req, res) => {
  try {
    const { year, status } = req.query;
    const userId = req.user._id;

    let query = { userId };
    
    if (year) {
      query.year = parseInt(year);
    }
    
    if (status && status !== 'all') {
      query.status = status;
    }

    const leaves = await LeaveApplication.find(query)
      .populate('reviewedBy', 'name email')
      .sort({ appliedAt: -1 })
      .lean();

    res.status(200).json({
      message: "Leave applications fetched successfully",
      data: leaves,
    });
  } catch (error) {
    console.error("Get my leave applications error:", error);
    res.status(500).json({
      message: "Failed to fetch leave applications",
      error: error.message,
    });
  }
};

/**
 * 📌 Get All Leave Applications (SuperAdmin)
 */
exports.getAllLeaveApplications = async (req, res) => {
  try {
    const { year, status, userId } = req.query;

    let query = {};
    
    if (year) {
      query.year = parseInt(year);
    }
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (userId) {
      query.userId = userId;
    }

    const leaves = await LeaveApplication.find(query)
      .populate('userId', 'name email')
      .populate('reviewedBy', 'name email')
      .sort({ appliedAt: -1 })
      .lean();

    res.status(200).json({
      message: "Leave applications fetched successfully",
      data: leaves,
    });
  } catch (error) {
    console.error("Get all leave applications error:", error);
    res.status(500).json({
      message: "Failed to fetch leave applications",
      error: error.message,
    });
  }
};

/**
 * 📌 Get Pending Leave Applications (SuperAdmin)
 */
exports.getPendingLeaveApplications = async (req, res) => {
  try {
    const leaves = await LeaveApplication.find({ status: 'pending' })
      .populate('userId', 'name email')
      .sort({ appliedAt: 1 })
      .lean();

    res.status(200).json({
      message: "Pending leave applications fetched successfully",
      data: leaves,
    });
  } catch (error) {
    console.error("Get pending leave applications error:", error);
    res.status(500).json({
      message: "Failed to fetch pending leave applications",
      error: error.message,
    });
  }
};

/**
 * 📌 Update Leave Application Status (Approve/Reject)
 * ✅ CRITICAL: Deductions happen ONLY when approved
 * ✅ Annual leave: deduct from annualLeave.used
 * ✅ LOP: increment lossOfPayCount only (NO annual deduction)
 * ✅ WFH: No deduction at all
 * ❌ Rejected: NO deductions at all
 */
exports.updateLeaveApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;

    console.log('\n========== LEAVE APPROVAL REQUEST ==========');
    console.log('Leave Application ID:', id);
    console.log('Requested Status:', status);

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: "Status must be 'approved' or 'rejected'" });
    }

    const leave = await LeaveApplication.findById(id);
    if (!leave) {
      return res.status(404).json({ message: "Leave application not found" });
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({ message: `Leave already ${leave.status}` });
    }

    // Update leave status
    leave.status = status;
    leave.reviewedBy = req.user._id;
    leave.reviewedAt = new Date();
    if (status === 'rejected' && rejectionReason) {
      leave.rejectionReason = rejectionReason;
    }
    
    await leave.save();
    console.log('✅ Leave application status updated to:', status);

    // ✅ ONLY deduct if APPROVED
    if (status === 'approved') {
      console.log('\n--- Starting Leave Credit Deduction ---');
      
      const credit = await LeaveCredit.findOne({ 
        userId: leave.userId, 
        year: leave.year 
      });
      
      if (!credit) {
        console.error('❌ Leave credit not found!');
        return res.status(404).json({ 
          message: "Leave credit not found. Please contact admin." 
        });
      }

      console.log('Before Update:', {
        annualUsed: credit.annualLeave.used,
        lopCount: credit.lossOfPayCount
      });

      if (leave.isLossOfPay) {
        // ✅ LOP: ONLY increment lossOfPayCount
        credit.lossOfPayCount = Number(credit.lossOfPayCount) + Number(leave.lossOfPayDays);
        console.log(`✅ LOP Leave - Adding ${leave.lossOfPayDays} days to LOP count`);
      } else if (leave.leaveCategory === 'workFromHome') {
        // ✅ WFH: No deduction at all
        console.log(`✅ Work From Home - No deductions`);
      } else {
        // ✅ NOT LOP: Deduct from appropriate leave type
        if (leave.leaveCategory === 'annual') {
          credit.annualLeave.used = Number(credit.annualLeave.used) + Number(leave.leaveDays);
          console.log(`✅ Annual Leave - Deducting ${leave.leaveDays} days from annual leave`);
        } else if (leave.leaveCategory === 'sick') {
          credit.sickLeave.used = Number(credit.sickLeave.used) + Number(leave.leaveDays);
          console.log(`✅ Sick Leave - Deducting ${leave.leaveDays} days`);
        } else if (leave.leaveCategory === 'maternity') {
          credit.maternityLeave.used = Number(credit.maternityLeave.used) + Number(leave.leaveDays);
          console.log(`✅ Maternity Leave - Deducting ${leave.leaveDays} days`);
        } else if (leave.leaveCategory === 'bereavement') {
          credit.bereavementLeave.used = Number(credit.bereavementLeave.used) + Number(leave.leaveDays);
          console.log(`✅ Bereavement Leave - Deducting ${leave.leaveDays} days`);
        }
      }

      // Save with explicit marking
      credit.markModified('annualLeave');
      credit.markModified('lossOfPayCount');
      await credit.save();

      console.log('After Update:', {
        annualUsed: credit.annualLeave.used,
        lopCount: credit.lossOfPayCount
      });
      console.log('========================================\n');
    } else {
      console.log('❌ Leave REJECTED - No deductions made\n');
    }

    res.status(200).json({
      message: `✅ Leave application ${status} successfully`,
      data: leave,
    });
  } catch (error) {
    console.error('❌ Error updating leave:', error);
    res.status(500).json({ 
      message: "Failed to update leave", 
      error: error.message 
    });
  }
};


