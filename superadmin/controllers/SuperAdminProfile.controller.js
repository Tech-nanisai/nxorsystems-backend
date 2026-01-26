// backend/superadmin/controllers/SuperAdminProfile.controller.js
const SuperAdmin = require("../models/SuperAdminauth.models");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "superadmin_secret_key";
const JWT_EXPIRES_IN = "8h";

// REGISTER SUPER ADMIN (ONLY ONCE)
exports.registerSuperAdmin = async (req, res) => {
  try {
    const { fullName, email, password, secretKey, phoneNumber, address } =
      req.body;

    if (!fullName || !email || !password || !secretKey) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // ONLY ONE SUPER ADMIN
    const alreadySuperAdmin = await SuperAdmin.findOne({});
    if (alreadySuperAdmin) {
      return res.status(403).json({
        message: "A Super Admin is already created. Please login instead.",
      });
    }

    // SECRET KEY CHECK
    if (secretKey !== process.env.SUPER_ADMIN_SECRET) {
      return res.status(401).json({ message: "Invalid Secret Key" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newSuperAdmin = await SuperAdmin.create({
      fullName,
      email: email.toLowerCase(),
      passwordHash,
      isSuperAdmin: true,
      phoneNumber: phoneNumber || "",
      address: address || "",
    });

    return res.status(201).json({
      success: true,
      message: "Super Admin created successfully",
      superAdmin: {
        id: newSuperAdmin._id,
        fullName: newSuperAdmin.fullName,
        email: newSuperAdmin.email,
        role: newSuperAdmin.role,
        phoneNumber: newSuperAdmin.phoneNumber || "",
        address: newSuperAdmin.address || "",
        profilePicture: newSuperAdmin.profilePicture || "",
      },
    });
  } catch (err) {
    console.error("registerSuperAdmin Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

// LOGIN SUPER ADMIN
exports.loginSuperAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const superAdmin = await SuperAdmin.findOne({ email: email.toLowerCase() });

    if (!superAdmin) {
      return res.status(401).json({ message: "Invalid Email or Password" });
    }

    const match = await superAdmin.checkPassword(password);
    if (!match) {
      return res.status(401).json({ message: "Invalid Email or Password" });
    }

    const token = jwt.sign(
      { id: superAdmin._id, role: superAdmin.role },
      JWT_SECRET,
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
        phoneNumber: superAdmin.phoneNumber || "",
        address: superAdmin.address || "",
        profilePicture: superAdmin.profilePicture || "",
      },
    });
  } catch (err) {
    console.error("loginSuperAdmin Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

// GET CURRENT SUPER ADMIN
exports.getCurrentSuperAdmin = async (req, res) => {
  try {
    const sa = req.superAdmin; // from middleware

    if (!sa) {
      return res.status(404).json({ message: "Super Admin not found" });
    }

    return res.json({
      success: true,
      superAdmin: {
        id: sa._id,
        fullName: sa.fullName,
        email: sa.email,
        role: sa.role,
        phoneNumber: sa.phoneNumber || "",
        address: sa.address || "",
        profilePicture: sa.profilePicture || "",
      },
    });
  } catch (err) {
    console.error("getCurrentSuperAdmin Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

// UPDATE SUPER ADMIN PROFILE PICTURE
exports.updateSuperAdminProfilePicture = async (req, res) => {
  try {
    const sa = req.superAdmin;
    const { imageBase64 } = req.body;

    if (!imageBase64)
      return res
        .status(400)
        .json({ success: false, message: "No image provided" });

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
        phoneNumber: sa.phoneNumber || "",
        address: sa.address || "",
        profilePicture: sa.profilePicture,
      },
    });
  } catch (err) {
    console.error("Upload Error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

// ======================================
// NEW: UPDATE TEXT PROFILE (NO EMAIL)
// ======================================
exports.updateSuperAdminProfile = async (req, res) => {
  try {
    const sa = req.superAdmin;

    const { fullName, phoneNumber, address } = req.body;

    if (!fullName) {
      return res
        .status(400)
        .json({ success: false, message: "Full name is required." });
    }

    sa.fullName = fullName;
    sa.phoneNumber = phoneNumber || "";
    sa.address = address || "";

    await sa.save();

    return res.json({
      success: true,
      message: "Profile updated successfully",
      superAdmin: {
        id: sa._id,
        fullName: sa.fullName,
        email: sa.email,
        role: sa.role,
        phoneNumber: sa.phoneNumber || "",
        address: sa.address || "",
        profilePicture: sa.profilePicture || "",
      },
    });
  } catch (err) {
    console.error("updateSuperAdminProfile Error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};
