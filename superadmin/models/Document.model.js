const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    type: {
        type: String, // 'pdf', 'word', 'image', 'zip', etc.
        required: true
    },
    sentTo: {
        type: String,
        required: true // 'All Clients' or specific Client ID
    },
    size: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ""
    },
    fileUrl: {
        type: String,
        required: true // Path to the file
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SuperAdmin'
    },
    date: {
        type: String, // Storing as YYYY-MM-DD for consistency with frontend, or Date object
        default: () => new Date().toISOString().split('T')[0]
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Document', DocumentSchema);
