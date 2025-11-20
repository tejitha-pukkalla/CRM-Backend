// import mongoose from "mongoose";

// const ticketSchema = new mongoose.Schema(
//   {
//     ticketId: { type: String, unique: true },
//     title: { type: String, required: true },
//     description: { type: String, required: true },
//     priority: {
//       type: String,
//       enum: ["Low", "Medium", "High"],
//       default: "Low",
//     },
//     category: { type: String, default: "General" },
//     status: {
//       type: String,
//       enum: ["Open", "In Progress", "Closed"],
//       default: "Open",
//     },
//     remarks: { type: String },
//     createdBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },
//     role: { type: String }, // role of the user who created the ticket
//   },
//   { timestamps: true }
// );

// // 🧩 Auto-generate ticket ID
// ticketSchema.pre("save", async function (next) {
//   if (this.isNew) {
//     const count = await mongoose.model("Ticket").countDocuments();
//     this.ticketId = `REQ-${String(count + 1).padStart(4, "0")}`; // e.g., REQ-0001
//   }
//   next();
// });

// // 🧩 Auto-populate creator details (name, email, role)
// ticketSchema.pre(/^find/, function (next) {
//   this.populate("createdBy", "name email role");
//   next();
// });

// const Ticket = mongoose.model("Ticket", ticketSchema);
// export default Ticket;


const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema(
  {
    ticketId: {
      type: String,
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxLength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Low",
    },
    category: {
      type: String,
      enum: ["General", "Bug", "Feature", "Support"],
      default: "General",
    },
    status: {
      type: String,
      enum: ["Open", "In Progress", "Resolved", "Closed", "Accepted", "Rejected", "Pending"],
      default: "Open",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    remarks: {
      type: String,
      trim: true,
    },
    // SuperAdmin specific fields
    adminRemarks: {
      type: String,
      trim: true,
    },
    estimatedResolutionTime: {
      type: String,
      trim: true,
    },
    assignedTo: {
      type: String,
      trim: true,
    },
    internalNotes: {
      type: String,
      trim: true,
    },
    acceptedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    acceptedAt: {
      type: Date,
    },
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    rejectedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
ticketSchema.index({ createdBy: 1, status: 1 });
ticketSchema.index({ ticketId: 1 });

module.exports = mongoose.model("Ticket", ticketSchema);