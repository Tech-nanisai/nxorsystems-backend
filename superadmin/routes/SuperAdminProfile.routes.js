// //backend/superadmin/routes/SuperAdminProfile.routes.js
// const express = require("express");
// const router = express.Router();

// // correct middleware imports
// const {
//   authenticateSuperAdmin,
//   requireSuperAdmin,
// } = require("../middleware/SuperAdminauth.middleware");

// // correct controller import
// const {
//   getProfile,
//   uploadProfilePicture,
// } = require("../controllers/SuperAdminProfile.controller");

// // GET SUPER ADMIN PROFILE
// router.get(
//   "/me",
//   authenticateSuperAdmin,
//   requireSuperAdmin,
//   getProfile
// );

// // UPLOAD PROFILE PICTURE
// router.post(
//   "/profile-picture",
//   authenticateSuperAdmin,
//   requireSuperAdmin,
//   uploadProfilePicture
// );

// module.exports = router;
