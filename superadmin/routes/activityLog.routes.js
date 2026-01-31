const express = require("express");
const router = express.Router();
const controller = require("../controllers/activityLog.controller");

router.get("/recent", controller.getRecentUpdates);

module.exports = router;
