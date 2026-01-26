const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/clientAuth.controller");
const verifyToken = require("../../GlobalAccess/middleware/verifyToken"); // Adjust path to your middleware

router.post("/verify", ctrl.verifyClientID);
router.post("/register", ctrl.registerClient);
router.post("/login", ctrl.loginClient);
router.post("/forgot-password", ctrl.forgotPassword);
router.post("/reset-password", ctrl.resetPassword);
router.put("/update-profile", verifyToken, ctrl.updateProfile);
router.put("/change-password", verifyToken, ctrl.changePassword);
// Add this route for Context to fetch user data
router.get("/me", verifyToken, ctrl.getMe); 

module.exports = router;
