const mongoose = require("mongoose");

const PromotionalUpdateSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: ["text", "image", "pdf", "video"],
        default: "text",
    },
    mediaUrl: {
        type: String, // Path to file or YouTube URL
        default: "",
    },
    mediaUrls: {
        type: [String], // Array of paths to files
        default: [],
    },
    youtubeLink: {
        type: String, // Specifically for video type
        default: "",
    },
    youtubeLinks: {
        type: [String],
        default: [],
    },
    targetAudience: {
        type: String,
        enum: ["all", "specific"],
        default: "all",
    },
    targetClients: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Client",
        },
    ],
    reactions: [
        {
            client: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Client",
            },
            status: {
                type: String,
                enum: ["interested", "not_interested"],
            },
            reactedAt: {
                type: Date,
                default: Date.now,
            },
        },
    ],
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("PromotionalUpdate", PromotionalUpdateSchema);
