const mongoose = require("mongoose");
const path = require("path");

// Load ENV variables
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/NXOR_DB";

async function fixIndices() {
    try {
        console.log("Starting index fix process...");

        // Connect to the DB where the clients collection lives
        // Note: The error message says 'authentications.clients', which implies database 'authentications' or collection 'authentications.clients' inside default db.
        // The previous error showed: "duplicate key error collection: authentications.clients"
        // This typically means the Database name is 'authentications'.

        // Let's connect to the specific URI if it's different, or default one.
        // Assuming MONGO_URI points to the correct cluster.
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB.");

        const db = mongoose.connection.db;

        // We need to access the 'clients' collection.
        // Based on the error 'authentications.clients', if the default db in URI is NOT 'authentications', we might need to switch or the URI is assumed to be correct context.
        // However, Mongoose models usually define the connection. 
        // In ClientnAuth.models.js, it uses default connection.

        const collection = db.collection("clients");

        console.log("Dropping problematic indexes...");

        try {
            // Attempt to drop the specific index causing issues: clientId_1
            // The error said: "index: clientId_1 dup key: { clientId: null }"
            const result = await collection.dropIndex("clientId_1");
            console.log("Dropped index 'clientId_1':", result);
        } catch (e) {
            console.log("Could not drop index 'clientId_1' (maybe it doesn't exist or name mismatch):", e.message);
        }

        // Also drop the sparse one if it exists, or recreate it correctly
        try {
            // Checking existing indexes
            const indexes = await collection.indexes();
            console.log("Current indexes:", indexes);
        } catch (e) {
            console.log("Error fetching indexes:", e.message);
        }

        console.log("Index cleanup complete. Please restart your backend and application.");

    } catch (err) {
        console.error("Critical Error:", err);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected.");
    }
}

fixIndices();
