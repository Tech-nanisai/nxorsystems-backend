const express = require('express');
const router = express.Router();
const controller = require('../controllers/Document.controller');
// Adjust path to middleware as needed
const verifyToken = require('../../GlobalAccess/middleware/verifyToken');
// OR verifySuperAdmin if available, verifying token usually enough if we check role, but let's assume verifyToken is generic

// Middleware to check if user is superadmin (simplification)
const isSuperAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'superadmin') {
        return next();
    }
    return res.status(403).json({ message: "Access denied. Super Admin only." });
};

// Routes
router.post('/upload', verifyToken, isSuperAdmin, controller.uploadDocument);
router.get('/all', verifyToken, isSuperAdmin, controller.getAllDocuments);
router.delete('/:id', verifyToken, isSuperAdmin, controller.deleteDocument);
router.get('/download/:id', verifyToken, controller.downloadDocument); // Shared?

module.exports = router;
