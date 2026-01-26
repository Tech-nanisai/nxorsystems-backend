// backend/superadmin/controllers/SuperAdminauth.controller.js

const SuperAdmin = require("../models/SuperAdminauth.models");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_EXPIRES_IN = "8h";

// ==========================================
// REGISTER SUPER ADMIN (ONLY ONCE)
// ==========================================
exports.registerSuperAdmin = async (req, res) => {
  try {
    const { fullName, email, password, secretKey } = req.body;

    if (!fullName || !email || !password || !secretKey) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Allow ONLY ONE Super Admin
    const alreadyExists = await SuperAdmin.findOne({});
    if (alreadyExists) {
      return res.status(403).json({
        message: "A Super Admin already exists. Please login.",
      });
    }

    // Validate secret key (one-time only)
    if (secretKey !== process.env.SUPER_ADMIN_SECRET) {
      return res.status(401).json({ message: "Invalid Secret Key" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newSuperAdmin = await SuperAdmin.create({
      fullName: fullName.trim(),
      email: email.toLowerCase(),
      passwordHash,
      role: "superadmin",
      isSuperAdmin: true,
    });

    return res.status(201).json({
      success: true,
      message: "Super Admin created successfully",
      superAdmin: {
        id: newSuperAdmin._id,
        fullName: newSuperAdmin.fullName,
        email: newSuperAdmin.email,
        role: newSuperAdmin.role,
        profilePicture: newSuperAdmin.profilePicture || "",
        phone: newSuperAdmin.phone || "",
        address: newSuperAdmin.address || "",
      },
    });
  } catch (err) {
    console.error("registerSuperAdmin Error:", err);
    return res.status(500).json({ message: "Server Error" });
  }
};

// ==========================================
// LOGIN SUPER ADMIN
// ==========================================
exports.loginSuperAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const superAdmin = await SuperAdmin.findOne({
      email: email.toLowerCase(),
    });

    if (!superAdmin) {
      return res.status(401).json({ message: "Invalid Email or Password" });
    }

    const match = await superAdmin.checkPassword(password);
    if (!match) {
      return res.status(401).json({ message: "Invalid Email or Password" });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.warn(
        "⚠️ JWT_SECRET is not set. Using fallback secret. Set JWT_SECRET in .env"
      );
    }

    const token = jwt.sign(
      {
        id: superAdmin._id,
        role: superAdmin.role,
      },
      secret || "superadmin_secret_key",
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.json({
      message: "Login successful",
      token,
      superAdmin: {
        id: superAdmin._id,
        fullName: superAdmin.fullName,
        email: superAdmin.email,
        role: superAdmin.role,
        profilePicture: superAdmin.profilePicture || "",
        phone: superAdmin.phone || "",
        address: superAdmin.address || "",
      },
    });
  } catch (err) {
    console.error("loginSuperAdmin Error:", err);
    return res.status(500).json({ message: "Server Error" });
  }
};

// ==========================================
// GET CURRENT SUPER ADMIN (TOKEN BASED)
// ==========================================
exports.getCurrentSuperAdmin = async (req, res) => {
  try {
    const sa = req.superAdmin;

    if (!sa) {
      return res.status(404).json({ message: "Super Admin not found" });
    }

    return res.json({
      success: true,
      superAdmin: {
        id: sa._id,
        fullName: sa.fullName,
        email: sa.email,
        phone: sa.phone || "",
        address: sa.address || "",
        role: sa.role,
        profilePicture: sa.profilePicture || "",
      },
    });
  } catch (err) {
    console.error("getCurrentSuperAdmin Error:", err);
    return res.status(500).json({ message: "Server Error" });
  }
};

// ==========================================
// UPDATE PROFILE PICTURE
// ==========================================
exports.updateSuperAdminProfilePicture = async (req, res) => {
  try {
    const sa = req.superAdmin;
    const { imageBase64 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({
        success: false,
        message: "No image provided",
      });
    }

    sa.profilePicture = imageBase64;
    await sa.save();

    return res.json({
      success: true,
      message: "Profile picture updated successfully",
      superAdmin: {
        id: sa._id,
        fullName: sa.fullName,
        email: sa.email,
        role: sa.role,
        profilePicture: sa.profilePicture,
        phone: sa.phone || "",
        address: sa.address || "",
      },
    });
  } catch (err) {
    console.error("Profile picture update error:", err);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// ==========================================
// UPDATE PROFILE DETAILS
// ==========================================
exports.updateSuperAdminProfile = async (req, res) => {
  try {
    const sa = req.superAdmin;
    const { fullName, phone, address } = req.body;

    if (typeof fullName === "string" && fullName.trim()) {
      sa.fullName = fullName.trim();
    }

    if (typeof phone === "string") {
      sa.phone = phone.trim();
    }

    if (typeof address === "string") {
      sa.address = address.trim();
    }

    await sa.save();

    return res.json({
      success: true,
      message: "Profile updated successfully",
      superAdmin: {
        id: sa._id,
        fullName: sa.fullName,
        email: sa.email,
        phone: sa.phone,
        address: sa.address,
        role: sa.role,
        profilePicture: sa.profilePicture,
      },
    });
  } catch (err) {
    console.error("updateSuperAdminProfile Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
