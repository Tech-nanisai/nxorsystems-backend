// backend/routes/admin/adminAuth.routes.js
const express = require("express");
const {
  loginAdmin,
  registerAdmin,
} = require("../controllers/adminAuth.controller");
const {
  authenticateAdmin,
  requireAdmin,
} = require("../middleware/authMiddleware");

const router = express.Router();

// 1️⃣ One-time / secure registration (using Admin Secret Key)
router.post("/register", registerAdmin);

// 2️⃣ Normal login route used by frontend
router.post("/login", loginAdmin);

// 3️⃣ Get current logged-in admin (for "who am I?" or settings page)
router.get("/me", authenticateAdmin, requireAdmin, (req, res) => {
  const admin = req.admin;
  return res.json({
    admin: {
      id: admin._id,
      fullName: admin.fullName,
      email: admin.email,
      role: admin.role,
      isSuperAdmin: admin.isSuperAdmin,
      isActive: admin.isActive,
      lastLoginAt: admin.lastLoginAt,
    },
  });
});

router.get("/check-first-admin", async (req, res) => {
  try {
    const count = await Admin.countDocuments({});
    res.json({ exists: count > 0 });
  } catch (err) {
    res.status(500).json({ exists: true });
  }
});

module.exports = router;
