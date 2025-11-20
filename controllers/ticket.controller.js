// import Ticket from "../models/ticket.model.js";
// import { ROLES } from "../config/roles.js";
// import { error } from "../utils/response.js";
// // 🎫 CREATE Ticket (Raise Request)
// export const createTicket = async (req, res) => {
//   try {
//     const { title, description, priority, category } = req.body;
//     const userId = req.user.id;
//     const userRole = req.user.role;

//     if (!title || !description) {
//       return res.status(400).json({ success: false, message: "Title and description are required" });
//     }

//     const ticket = await Ticket.create({
//       title,
//       description,
//       priority,
//       category,
//       createdBy: userId,
//       role: userRole,
//     });

//     const populatedTicket = await Ticket.findById(ticket._id).populate("createdBy", "name email role");

//     res.status(201).json({
//       success: true,
//       message: "Ticket created successfully",
//       data: populatedTicket,
//     });
//   } catch (error) {
//     console.error("❌ Error creating ticket:", error);
//     res.status(500).json({
//       success: false,
//       message: "Error creating ticket",
//       error: error.message,
//     });
//   }
// };

// // 📋 GET All Tickets (Super Admin Access)

// export const getAllTickets = async (req, res) => {
//   try {
//     // Only SuperAdmin allowed
//     if (req.user.globalRole !== ROLES.SUPERADMIN) {
//       return error(res, "Only Superadmin can view all tickets", 403);
//     }

//     const tickets = await Ticket.find()
//       .populate("createdBy", "name email role")
//       .sort({ createdAt: -1 });

//     res.status(200).json({
//       success: true,
//       total: tickets.length,
//       data: tickets,
//     });
//   } catch (err) {
//     console.error("❌ Error fetching tickets:", err);
//     res.status(500).json({
//       success: false,
//       message: "Error fetching tickets",
//       error: err.message,
//     });
//   }
// };

// // 🙋 GET My Tickets (User-Specific)
// export const getMyTickets = async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const tickets = await Ticket.find({ createdBy: userId })
//       .populate("createdBy", "name email role")
//       .sort({ createdAt: -1 });

//     res.status(200).json({
//       success: true,
//       total: tickets.length,
//       data: tickets,
//     });
//   } catch (error) {
//     console.error("❌ Error fetching user tickets:", error);
//     res.status(500).json({
//       success: false,
//       message: "Error fetching your tickets",
//       error: error.message,
//     });
//   }
// };

// // 🔄 UPDATE Ticket Status (SuperAdmin / TeamLead)
// export const updateTicketStatus = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { status, remarks } = req.body;

//     const updatedTicket = await Ticket.findByIdAndUpdate(
//       id,
//       { status, remarks },
//       { new: true }
//     ).populate("createdBy", "name email role");

//     if (!updatedTicket) {
//       return res.status(404).json({ success: false, message: "Ticket not found" });
//     }

//     res.status(200).json({
//       success: true,
//       message: "Ticket status updated successfully",
//       data: updatedTicket,
//     });
//   } catch (error) {
//     console.error("❌ Error updating ticket:", error);
//     res.status(500).json({
//       success: false,
//       message: "Error updating ticket",
//       error: error.message,
//     });
//   }
// };


const Ticket = require("../models/ticket.model");

// Create a new ticket
const createTicket = async (req, res) => {
  try {
    const { title, description, priority, category } = req.body;

    const count = await Ticket.countDocuments();
    const ticketId = `TKT-${String(count + 1).padStart(5, "0")}`;

    const ticket = await Ticket.create({
      ticketId,
      title,
      description,
      priority: priority || "Low",
      category: category || "General",
      createdBy: req.user._id,
      status: "Open",
    });

    await ticket.populate("createdBy", "name email globalRole");

    res.status(201).json({
      success: true,
      data: ticket,
      message: "Ticket created successfully",
    });
  } catch (error) {
    console.error("Create ticket error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create ticket",
      error: error.message,
    });
  }
};

// Get all tickets (SuperAdmin only)
const getAllTickets = async (req, res) => {
  try {
    if (req.user.globalRole !== "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. SuperAdmin only.",
      });
    }

    const tickets = await Ticket.find()
      .populate("createdBy", "name email globalRole")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: tickets,
      count: tickets.length,
    });
  } catch (error) {
    console.error("Get all tickets error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch tickets",
      error: error.message,
    });
  }
};

// Get current user's tickets
const getMyTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({ createdBy: req.user._id })
      .populate("createdBy", "name email globalRole")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: tickets,
      count: tickets.length,
    });
  } catch (error) {
    console.error("Get my tickets error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch your tickets",
      error: error.message,
    });
  }
};

// Get ticket by ID
const getTicketById = async (req, res) => {
  try {
    const { id } = req.params;

    const ticket = await Ticket.findById(id).populate("createdBy", "name email globalRole");

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    if (
      req.user.globalRole !== "superadmin" &&
      ticket.createdBy._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to view this ticket",
      });
    }

    res.status(200).json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    console.error("Get ticket by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch ticket",
      error: error.message,
    });
  }
};

// Update ticket status (SuperAdmin/TeamLead)
const updateTicketStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    if (!["superadmin", "teamlead"].includes(req.user.globalRole)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. SuperAdmin or TeamLead only.",
      });
    }

    const ticket = await Ticket.findById(id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    ticket.status = status;
    if (remarks) ticket.remarks = remarks;
    ticket.updatedAt = Date.now();

    await ticket.save();
    await ticket.populate("createdBy", "name email globalRole");

    res.status(200).json({
      success: true,
      data: ticket,
      message: "Ticket status updated successfully",
    });
  } catch (error) {
    console.error("Update ticket status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update ticket status",
      error: error.message,
    });
  }
};

// Accept ticket (SuperAdmin only)
const acceptTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminRemarks, estimatedResolutionTime, assignedTo, internalNotes } = req.body;

    if (req.user.globalRole !== "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. SuperAdmin only.",
      });
    }

    const ticket = await Ticket.findById(id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    ticket.status = "Accepted";
    ticket.adminRemarks = adminRemarks;
    ticket.estimatedResolutionTime = estimatedResolutionTime;
    ticket.assignedTo = assignedTo;
    ticket.internalNotes = internalNotes;
    ticket.acceptedBy = req.user._id;
    ticket.acceptedAt = Date.now();
    ticket.updatedAt = Date.now();

    await ticket.save();
    await ticket.populate("createdBy", "name email globalRole");

    res.status(200).json({
      success: true,
      data: ticket,
      message: "Ticket accepted successfully",
    });
  } catch (error) {
    console.error("Accept ticket error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to accept ticket",
      error: error.message,
    });
  }
};

// Reject ticket (SuperAdmin only)
const rejectTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminRemarks, internalNotes } = req.body;

    if (req.user.globalRole !== "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. SuperAdmin only.",
      });
    }

    const ticket = await Ticket.findById(id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    ticket.status = "Rejected";
    ticket.adminRemarks = adminRemarks;
    ticket.internalNotes = internalNotes;
    ticket.rejectedBy = req.user._id;
    ticket.rejectedAt = Date.now();
    ticket.updatedAt = Date.now();

    await ticket.save();
    await ticket.populate("createdBy", "name email globalRole");

    res.status(200).json({
      success: true,
      data: ticket,
      message: "Ticket rejected successfully",
    });
  } catch (error) {
    console.error("Reject ticket error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reject ticket",
      error: error.message,
    });
  }
};

module.exports = {
  createTicket,
  getAllTickets,
  getMyTickets,
  getTicketById,
  updateTicketStatus,
  acceptTicket,
  rejectTicket,
};