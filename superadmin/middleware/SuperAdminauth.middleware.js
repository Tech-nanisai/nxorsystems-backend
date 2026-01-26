//backend/superadmin/middleware/SuperAdminauth.middleware.js
const jwt = require("jsonwebtoken");
const SuperAdmin = require("../models/SuperAdminauth.models");

const JWT_SECRET = process.env.JWT_SECRET || "superadmin_secret_key";

exports.authenticateSuperAdmin = async (req, res, next) => {
  try {
    const token =
      req.headers.authorization?.split(" ")[1] ||
      req.body.token ||
      req.query.token;

    if (!token) {
      return res.status(401).json({ message: "Super Admin token missing" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const superAdmin = await SuperAdmin.findById(decoded.id);

    if (!superAdmin) {
      return res.status(404).json({ message: "Super Admin not found" });
    }

    req.superAdmin = superAdmin;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

// MUST BE SUPER ADMIN
exports.requireSuperAdmin = (req, res, next) => {
  if (!req.superAdmin?.isSuperAdmin) {
    return res.status(403).json({ message: "Super Admin access required" });
  }
  next();
};