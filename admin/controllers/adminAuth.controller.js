// backend/controllers/auth/adminAuth.controller.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin.model");

const JWT_SECRET = process.env.JWT_SECRET || "change_this_in_env";
const JWT_EXPIRES_IN = "8h";
const ADMIN_SETUP_SECRET = process.env.ADMIN_SETUP_SECRET || "my-setup-secret";

// ===============================
//  REGISTER ADMIN (Super-secure)
// ===============================
exports.registerAdmin = async (req, res) => {
  try {
    const { fullName, email, password, adminSecretKey } = req.body;

    if (!fullName || !email || !password || !adminSecretKey) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // ✅ Verify Admin Secret Key
    if (adminSecretKey !== ADMIN_SETUP_SECRET) {
      return res.status(403).json({ message: "Invalid Admin Secret Key" });
    }

    const existing = await Admin.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // For your first admin, you can manually set isSuperAdmin = true in MongoDB
    const admin = await Admin.create({
      fullName,
      email: email.toLowerCase(),
      passwordHash,
      // isSuperAdmin: true   // 👈 you can set manually later via DB or a special route
    });

    return res.status(201).json({
      message: "Admin created",
      admin: {
        id: admin._id,
        fullName: admin.fullName,
        email: admin.email,
        role: admin.role,
        isSuperAdmin: admin.isSuperAdmin,
      },
    });
  } catch (err) {
    console.error("registerAdmin error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ===============================
//  LOGIN ADMIN
//  POST /api/admin/auth/login
// ===============================
exports.loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!admin.isActive) {
      return res.status(403).json({ message: "Admin account is deactivated" });
    }

    const isMatch = await admin.checkPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: admin._id, isSuperAdmin: admin.isSuperAdmin },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.json({
      message: "Login successful",
      token,
      admin: {
        id: admin._id,
        fullName: admin.fullName,
        email: admin.email,
        isSuperAdmin: admin.isSuperAdmin
      }
    });
  } catch (err) {
    console.error("loginAdmin error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
