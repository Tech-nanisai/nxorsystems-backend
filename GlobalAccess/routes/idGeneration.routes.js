// backend/GlobalAccess/routes/idGeneration.routes.js
const express = require("express");
const router = express.Router();

const controller = require("../controllers/idGeneration.controller");
const verifyToken = require("../middleware/verifyToken");
const requireSuperAdmin = require("../middleware/requireSuperAdmin");

router.post("/create", verifyToken, requireSuperAdmin, controller.createID);
router.get("/all", verifyToken, requireSuperAdmin, controller.getAllIDs);
router.put("/approve/:id", verifyToken, requireSuperAdmin, controller.approveID);
router.put("/status/:id", verifyToken, requireSuperAdmin, controller.toggleStatus);
router.delete("/delete/:id", verifyToken, requireSuperAdmin, controller.deleteID);

module.exports = router;
