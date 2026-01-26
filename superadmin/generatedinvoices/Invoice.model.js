const mongoose = require("mongoose");
// Import the specific SuperAdmin connection
const superAdminDB = require("../Database/superAdminDB");

// Schema definition
const invoiceSchema = new mongoose.Schema(
    {
        clientID: {
            type: String,
            required: true,
            uppercase: true,
            trim: true,
        },
        amount: {
            type: Number,
            required: true,
            min: 0,
        },
        paidAmount: {
            type: Number,
            default: 0,
            min: 0,
        },
        dueAmount: {
            type: Number,
            default: 0,
            min: 0,
        },
        status: {
            type: String,
            enum: ["Due", "Paid", "Partial/Due", "Overdue"],
            default: "Due",
        },
        date: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
        collection: "generatedinvoices", // Collection name inside 'superadmin' DB
    }
);

// Use the superAdminDB connection
module.exports = superAdminDB.model("GeneratedInvoice", invoiceSchema);
