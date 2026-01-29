const admin = require("firebase-admin");

function getServiceAccount() {
  const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  const base64Json = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

  if (rawJson) {
    return JSON.parse(rawJson);
  }

  if (base64Json) {
    const decoded = Buffer.from(base64Json, "base64").toString("utf-8");
    return JSON.parse(decoded);
  }

  throw new Error(
    "Missing Firebase service account. Set FIREBASE_SERVICE_ACCOUNT or FIREBASE_SERVICE_ACCOUNT_BASE64."
  );
}

function getFirestore() {
  if (!admin.apps.length) {
    const serviceAccount = getServiceAccount();
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }

  return admin.firestore();
}

module.exports = { getFirestore };
