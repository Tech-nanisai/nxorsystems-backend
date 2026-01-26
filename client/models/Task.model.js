const clientDB = require("../Database/clientDB");

const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema({
  clientID: { type: String, required: true, index: true },
  title: { type: String, required: true },
  isCompleted: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = clientDB.model("Task", TaskSchema);