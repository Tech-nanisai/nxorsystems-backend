const express = require('express');
const router = express.Router();
// Import controller from superadmin module
const controller = require('../../superadmin/controllers/Document.controller');
const verifyToken = require('../../GlobalAccess/middleware/verifyToken');

// Middleware to check if user is client
const isClient = (req, res, next) => {
    if (req.user && req.user.role === 'client') {
        return next();
    }
    return res.status(403).json({ message: "Access denied. Clients only." });
};

router.get('/my-documents', verifyToken, isClient, controller.getClientDocuments);
router.get('/download/:id', verifyToken, isClient, controller.downloadDocument);

module.exports = router;
