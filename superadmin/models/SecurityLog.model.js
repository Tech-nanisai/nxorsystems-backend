const mongoose = require("mongoose");

const securityLogSchema = new mongoose.Schema({
    clientID: { type: String, required: true }, // Client ID (e.g. CL10001)
    action: { type: String, required: true }, // e.g., "STATUS_UPDATE", "PASSWORD_RESET", "LOGOUT_ALL"
    details: { type: String, default: "" }, // e.g., "Status changed to Blocked"
    performedBy: { type: String, default: "SuperAdmin" }, // Could be admin ID
    ipAddress: { type: String, default: "" },
}, {
    timestamps: true // createdAt will be used for sorting
});

module.exports = mongoose.model("SecurityLog", securityLogSchema);
