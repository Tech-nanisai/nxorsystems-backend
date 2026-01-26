// backend/routes/admin/adminManagement.routes.js
const express = require("express");
const Admin = require("../../admin/models/Admin.model");
const {
  authenticateAdmin,
  requireSuperAdmin,
} = require("../../admin/middleware/authMiddleware");

const router = express.Router();

// 🔐 All routes here are SUPER ADMIN ONLY
router.use(authenticateAdmin, requireSuperAdmin);

// GET /api/admin/manage/admins
router.get("/admins", async (req, res) => {
  try {
    const admins = await Admin.find({}, "-passwordHash"); // exclude passwordHash

    res.json({
      admins,
    });
  } catch (err) {
    console.error("List admins error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// PATCH /api/admin/manage/admins/:id/toggle-active
router.patch("/admins/:id/toggle-active", async (req, res) => {
  try {
    const { id } = req.params;
    const admin = await Admin.findById(id);

    if (!admin) return res.status(404).json({ message: "Admin not found" });

    // prevent deactivating yourself
    if (String(admin._id) === String(req.admin._id)) {
      return res
        .status(400)
        .json({ message: "You cannot deactivate your own account" });
    }

    admin.isActive = !admin.isActive;
    await admin.save();

    res.json({
      message: "Admin status updated",
      admin: {
        id: admin._id,
        fullName: admin.fullName,
        email: admin.email,
        isActive: admin.isActive,
      },
    });
  } catch (err) {
    console.error("Toggle admin active error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// OPTIONAL: promote/demote super admin
// PATCH /api/admin/manage/admins/:id/super
router.patch("/admins/:id/super", async (req, res) => {
  try {
    const { id } = req.params;
    const { isSuperAdmin } = req.body;

    const admin = await Admin.findById(id);
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    // optional protection: never remove super from yourself if you're the only one
    admin.isSuperAdmin = Boolean(isSuperAdmin);
    await admin.save();

    res.json({
      message: "Admin super status updated",
      admin: {
        id: admin._id,
        fullName: admin.fullName,
        email: admin.email,
        isSuperAdmin: admin.isSuperAdmin,
      },
    });
  } catch (err) {
    console.error("Set super admin error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
