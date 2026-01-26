const mongoose = require("mongoose");

// URI provided by user
const URI = "mongodb+srv://attarisai5_db_user:hevsuLyW4DOahaV8@main-portal.lxysbsj.mongodb.net/authentications?retryWrites=true&w=majority";

async function dropBadIndex() {
    try {
        console.log("Connecting to MongoDB Atlas...");
        await mongoose.connect(URI);
        console.log("Connected.");

        const db = mongoose.connection.db;
        const collection = db.collection("clients");

        // List Indexes
        const indexes = await collection.indexes();
        console.log("Current Indexes:", indexes);

        // Attempt to drop 'clientId_1'
        const badIndex = indexes.find(idx => idx.name === "clientId_1");
        if (badIndex) {
            console.log("Found problematic index 'clientId_1'. Dropping...");
            await collection.dropIndex("clientId_1");
            console.log("Successfully dropped 'clientId_1'.");
        } else {
            console.log("Index 'clientId_1' not found. It might have consistently named 'clientId' or it's already gone.");

            // Look for any index on 'clientId' field specifically
            for (const idx of indexes) {
                if (idx.key.clientId) {
                    console.log(`Found an index on 'clientId': ${idx.name}. Dropping...`);
                    await collection.dropIndex(idx.name);
                    console.log("Dropped.");
                }
            }
        }

        // Also drop clientID_1 if it is not sparse, just to be safe so Mongoose can recreate it with sparse: true from the code
        const goodIndex = indexes.find(idx => idx.name === "clientID_1");
        if (goodIndex) {
            console.log("Note: 'clientID_1' (uppercase) exists. If you changed schema options (like sparse), you might want to drop this too to let Mongoose recreate it.");
            // Optional: await collection.dropIndex("clientID_1");
        }

        console.log("Operation Complete.");

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await mongoose.disconnect();
    }
}

dropBadIndex();
