const Client = require("../../client/models/ClientnAuth.models");
const SecurityLog = require("../models/SecurityLog.model");
const bcrypt = require("bcryptjs");

// Helper to Create Log
const createLog = async (clientID, action, details, performedBy = "SuperAdmin") => {
    try {
        await SecurityLog.create({
            clientID,
            action,
            details,
            performedBy
        });
    } catch (error) {
        console.error("Error creating security log:", error);
    }
};

// 1. Get Client Security Details
exports.getClientSecurityDetails = async (req, res) => {
    try {
        const { clientID } = req.params;
        const client = await Client.findOne({ clientID }).select("-passwordHash");

        if (!client) {
            return res.status(404).json({ message: "Client not found" });
        }

        res.status(200).json(client);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// 2. Update Client Status
exports.updateClientStatus = async (req, res) => {
    try {
        const { clientID, status } = req.body;
        const client = await Client.findOne({ clientID });

        if (!client) {
            return res.status(404).json({ message: "Client not found" });
        }

        const oldStatus = client.status;
        client.status = status;
        await client.save();

        // Log Action
        await createLog(clientID, "STATUS_UPDATE", `Status changed from ${oldStatus} to ${status}`);

        res.status(200).json({ message: "Client status updated successfully", client });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// 3. Reset Client Password
exports.resetClientPassword = async (req, res) => {
    try {
        const { clientID, newPassword } = req.body;
        const client = await Client.findOne({ clientID });

        if (!client) {
            return res.status(404).json({ message: "Client not found" });
        }

        const salt = await bcrypt.genSalt(10);
        client.passwordHash = await bcrypt.hash(newPassword, salt);

        // Also revoke sessions on password change for security
        client.tokenVersion += 1;

        await client.save();

        await createLog(clientID, "PASSWORD_RESET", "Password reset by SuperAdmin. Sessions revoked.");

        res.status(200).json({ message: "Password reset successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// 4. Logout All Devices (Revoke Sessions)
exports.logoutAllDevices = async (req, res) => {
    try {
        const { clientID } = req.body;
        const client = await Client.findOne({ clientID });

        if (!client) {
            return res.status(404).json({ message: "Client not found" });
        }

        client.tokenVersion += 1;
        await client.save();

        await createLog(clientID, "LOGOUT_ALL", "All sessions revoked (Token Version Incremented)");

        res.status(200).json({ message: "All devices logged out successfully", tokenVersion: client.tokenVersion });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// 5. Get Security Logs
exports.getSecurityLogs = async (req, res) => {
    try {
        const { clientID } = req.params;
        const logs = await SecurityLog.find({ clientID }).sort({ createdAt: -1 });
        res.status(200).json(logs);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};
