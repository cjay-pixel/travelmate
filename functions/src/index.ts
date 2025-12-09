/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {setGlobalOptions} from "firebase-functions";
import {onCall} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";

admin.initializeApp();

const SUPER_ADMIN_EMAIL = "superadmin@gmail.com";

// Function to migrate all Firebase Auth users to Firestore
export const migrateAuthUsersToFirestore = onCall(async (request) => {
  try {
    // Check if caller is super admin
    const callerEmail = request.auth?.token?.email;
    if (callerEmail !== SUPER_ADMIN_EMAIL) {
      throw new Error("Unauthorized: Only super admin can migrate users");
    }

    const listUsersResult = await admin.auth().listUsers();
    const batch = admin.firestore().batch();
    let migratedCount = 0;

    for (const userRecord of listUsersResult.users) {
      const userRef = admin.firestore().collection("users").doc(userRecord.uid);
      
      // Determine role
      const role = userRecord.email === SUPER_ADMIN_EMAIL ? "super_admin" : "user";
      
      batch.set(userRef, {
        email: userRecord.email || null,
        displayName: userRecord.displayName || null,
        photoURL: userRecord.photoURL || null,
        role: role,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        phoneNumber: userRecord.phoneNumber || null,
        emailVerified: userRecord.emailVerified,
      }, { merge: true });
      
      migratedCount++;
    }

    await batch.commit();

    logger.info(`Successfully migrated ${migratedCount} users to Firestore`);
    return {
      success: true,
      message: `Successfully migrated ${migratedCount} users`,
      count: migratedCount,
    };
  } catch (error) {
    logger.error("Error migrating users:", error);
    throw new Error(`Migration failed: ${error}`);
  }
});

setGlobalOptions({ maxInstances: 10 });

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
