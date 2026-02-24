const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

let serviceAccount;

const keyPath = path.join(__dirname, '../serviceAccountKey.json');

// Attempt to load from JSON file first, then fallback to ENV variable
if (fs.existsSync(keyPath)) {
    serviceAccount = require(keyPath);
} else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } catch (e) {
        console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT from .env. Ensure it is a valid JSON string.");
    }
}

if (serviceAccount && !admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log("Firebase Admin Initialized successfully.");
    } catch (err) {
        console.error("Firebase Admin initialization error:", err);
    }
} else {
    console.warn("⚠️ Firebase Admin setup skipped: Provide a 'serviceAccountKey.json' file or 'FIREBASE_SERVICE_ACCOUNT' env variable for Google Auth.");

    // Fallback mock strictly for seeing the frontend flow when credentials aren't ready
    admin.mockVerifyIdToken = async (token) => {
        console.warn("Mock verifying token because Admin is not set up");
        return {
            email: "demo@mockuser.com",
            name: "Demo Google User",
            picture: "",
            uid: "mock-google-id-12345"
        };
    };
}

module.exports = admin;
