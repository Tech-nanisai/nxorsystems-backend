const express = require("express");
const router = express.Router();
const controller = require("../controllers/clientDashboard.controller");
const verifyToken = require("../../GlobalAccess/middleware/verifyToken");

// Protected Route: Only logged-in clients can access
router.get("/stats", verifyToken, controller.getDashboardStats);
router.get("/invoices", verifyToken, controller.getInvoices);
router.get("/invoice/:id", verifyToken, controller.getInvoiceDetails);
router.get("/my-projects", verifyToken, controller.getMyProjects);
router.post("/project-approval", verifyToken, controller.updateProjectApproval);

module.exports = router;