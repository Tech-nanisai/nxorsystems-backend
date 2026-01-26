//backend/superadmin/routes/SuperAdminauth.routes.js
const express = require("express");
const router = express.Router();

const {
  registerSuperAdmin,
  loginSuperAdmin,
  getCurrentSuperAdmin,
  updateSuperAdminProfilePicture,
  updateSuperAdminProfile,
} = require("../controllers/SuperAdminauth.controller");

const {
  authenticateSuperAdmin,
  requireSuperAdmin,
} = require("../middleware/SuperAdminauth.middleware");

// REGISTER + LOGIN
router.post("/register", registerSuperAdmin);
router.post("/login", loginSuperAdmin);

// CURRENT SUPER ADMIN (used on refresh)
router.get(
  "/me",
  authenticateSuperAdmin,
  requireSuperAdmin,
  getCurrentSuperAdmin
);

// UPDATE PROFILE PICTURE
router.put(
  "/profile-picture",
  authenticateSuperAdmin,
  requireSuperAdmin,
  updateSuperAdminProfilePicture
);

// UPDATE PROFILE DETAILS (fullName, phone, address)
router.put(
  "/profile",
  authenticateSuperAdmin,
  requireSuperAdmin,
  updateSuperAdminProfile
);

module.exports = router;