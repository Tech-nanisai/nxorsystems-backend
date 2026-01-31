const express = require('express');
const router = express.Router();
const controller = require('../../superadmin/controllers/PromotionalUpdate.controller');
const verifyToken = require('../../GlobalAccess/middleware/verifyToken');

const isClient = (req, res, next) => {
    if (req.user && req.user.role === 'client') {
        return next();
    }
    return res.status(403).json({ message: "Access denied. Clients only." });
};

router.get('/all', verifyToken, isClient, controller.getClientUpdates);
router.post('/react/:updateId', verifyToken, isClient, controller.reactToUpdate);

module.exports = router;
