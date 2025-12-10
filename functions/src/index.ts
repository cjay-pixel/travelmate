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

// AI Destination Generator Function
export const getAIDestinations = onCall(async (request) => {
  try {
    const { selectedCategories } = request.data;
    
    if (!selectedCategories || selectedCategories.length === 0) {
      throw new Error("No categories provided");
    }

    const OPENAI_API_KEY = ""; // Add your OpenAI API key here

    if (!OPENAI_API_KEY) {
      throw new Error("OpenAI API key not configured");
    }

    const prompt = `You are a Philippine travel expert. Based on these travel preferences: ${selectedCategories.join(', ')}, suggest 3 real, famous Philippine destinations that match these categories.

For each destination, provide in this EXACT JSON format with real image URLs from the internet:
[
  {
    "destinationName": "Exact place name",
    "cityName": "City",
    "regionName": "Province/Region",
    "description": "Brief description (1-2 sentences)",
    "budget": "₱X,XXX - ₱X,XXX",
    "rating": 4.5,
    "category": ["${selectedCategories[0]}", "${selectedCategories[1] || selectedCategories[0]}"],
    "imageUrl": "https://example.com/real-image.jpg"
  }
]

IMPORTANT: 
- Use real destination names from the Philippines
- Provide actual image URLs (use Unsplash or similar)
- Return ONLY the JSON array, nothing else.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7
      })
    });

    const data = await response.json();

    if (data.error) {
      logger.error('OpenAI API Error:', data.error);
      throw new Error(`OpenAI API error: ${data.error.message}`);
    }

    if (!data.choices || data.choices.length === 0) {
      throw new Error('No response from OpenAI');
    }

    const aiText = data.choices[0].message.content;
    
    // Extract JSON from response
    const jsonMatch = aiText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Could not parse AI response');
    }

    const suggestions = JSON.parse(jsonMatch[0]);
    
    // Save to Firestore
    const savedDestinations = [];
    for (const dest of suggestions) {
      const docRef = await admin.firestore().collection('destinations').add({
        destinationName: dest.destinationName,
        cityName: dest.cityName,
        regionName: dest.regionName,
        description: dest.description,
        category: dest.category || selectedCategories,
        budget: dest.budget,
        rating: parseFloat(dest.rating),
        imageUrl: dest.imageUrl || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'active',
        source: 'AI Generated'
      });

      savedDestinations.push({
        id: docRef.id,
        ...dest
      });
    }

    logger.info(`AI generated ${savedDestinations.length} destinations`);
    return {
      success: true,
      destinations: savedDestinations,
      count: savedDestinations.length
    };

  } catch (error) {
    logger.error('Error in getAIDestinations:', error);
    throw new Error(`Failed to generate destinations: ${error}`);
  }
});

setGlobalOptions({ maxInstances: 10 });

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
