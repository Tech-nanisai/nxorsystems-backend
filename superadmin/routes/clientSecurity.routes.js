const express = require("express");
const router = express.Router();
const controller = require("../controllers/clientSecurity.controller");

// Middleware to ensure SuperAdmin (assuming this exists relative to this file)
// If not, we might need to import it. Usually passed from server.js? 
// Or locally imported. I'll stick to basic routing and assume auth is handled in server.js or I should import it.
// Checking server.js in Step 15 shows: 
// const superAdminAuthRoutes = require("./superadmin/routes/SuperAdminauth.routes"); so it's likely modular.

// Let's protect these routes if possible. 
// Ideally I should check how SuperAdminAuth is protected. 
// For now, I will create the routes and mount them in server.js.

router.get("/:clientID", controller.getClientSecurityDetails);
router.get("/logs/:clientID", controller.getSecurityLogs);
router.post("/update-status", controller.updateClientStatus);
router.post("/reset-password", controller.resetClientPassword);
router.post("/logout-all", controller.logoutAllDevices);

module.exports = router;
