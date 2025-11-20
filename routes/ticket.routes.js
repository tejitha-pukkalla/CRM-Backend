// // const express = require("express");
// // const { protect } = require("../middlewares/auth");
// // const {
// //   createTicket,
// //   getAllTickets,
// //   getMyTickets,
// //   updateTicketStatus,
// // } = require("../controllers/ticket.controller");

// // const router = express.Router();

// // router.post("/", protect, createTicket);
// // router.get("/", protect, getAllTickets);
// // router.get("/my-tickets", protect, getMyTickets);
// // router.put("/:id/status", protect, updateTicketStatus);

// // module.exports = router;
// const express = require("express");
// const { protect } = require("../middlewares/auth");
// const{ createTicket, getAllTickets, getMyTickets, updateTicketStatus }=require("../controllers/ticket.controller");

// const router = express.Router();

// // Create a new ticket (all authenticated users)
// router.post("/", protect, createTicket);

// // Get all tickets (SuperAdmin only - middleware should check role)
// router.get("/", protect, getAllTickets);

// // Get current user's tickets
// router.get("/my-tickets", protect, getMyTickets);

// // Update ticket status (SuperAdmin/TeamLead only - middleware should check role)
// router.put("/:id/status", protect, updateTicketStatus);

// module.exports=router;
   

const express = require("express");
const { protect } = require("../middlewares/auth");
const {
  createTicket,
  getAllTickets,
  getMyTickets,
  getTicketById,
  updateTicketStatus,
  acceptTicket,
  rejectTicket,
  applyLeave,
} = require("../controllers/ticket.controller");

const router = express.Router();

// Create a new ticket (all authenticated users)
router.post("/", protect, createTicket);

// Get all tickets (SuperAdmin only)
router.get("/", protect, getAllTickets);

// Get current user's tickets
router.get("/my-tickets", protect, getMyTickets);

// Get ticket by ID
router.get("/:id", protect, getTicketById);

// Update ticket status (SuperAdmin/TeamLead only)
router.put("/:id/status", protect, updateTicketStatus);

// Accept ticket (SuperAdmin only)
router.put("/:id/accept", protect, acceptTicket);

// Reject ticket (SuperAdmin only)
router.put("/:id/reject", protect, rejectTicket);





module.exports = router;