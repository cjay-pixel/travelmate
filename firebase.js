// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from 'firebase/database';
import { getFunctions } from "firebase/functions";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB9G_nGKl7Cd45BIKryHvixVWgb3tWzG34",
  authDomain: "travelmateai-01.firebaseapp.com",
  // Realtime Database URL (required for RTDB presence)
  // Use the regional RTDB endpoint (asia-southeast1) to match the database location
  databaseURL: "https://travelmateai-01-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "travelmateai-01",
  storageBucket: "travelmateai-01.firebasestorage.app",
  messagingSenderId: "987229598058",
  appId: "1:987229598058:web:f6e24f3bf259dd2da4b513",
  measurementId: "G-E5JQCZ1T2Z"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);
// Realtime Database (for presence)
export const rtdb = getDatabase(app);

// Enable auth persistence (stay logged in after page reload)
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error('Error setting auth persistence:', error);
});

// Initialize Firebase Storage
export const storage = getStorage(app);

// Secondary app for creating admin users without affecting current session
const secondaryApp = initializeApp(firebaseConfig, 'Secondary');
export const secondaryAuth = getAuth(secondaryApp);