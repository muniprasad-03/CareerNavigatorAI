require('dotenv').config();
const mongoose = require('mongoose');

async function test() {
    try {
        console.log("Connecting to:", process.env.MONGO_URI.split('@')[1]); // Log part of it for safety
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000,
            tlsAllowInvalidCertificates: true
        });
        print("Connected!");
        const databases = await mongoose.connection.db.admin().listDatabases();
        console.log("Databases:", databases.databases.map(d => d.name));
        process.exit(0);
    } catch (err) {
        console.error("FAILED:", err);
        process.exit(1);
    }
}

test();
