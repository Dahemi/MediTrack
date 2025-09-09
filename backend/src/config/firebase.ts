import admin from "firebase-admin";
import "dotenv/config";

// Initialize Firebase Admin SDK (single initialization)
if (!admin.apps.length) {
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
    const privateKeyId = process.env.FIREBASE_PRIVATE_KEY_ID;
    const clientId = process.env.FIREBASE_CLIENT_ID;
    const clientX509CertUrl = process.env.FIREBASE_CLIENT_X509_CERT_URL;

    if (!projectId || !clientEmail || !privateKey) {
      console.error("Missing Firebase environment variables:", {
        projectId: !!projectId,
        clientEmail: !!clientEmail,
        privateKey: !!privateKey,
      });
      throw new Error(
        "Missing Firebase service account environment variables."
      );
    }

    console.log("Initializing Firebase with project:", projectId);

    const serviceAccount = {
      type: "service_account",
      project_id: projectId,
      private_key_id: privateKeyId,
      private_key: privateKey,
      client_email: clientEmail,
      client_id: clientId,
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: clientX509CertUrl,
      universe_domain: "googleapis.com",
    };

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    });

    console.log("Firebase Admin initialized successfully");
  } catch (error) {
    console.error("Firebase initialization error:", error);
    throw error;
  }
}

export default admin;
