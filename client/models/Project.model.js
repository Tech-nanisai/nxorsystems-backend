const mongoose = require("mongoose");
// 1. Import the specific connection
const clientDB = require("../Database/clientDB");

const ProjectSchema = new mongoose.Schema({
  projectID: { type: String, required: true, unique: true },
  clientID: { type: String, required: true, index: true },
  title: { type: String, required: true },
  description: { type: String, default: "" },
  status: { type: String, enum: ["Pending", "In Progress", "Completed", "Rejected"], default: "Pending" },
  projectType: { type: String, default: "Custom" }, // E.g., E-commerce, Mobile App
  agreementContent: { type: String, default: "" }, // For agreement text/reminders
  deadline: { type: Date },
  progress: { type: Number, default: 0 },
  approvalStatus: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
  approvalDate: { type: Date, default: null },
  rejectionReason: { type: String, default: "" }, // Reason for rejection
}, {
  timestamps: true,
  collection: 'client.projects'
});

// 2. Use clientDB.model()
module.exports = clientDB.model("Project", ProjectSchema);