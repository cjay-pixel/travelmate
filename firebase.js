// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB9G_nGKl7Cd45BIKryHvixVWgb3tWzG34",
  authDomain: "travelmateai-01.firebaseapp.com",
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