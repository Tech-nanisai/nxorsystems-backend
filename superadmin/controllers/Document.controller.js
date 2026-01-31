const Document = require('../models/Document.model');
const Client = require('../../client/models/ClientnAuth.models');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = 'uploads/documents';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Config
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir)
    },
    filename: function (req, file, cb) {
        // Sanitize filename and append unique timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname)
    }
});

const upload = multer({ storage: storage });

// 1. Upload Document
exports.uploadDocument = [
    upload.single('file'), // middleware to handle file
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ success: false, message: 'No file uploaded' });
            }

            const { name, type, sentTo, description } = req.body;
            const fileSize = (req.file.size / (1024 * 1024)).toFixed(2) + ' MB';

            const newDoc = new Document({
                name: name || req.file.originalname,
                type: type,
                sentTo: sentTo,
                description: description,
                size: fileSize,
                fileUrl: req.file.path.replace(/\\/g, "/"), // normalize path for windows
                uploadedBy: req.user ? req.user.id : null
            });

            await newDoc.save();

            res.status(201).json({ success: true, message: 'Document uploaded successfully', document: newDoc });
        } catch (error) {
            console.error("Upload Error:", error);
            res.status(500).json({ success: false, message: 'Server Error during upload', error: error.message });
        }
    }
];

// 2. Get All Documents (For Super Admin)
exports.getAllDocuments = async (req, res) => {
    try {
        // Sort by newest first
        const docs = await Document.find().sort({ createdAt: -1 });
        res.json({ success: true, documents: docs });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching documents' });
    }
};

// 3. Get Documents for Client
exports.getClientDocuments = async (req, res) => {
    try {
        let clientID = req.user.clientID;

        // If clientID is not in token (which is likely), fetch from DB using ID
        if (!clientID && req.user.id) {
            const client = await Client.findById(req.user.id);
            if (client) {
                clientID = client.clientID;
            }
        }

        if (!clientID) {
            return res.status(400).json({ success: false, message: "Client ID not found for this user" });
        }

        // Build Query
        // Match "All Clients" OR "clientID" (case insensitive)
        const query = {
            $or: [
                { sentTo: "All Clients" },
                { sentTo: clientID },
                { sentTo: { $regex: new RegExp(`^${clientID}$`, 'i') } }
            ]
        };

        const docs = await Document.find(query).sort({ createdAt: -1 });

        res.json({ success: true, documents: docs });
    } catch (error) {
        console.error("Client Fetch Error:", error);
        res.status(500).json({ success: false, message: 'Error fetching client documents' });
    }
};

// 4. Delete Document
exports.deleteDocument = async (req, res) => {
    try {
        const doc = await Document.findById(req.params.id);
        if (!doc) {
            return res.status(404).json({ success: false, message: 'Document not found' });
        }

        // Delete file from fs
        const filePath = path.resolve(doc.fileUrl);
        if (fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath);
            } catch (err) {
                console.error("Error deleting file from disk:", err);
            }
        }

        await Document.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Document deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting document' });
    }
};

// 5. Download Document
exports.downloadDocument = async (req, res) => {
    try {
        const doc = await Document.findById(req.params.id);
        if (!doc) return res.status(404).json({ message: "File not found" });

        const filePath = path.resolve(doc.fileUrl);
        if (fs.existsSync(filePath)) {
            // Ensure filename has correct extension from the actual file
            const ext = path.extname(doc.fileUrl); // e.g., .pdf
            let downloadName = doc.name;

            // If the name stored in DB doesn't end with the correct extension, append it
            if (ext && !downloadName.toLowerCase().endsWith(ext.toLowerCase())) {
                downloadName += ext;
            }

            res.download(filePath, downloadName);
        } else {
            res.status(404).json({ message: "File not present on server" });
        }
    } catch (e) {
        console.error("Download Error:", e);
        res.status(500).json({ message: "Error downloading file" });
    }
}
