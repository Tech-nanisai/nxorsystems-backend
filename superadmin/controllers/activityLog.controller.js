const ActivityLog = require("../models/ActivityLog.model");

// Get recent updates (limit 15)
exports.getRecentUpdates = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 15;
        const logs = await ActivityLog.find()
            .sort({ createdAt: -1 })
            .limit(limit);

        res.status(200).json({ success: true, data: logs });
    } catch (error) {
        console.error("Error fetching updates:", error);
        res.status(500).json({ success: false, message: "Failed to fetch updates" });
    }
};

// Internal helper to create log (can be exported if needed elsewhere)
exports.createLog = async (module, action, description, type = 'info', performedBy = 'System', metadata = {}) => {
    try {
        await ActivityLog.create({
            module,
            action,
            description,
            type,
            performedBy,
            metadata
        });
    } catch (error) {
        console.error("Error creating activity log:", error);
    }
};
