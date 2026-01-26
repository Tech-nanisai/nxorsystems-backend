const express = require("express");
const router = express.Router();
const controller = require("../controllers/superadminData.controller");

// Routes for Super Admin to create data
// Routes for Super Admin to create data
router.post("/create-project", controller.createProject);
router.get("/all-projects", controller.getAllProjects);
router.get("/client-projects/:clientID", controller.getProjectsByClientID);
router.get("/project/:id", controller.getProjectById);
router.put("/update-project/:id", controller.updateProject);

router.post("/create-invoice", controller.createInvoice);
router.get("/all-invoices", controller.getAllInvoices);
router.get("/client-invoices/:clientID", controller.getInvoicesByClientID);
router.get("/invoice/:id", controller.getInvoiceById);
router.delete("/invoice/:id", controller.deleteInvoice);

module.exports = router;