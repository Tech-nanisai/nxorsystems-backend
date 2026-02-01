const clientDB = require("../Database/clientDB");

const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema({
  clientID: { type: String, required: true, index: true },
  projectID: { type: String, default: null }, // Link to a project
  title: { type: String, required: true },
  description: { type: String, default: "" },
  status: { type: String, enum: ["Pending", "In Progress", "Completed", "Review"], default: "Pending" },
  priority: { type: String, enum: ["High", "Medium", "Low"], default: "Medium" },
  dueDate: { type: Date, default: null },
  isPersonal: { type: Boolean, default: false }, // If created by Client
  isCompleted: { type: Boolean, default: false }, // Legacy support / Computed
}, { timestamps: true, collection: 'client.tasks' });

module.exports = clientDB.model("Task", TaskSchema);