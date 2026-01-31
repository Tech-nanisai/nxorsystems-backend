// backend/GlobalAccess/db/superadmin.db.js
const mongoose = require("mongoose");

if (!process.env.SUPER_ADMIN_MONGO_URI) {
  throw new Error(
    "❌ SUPER_ADMIN_MONGO_URI is missing in environment variables"
  );
}

const superAdminDB = mongoose.createConnection(
  process.env.SUPER_ADMIN_MONGO_URI,
  {
    serverSelectionTimeoutMS: 10000,
  }
);

superAdminDB.once("open", () => {
  console.log("🔥 GlobalAccess (SuperAdmin) DB connected");
});

superAdminDB.on("error", (err) => {
  console.error("❌ GlobalAccess DB error:", err);
});

module.exports = superAdminDB;
