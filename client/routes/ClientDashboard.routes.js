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

// Task Routes
router.get("/tasks", verifyToken, controller.getTasks);
router.post("/tasks", verifyToken, controller.createTask);
router.patch("/tasks/:id", verifyToken, controller.updateTask);
router.delete("/tasks/:id", verifyToken, controller.deleteTask);

module.exports = router;