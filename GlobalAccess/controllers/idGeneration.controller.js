// backend/GlobalAccess/controllers/idGeneration.controller.js
const GlobalID = require("../models/IDGeneration.model");
const Counter = require("../models/Counter.model");
const PREFIXES = require("../config/idPrefixes");
exports.createID = async (req, res) => {
  try {
    const { category, fullName } = req.body;

    if (!category || !fullName || !fullName.trim()) {
      return res.status(400).json({
        message: "Category and Full Name are required",
      });
    }

    const prefix = PREFIXES[category];
    if (!prefix) {
      return res.status(400).json({
        message: "Invalid category",
      });
    }

    /**
     * STEP 1: Ensure counter exists (NO increment here)
     */
    let counter = await Counter.findById("GLOBAL_ID_SEQUENCE");

    if (!counter) {
      counter = await Counter.create({
        _id: "GLOBAL_ID_SEQUENCE",
        seq: 9999, // important
      });
    }

    /**
     * STEP 2: Increment safely
     */
    counter.seq += 1;
    await counter.save();

    const sequenceNumber = counter.seq; // 10000, 10001, ...
    const generatedID = `${prefix}${sequenceNumber}`;

    /**
     * STEP 3: Create ID record
     */
    const record = await GlobalID.create({
      category,
      prefix,
      sequenceNumber,
      generatedID,
      fullName: fullName.trim(),
      // approved: false (default)
      // status: Inactive (default)
    });

    return res.status(201).json({
      success: true,
      data: record,
    });
  } catch (err) {
    console.error("Global ID create error:", err);
    return res.status(500).json({
      message: "ID creation failed",
      error: err.message,
    });
  }
};

/**
 * READ ALL IDS (Admin / SuperAdmin)
 */
exports.getAllIDs = async (req, res) => {
  try {
    const { search = "" } = req.query;

    const filter = search
      ? {
          $or: [
            { generatedID: { $regex: search, $options: "i" } },
            { fullName: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    const data = await GlobalID.find(filter).sort({ createdAt: -1 });

    return res.json({
      success: true,
      data,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Search failed",
      error: err.message,
    });
  }
};


/**
 * APPROVE ID (Super Admin only)
 */
exports.approveID = async (req, res) => {
  try {
    const item = await GlobalID.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "ID not found" });
    }

    if (item.approved) {
      return res.status(400).json({ message: "ID already approved" });
    }

    item.approved = true;
    await item.save();

    return res.json({ success: true, data: item });
  } catch (err) {
    return res.status(500).json({
      message: "Approval failed",
      error: err.message,
    });
  }
};

/**
 * ACTIVATE / DEACTIVATE
 */
exports.toggleStatus = async (req, res) => {
  try {
    const item = await GlobalID.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "ID not found" });
    }

    if (item.status === "Inactive" && !item.approved) {
      return res.status(400).json({
        message: "ID must be approved before activation",
      });
    }

    item.status = item.status === "Active" ? "Inactive" : "Active";
    await item.save();

    return res.json({ success: true, data: item });
  } catch (err) {
    return res.status(500).json({
      message: "Status update failed",
      error: err.message,
    });
  }
};

/**
 * DELETE ID
 * (Counter is NOT affected — sequence remains continuous)
 */
exports.deleteID = async (req, res) => {
  try {
    const item = await GlobalID.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "ID not found" });
    }

    await GlobalID.findByIdAndDelete(req.params.id);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({
      message: "Delete failed",
      error: err.message,
    });
  }
};
