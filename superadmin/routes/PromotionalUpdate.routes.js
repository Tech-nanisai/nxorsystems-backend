const express = require('express');
const router = express.Router();
const controller = require('../controllers/PromotionalUpdate.controller');
const verifyToken = require('../../GlobalAccess/middleware/verifyToken');

const isSuperAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'superadmin') {
        return next();
    }
    return res.status(403).json({ message: "Access denied. Super Admin only." });
};

router.post('/create', verifyToken, isSuperAdmin, controller.createUpdate);
router.get('/all', verifyToken, isSuperAdmin, controller.getAllUpdates);
router.delete('/delete/:id', verifyToken, isSuperAdmin, controller.deleteUpdate);

module.exports = router;
