const mongoose = require("mongoose");

// Create a separate connection for the 'client' database
if (!process.env.CLIENT_MONGO_URI) {
  throw new Error("CLIENT_MONGO_URI is missing in environment variables");
}
const clientDB = mongoose.createConnection(process.env.CLIENT_MONGO_URI);

clientDB.on("connected", () => {
  console.log("✅ Client DB connected successfully");
});

clientDB.on("error", (err) => {
  console.error("❌ Client DB Connection Error:", err);
});

module.exports = clientDB;