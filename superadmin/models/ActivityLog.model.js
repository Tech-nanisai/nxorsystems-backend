const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema({
    module: { type: String, required: true }, // e.g., "Client Management", "ID Generation"
    action: { type: String, required: true }, // e.g., "Invoice Generated", "New Client Registered"
    description: { type: String }, // Details about the update
    performedBy: { type: String, default: "System" }, // User or System
    type: { type: String, enum: ['info', 'warning', 'success', 'error'], default: 'info' },
    metadata: { type: Object }, // Store IDs or relevant JSON data
}, { timestamps: true });

module.exports = mongoose.model("ActivityLog", activityLogSchema);
