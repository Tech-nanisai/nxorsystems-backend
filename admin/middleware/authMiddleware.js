// backend/middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin.model");

const JWT_SECRET = process.env.JWT_SECRET || "change_this_secret";

exports.authenticateAdmin = async (req, res, next) => {
  try {
    const token =
      req.headers["authorization"]?.split(" ")[1] ||
      req.body.token ||
      req.query.token;

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const admin = await Admin.findById(decoded.id);

    if (!admin) return res.status(404).json({ message: "Admin not found" });
    if (!admin.isActive) return res.status(403).json({ message: "Admin is inactive" });

    req.admin = admin;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

// Normal admin or super admin
exports.requireAdmin = (req, res, next) => {
  if (!req.admin) return res.status(401).json({ message: "Authentication required" });
  next();
};

// SUPER ADMIN ONLY
exports.requireSuperAdmin = (req, res, next) => {
  if (!req.admin?.isSuperAdmin) {
    return res.status(403).json({ message: "Super Admin only" });
  }
  next();
};
