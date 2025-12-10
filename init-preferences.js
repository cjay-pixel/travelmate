// Initialize default preferences in Firestore
// Run this script once to populate initial preference data
// Usage: node init-preferences.js

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD8HI6gLPQp_w3OEqJEWVjdQgVNZdvyeZQ",
  authDomain: "travelmateai-01.firebaseapp.com",
  projectId: "travelmateai-01",
  storageBucket: "travelmateai-01.firebasestorage.app",
  messagingSenderId: "828046064677",
  appId: "1:828046064677:web:c7de3b32f26e09b5ba8c01"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Default preferences data (16 total including Nature Exploration)
const defaultPreferences = [
  {
    title: "Beach Paradise",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400",
    tags: ["beach", "ocean", "relaxation", "tropical"],
    order: 1
  },
  {
    title: "Mountain Adventures",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400",
    tags: ["mountain", "hiking", "adventure", "nature"],
    order: 2
  },
  {
    title: "City Exploration",
    image: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400",
    tags: ["city", "urban", "culture", "shopping"],
    order: 3
  },
  {
    title: "Cultural Heritage",
    image: "https://images.unsplash.com/photo-1533929736458-ca588d08c8be?w=400",
    tags: ["culture", "history", "heritage", "museums"],
    order: 4
  },
  {
    title: "Adventure Sports",
    image: "https://images.unsplash.com/photo-1476610182048-b716b8518aae?w=400",
    tags: ["adventure", "sports", "extreme", "adrenaline"],
    order: 5
  },
  {
    title: "Wildlife Safari",
    image: "https://images.unsplash.com/photo-1516426122078-c23e76319801?w=400",
    tags: ["wildlife", "safari", "nature", "animals"],
    order: 6
  },
  {
    title: "Food & Wine",
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400",
    tags: ["food", "wine", "culinary", "restaurants"],
    order: 7
  },
  {
    title: "Luxury Resorts",
    image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400",
    tags: ["luxury", "resort", "spa", "relaxation"],
    order: 8
  },
  {
    title: "Historical Sites",
    image: "https://images.unsplash.com/photo-1555993539-1732b0258235?w=400",
    tags: ["history", "ancient", "monuments", "architecture"],
    order: 9
  },
  {
    title: "Island Hopping",
    image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400",
    tags: ["island", "tropical", "beach", "adventure"],
    order: 10
  },
  {
    title: "Romantic Getaways",
    image: "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=400",
    tags: ["romantic", "couples", "honeymoon", "relaxation"],
    order: 11
  },
  {
    title: "Family Fun",
    image: "https://images.unsplash.com/photo-1609619385002-f40c68a50e69?w=400",
    tags: ["family", "kids", "fun", "activities"],
    order: 12
  },
  {
    title: "Budget Travel",
    image: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400",
    tags: ["budget", "backpacking", "affordable", "hostels"],
    order: 13
  },
  {
    title: "Desert Adventures",
    image: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=400",
    tags: ["desert", "adventure", "camping", "exotic"],
    order: 14
  },
  {
    title: "Cruise Vacations",
    image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400",
    tags: ["cruise", "ocean", "luxury", "relaxation"],
    order: 15
  },
  {
    title: "Nature Exploration",
    image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400",
    tags: ["nature", "forest", "hiking", "wilderness"],
    order: 16
  }
];

// Function to add preferences to Firestore
async function initializePreferences() {
  try {
    console.log('Starting to add preferences to Firestore...\n');
    
    const preferencesRef = collection(db, 'preferences');
    
    for (const preference of defaultPreferences) {
      const docData = {
        ...preference,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(preferencesRef, docData);
      console.log(`✓ Added "${preference.title}" with ID: ${docRef.id}`);
    }
    
    console.log('\n✓ Successfully added all 16 preferences!');
    console.log('You can now view and manage them in the Admin Panel > Preferences section.');
    
    process.exit(0);
  } catch (error) {
    console.error('Error adding preferences:', error);
    process.exit(1);
  }
}

// Run the initialization
initializePreferences();
