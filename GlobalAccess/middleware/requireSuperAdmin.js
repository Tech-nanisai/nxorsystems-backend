// backend/GlobalAccess/middleware/requireSuperAdmin.js
module.exports = function requireSuperAdmin(req, res, next) {
  if (req.user?.role !== "superadmin") {
    return res.status(403).json({ message: "SuperAdmin only" });
  }
  next();
};
