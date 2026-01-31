const mongoose = require("mongoose");

// Create a separate connection for the 'superadmin' database
// Ensure your .env has SUPER_ADMIN_MONGO_URI defined
const superAdminDB = mongoose.createConnection(process.env.SUPER_ADMIN_MONGO_URI);

superAdminDB.on("connected", () => {
    console.log("✅ SuperAdmin DB connected successfully");
});

superAdminDB.on("error", (err) => {
    console.error("❌ SuperAdmin DB Connection Error:", err);
});

module.exports = superAdminDB;
