import React, { useEffect, useState, useRef } from 'react';
import { getPrimaryImage } from '../utils/imageHelpers';
import { collection, getDocs, addDoc, query, where, updateDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';

function Destinations({ user, initialPlan }) {
  const [tripPlans, setTripPlans] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [recommendedPlaces, setRecommendedPlaces] = useState([]);
    const [wishlistMap, setWishlistMap] = useState({});
  const [selectedPlaces, setSelectedPlaces] = useState([]);
  const [availableCities, setAvailableCities] = useState([]);
  const [allAdminPlaces, setAllAdminPlaces] = useState([]);
  const [selectedPlaceDetails, setSelectedPlaceDetails] = useState(null);
  const [selectionWarning, setSelectionWarning] = useState(null);
  const [itineraryToShow, setItineraryToShow] = useState(null);
  const [formData, setFormData] = useState({
    destination: '',
    pax: 1,
    // budgetPerPax shown to user (may be adjusted by duration logic)
    budgetPerPax: 5000,
    // total budget (adjusted) shown to user
    budget: 5000,
    budgetAllocation: {
      accommodation: 40,
      activities: 30,
      food: 20,
      transportation: 10
    },
    startDate: '',
    endDate: '',
    preferredTime: 'morning'
  });
  // internal baseline value representing user's entered per-pax budget (before duration adjustment)
  const [baseBudgetPerPax, setBaseBudgetPerPax] = useState(5000);
  // track last edited mode to infer how to compute base values
  const [lastEdited, setLastEdited] = useState('budgetPerPax');
  // computed values
  const [numberOfDays, setNumberOfDays] = useState(1);
  
  const [loading, setLoading] = useState(false);
  const formRef = useRef(null);

  // Popular Philippine destinations (fallback)
  const popularDestinations = [
    'Manila', 'Boracay', 'Palawan', 'Cebu', 'Bohol', 
    'Siargao', 'Baguio', 'Vigan', 'Davao', 'El Nido',
    'Coron', 'Batanes', 'Sagada', 'Ilocos Norte', 'Camiguin'
  ];

  // Temporary database of places for demonstration
  const tempPlacesDatabase = {
    'Palawan': [
      { name: 'El Nido Beach Resort', type: 'Beach', budget: 8000, rating: 4.8, image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400' },
      { name: 'Puerto Princesa Underground River', type: 'Nature', budget: 3000, rating: 4.7, image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400' },
      { name: 'Coron Island Hopping', type: 'Adventure', budget: 5000, rating: 4.9, image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400' }
    ],
    'Boracay': [
      { name: 'White Beach', type: 'Beach', budget: 10000, rating: 4.9, image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400' },
      { name: 'Puka Shell Beach', type: 'Beach', budget: 2000, rating: 4.6, image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400' },
      { name: 'Water Sports Activities', type: 'Adventure', budget: 4000, rating: 4.7, image: 'https://images.unsplash.com/photo-1537519646099-335112b00ff2?w=400' }
    ],
    'Cebu': [
      { name: 'Kawasan Falls', type: 'Nature', budget: 3500, rating: 4.8, image: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=400' },
      { name: 'Oslob Whale Shark Watching', type: 'Adventure', budget: 6000, rating: 4.9, image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400' },
      { name: 'Magellan\'s Cross', type: 'Cultural', budget: 500, rating: 4.5, image: 'https://images.unsplash.com/photo-1533929736458-ca588d08c8be?w=400' }
    ],
    'Baguio': [
      { name: 'Burnham Park', type: 'Nature', budget: 1000, rating: 4.4, image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400' },
      { name: 'Mines View Park', type: 'Nature', budget: 500, rating: 4.5, image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400' },
      { name: 'Strawberry Farm', type: 'Activity', budget: 2000, rating: 4.6, image: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=400' }
    ],
    'Manila': [
      { name: 'Intramuros Walking Tour', type: 'Cultural', budget: 2000, rating: 4.6, image: 'https://images.unsplash.com/photo-1555993539-1732b0258235?w=400' },
      { name: 'Rizal Park', type: 'Park', budget: 500, rating: 4.4, image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400' },
      { name: 'Mall of Asia', type: 'Shopping', budget: 5000, rating: 4.7, image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400' }
    ]
  };

  const handleViewItinerary = (plan) => {
    try {
      const itin = generateItineraryFromPlan(plan);
      setItineraryToShow(itin);
    } catch (e) {
      console.error('Failed to generate itinerary', e);
      alert('Unable to generate itinerary for this plan.');
    }
  };

  // Helper to parse numeric budget from admin place document
  const parseNumericBudget = (place) => {
    if (!place) return 0;
    // if estimatedCost present (set by other pages), prefer it
    if (typeof place.estimatedCost === 'number' && place.estimatedCost > 0) return place.estimatedCost;
    if (typeof place.budget === 'number' && place.budget > 0) return place.budget;
    // try parsing string budgets like "₱5,000 - ₱15,000" or "5000"
    const val = place.budget || place.estimatedCost || '';
    if (typeof val === 'string') {
      const cleaned = val.replace(/[_,₱\s]/g, '');
      const nums = cleaned.match(/\d+/g);
      if (nums && nums.length) return parseInt(nums[0], 10);
    }
    return 0;
  };

  // Helper to determine if a place is a festival-type listing (exclude from recommendations)
  const isFestivalPlace = (place) => {
    if (!place) return false;
    const catFields = [];
    if (place.category) catFields.push(place.category);
    if (place.categories) catFields.push(...(Array.isArray(place.categories) ? place.categories : [place.categories]));
    if (place.tags) catFields.push(...(Array.isArray(place.tags) ? place.tags : [place.tags]));
    // normalize to array of strings
    const cats = catFields.flat().map(c => (c || '').toString().toLowerCase());
    if (cats.some(c => c.includes('festival'))) return true;
    const name = (place.destinationName || place.name || place.cityName || '').toString().toLowerCase();
    if (name.includes('festival')) return true;
    return false;
  };

  useEffect(() => {
    const fetchTripPlans = async () => {
      if (!user) return; // Don't fetch if no user
      
      // Only fetch trip plans for the logged-in user
      const q = query(
        collection(db, 'tripPlans'), 
        where('userId', '==', user.uid)
      );
      const querySnapshot = await getDocs(q);
      const plans = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // sort by updatedAt(createdAt) desc
      plans.sort((a, b) => {
        const tb = Date.parse(b.updatedAt || b.createdAt) || 0;
        const ta = Date.parse(a.updatedAt || a.createdAt) || 0;
        return tb - ta;
      });
      setTripPlans(plans);
    };
    fetchTripPlans();
    // wishlist listener
    let unsubWish = null;
    if (user) {
      const qWish = query(collection(db, 'wishlists'), where('userId', '==', user.uid));
      unsubWish = onSnapshot(qWish, snap => {
        const map = {};
        snap.forEach(d => {
          const data = d.data(); if (data && data.placeId) map[data.placeId] = d.id;
        });
        setWishlistMap(map);
      }, err => console.error('wishlists listen', err));
    }
    return () => { try { if (unsubWish) unsubWish(); } catch(e) {} };
    // Load admin-managed destinations used for dropdown / recommendations
    const loadAdminPlaces = async () => {
      try {
        const q = query(collection(db, 'destinations'));
        const snap = await getDocs(q);
        const places = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setAllAdminPlaces(places);
        const cities = Array.from(new Set(places.map(p => p.cityName || p.regionName || p.destinationName))).filter(Boolean).sort();
        setAvailableCities(cities);
      } catch (err) {
        console.error('Failed to load admin destinations', err);
      }
    };
    loadAdminPlaces();
  }, [user]);

  const baselineDays = 3; // baseline used to normalize daily cost (adjust as needed)

  const computeDays = (start, end) => {
    if (!start || !end) return 1;
    const s = new Date(start);
    const e = new Date(end);
    const diff = Math.ceil((e - s) / (1000 * 60 * 60 * 24));
    return Math.max(1, diff + 1);
  };

  const formatTimeFromMinutes = (totalMinutes) => {
    const h = Math.floor(totalMinutes / 60) % 24;
    const m = totalMinutes % 60;
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = ((h + 11) % 12) + 1; // 1-12
    const mm = m.toString().padStart(2, '0');
    return `${hour12.toString().padStart(2, '0')}:${mm} ${period}`;
  };

  const generateTimeSlots = (preferred, count = 5) => {
    const windows = {
      morning: { start: 6, end: 12 },     // 6:00 - 12:00
      afternoon: { start: 12, end: 18 },  // 12:00 - 18:00
      evening: { start: 18, end: 24 },    // 18:00 - 24:00
      flexible: { start: 6, end: 24 }
    };
    const w = windows[preferred] || windows.morning;
    const totalMinutes = (w.end - w.start) * 60;
    if (totalMinutes <= 0) return [formatTimeFromMinutes(w.start * 60)];
    const step = Math.floor(totalMinutes / Math.max(1, count));
    const slots = [];
    for (let i = 0; i < count; i++) {
      const minutes = Math.min(totalMinutes - 1, Math.round(i * step));
      const t = w.start * 60 + minutes;
      slots.push(formatTimeFromMinutes(t));
    }
    return slots;
  };

  // Recompute derived budgeting values whenever total budget, pax, or dates change
  const [suggestion, setSuggestion] = useState(null);
  useEffect(() => {
    const days = computeDays(formData.startDate, formData.endDate);
    setNumberOfDays(days);

    const totalBudgetNum = formData.budget === '' ? 0 : Number(formData.budget);
    const paxNum = Math.max(1, Number(formData.pax) || 1);

    // derive budgetPerPax from totalBudget (primary input)
    const budgetPerPaxNum = paxNum > 0 ? (totalBudgetNum / paxNum) : 0;
    const budgetPerPaxRounded = Math.round(budgetPerPaxNum);

    // category allocations (percentages)
    const alloc = {
      accommodation: totalBudgetNum * 0.4,
      food: totalBudgetNum * 0.3,
      transportation: totalBudgetNum * 0.2,
      activities: totalBudgetNum * 0.1
    };

    const perPaxAlloc = {
      accommodation: paxNum > 0 ? alloc.accommodation / paxNum : 0,
      food: paxNum > 0 ? alloc.food / paxNum : 0,
      transportation: paxNum > 0 ? alloc.transportation / paxNum : 0,
      activities: paxNum > 0 ? alloc.activities / paxNum : 0
    };

    // date-based suggestion logic
    const dailyBudgetPerPax = budgetPerPaxNum / Math.max(1, baselineDays);
    const expectedBudgetPerPax = dailyBudgetPerPax * days;
    const expectedTotalBudget = expectedBudgetPerPax * paxNum;

    // update formData derived fields (do not override when user actively editing fields)
    setFormData(prev => {
      const next = { ...prev };
      if (lastEdited !== 'budgetPerPax') next.budgetPerPax = budgetPerPaxRounded;
      if (lastEdited !== 'budget') next.budget = String(totalBudgetNum);
      return next;
    });
    setBaseBudgetPerPax(budgetPerPaxRounded);

    if (expectedTotalBudget > totalBudgetNum) {
      setSuggestion({
        needsIncrease: true,
        expectedTotalBudget: Math.round(expectedTotalBudget),
        expectedBudgetPerPax: Math.round(expectedBudgetPerPax)
      });
    } else {
      setSuggestion({ needsIncrease: false, expectedTotalBudget: Math.round(expectedTotalBudget), expectedBudgetPerPax: Math.round(expectedBudgetPerPax) });
    }

    // destination-based minimum budget suggestion
    let minRequiredTotal = 0;
    try {
      const sel = (formData.destination || '').toString().toLowerCase();
      const destMatches = allAdminPlaces.filter(p => {
        const city = (p.cityName || '').toString().toLowerCase();
        const name = (p.destinationName || '').toString().toLowerCase();
        const region = (p.regionName || '').toString().toLowerCase();
        return sel && (city === sel || name === sel || region === sel);
      });
      const budgets = destMatches.map(p => parseNumericBudget(p)).filter(b => !isNaN(b) && b > 0);
      const avg = budgets.length ? budgets.reduce((a,b)=>a+b,0)/budgets.length : 0;
      // treat avg as a per-place cost; scale by pax and days relative to baseline
      if (avg > 0) {
        minRequiredTotal = Math.round(avg * paxNum * (days / Math.max(1, baselineDays)));
      }
    } catch (err) {
      minRequiredTotal = 0;
    }

    // ensure suggestion.minRequiredTotal is at least the date-based expected total or the city-based minimum
    setSuggestion(prev => ({ ...prev, minRequiredTotal: Math.max(Math.round(expectedTotalBudget), minRequiredTotal, prev?.minRequiredTotal || 0) }));

    // store allocations in component state (for display)
    setAllocations({ alloc, perPaxAlloc });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.budget, formData.pax, formData.startDate, formData.endDate, formData.destination, allAdminPlaces]);

  // local state to hold allocations for UI
  const [allocations, setAllocations] = useState({ alloc: null, perPaxAlloc: null });

  const handleInputChange = (field, value) => {
    // allow empty string for controlled numeric inputs so user can backspace
    if (field === 'pax') {
      // keep raw string in state while typing; validation happens on submit/save
      setFormData(prev => ({ ...prev, pax: value }));
      setLastEdited('pax');
      return;
    }

    if (field === 'budgetPerPax') {
      // keep raw string for the input and compute total budget = budgetPerPax * pax
      const vnum = value === '' ? 0 : Number(value);
      setFormData(prev => {
        const paxNum = Math.max(1, Number(prev.pax) || 1);
        const total = isNaN(vnum) ? prev.budget : (vnum * paxNum);
        return { ...prev, budgetPerPax: value, budget: String(total) };
      });
      setBaseBudgetPerPax(isNaN(vnum) ? 0 : vnum);
      setLastEdited('budgetPerPax');
      return;
    }

    if (field === 'budget') {
      setFormData(prev => ({ ...prev, budget: value }));
      const vnum = value === '' ? 0 : Number(value);
      const paxNum = Math.max(1, Number(formData.pax) || 1);
      const impliedPerPax = isNaN(vnum) || vnum <= 0 ? 0 : Math.round(vnum / paxNum);
      setBaseBudgetPerPax(impliedPerPax);
      setLastEdited('budget');
      return;
    }

    // dates and other fields
    setFormData({ ...formData, [field]: value });
  };

  const handleBudgetAllocation = (category, value) => {
    setFormData({
      ...formData,
      budgetAllocation: {
        ...formData.budgetAllocation,
        [category]: parseInt(value)
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Basic validations
      if (!formData.startDate || !formData.endDate) {
        alert('Please select start and end dates for the trip.');
        setLoading(false);
        return;
      }
      const days = computeDays(formData.startDate, formData.endDate);
      if (days < 1) {
        alert('End date must not be earlier than start date.');
        setLoading(false);
        return;
      }
      if (!formData.pax || Number(formData.pax) < 1) {
        alert('Pax must be at least 1.');
        setLoading(false);
        return;
      }
      if (!formData.budget || Number(formData.budget) <= 0) {
        alert('Budget must be greater than 0.');
        setLoading(false);
        return;
      }
      // Calculate budget breakdown
      const budgetBreakdown = {
        accommodation: (formData.budget * formData.budgetAllocation.accommodation) / 100,
        activities: (formData.budget * formData.budgetAllocation.activities) / 100,
        food: (formData.budget * formData.budgetAllocation.food) / 100,
        transportation: (formData.budget * formData.budgetAllocation.transportation) / 100
      };

      // Get recommended places from Firestore 'destinations'
      const sel = (formData.destination || '').toString().toLowerCase();
      let matches = allAdminPlaces.filter(p => {
        const city = (p.cityName || '').toString().toLowerCase();
        const name = (p.destinationName || '').toString().toLowerCase();
        const region = (p.regionName || '').toString().toLowerCase();
        return sel && (city === sel || name === sel || region === sel);
      });

      if (matches.length === 0) {
        // fallback to include contains
        matches = allAdminPlaces.filter(p => {
          const city = (p.cityName || '').toString().toLowerCase();
          const name = (p.destinationName || '').toString().toLowerCase();
          const region = (p.regionName || '').toString().toLowerCase();
          return city.includes(sel) || name.includes(sel) || region.includes(sel);
        });
      }

      // filter by per-pax budget: show destinations whose admin budget is <= budgetPerPax
      const paxNum = Math.max(1, Number(formData.pax) || 1);
      // derive numeric budgetPerPax: prefer explicit field, otherwise compute from total budget
      const budgetPerPaxNum = (formData.budgetPerPax === '' || formData.budgetPerPax == null)
        ? (formData.budget === '' ? 0 : (Number(formData.budget) / paxNum))
        : Number(formData.budgetPerPax);

      // exclude festival listings and those above per-pax budget
      const filteredPlaces = matches.filter(place => {
        if (isFestivalPlace(place)) return false;
        const placeBudget = parseNumericBudget(place) || 0;
        if (placeBudget > 0) {
          return budgetPerPaxNum >= placeBudget;
        }
        return true;
      });

      // If no places fit the per-pax budget, compute and set a stronger suggestion based on city averages
      if (filteredPlaces.length === 0) {
        const sel = (formData.destination || '').toString().toLowerCase();
        const destMatches = allAdminPlaces.filter(p => {
          const city = (p.cityName || '').toString().toLowerCase();
          const name = (p.destinationName || '').toString().toLowerCase();
          const region = (p.regionName || '').toString().toLowerCase();
          return sel && (city === sel || name === sel || region === sel);
        });
        const budgets = destMatches.map(p => parseNumericBudget(p)).filter(b => !isNaN(b) && b > 0);
        const avg = budgets.length ? budgets.reduce((a,b)=>a+b,0)/budgets.length : 0;
        // minimal per-pax needed to afford an average place
        const minimalPerPaxNeeded = Math.round(avg);
        const minimalTotalNeeded = minimalPerPaxNeeded * paxNum;
        setSuggestion(prev => ({ ...(prev||{}), minRequiredTotal: Math.max(prev?.minRequiredTotal||0, minimalTotalNeeded) }));
      }

      setRecommendedPlaces(filteredPlaces.map(p => ({
        name: p.destinationName || p.cityName || 'Unknown',
        type: (p.category && p.category[0]) || 'General',
        budget: parseNumericBudget(p) || 0,
        rating: Number(p.rating) || 0,
        image: (p.images && p.images[0]) || p.imageUrl || '',
        raw: p
      })));
      setSelectedPlaces([]);
      setShowRecommendations(true);
      setLoading(false);
    } catch (error) {
      alert('Error generating recommendations: ' + error.message);
      setLoading(false);
    }
  };

  const toggleWishlist = async (place, e) => {
    if (e) e.stopPropagation();
    if (!user) { alert('Please log in to add to wishlist'); return; }
    const placeId = (place.raw && place.raw.id) || place.id || place.raw?.destinationId || place.raw?.destinationId || place.name;
    try {
      if (wishlistMap[placeId]) {
        await deleteDoc(doc(db, 'wishlists', wishlistMap[placeId]));
      } else {
        await addDoc(collection(db, 'wishlists'), {
          userId: user.uid,
          placeId,
          placeData: place,
          createdAt: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error('Failed to toggle wishlist', err);
      alert('Failed to update wishlist');
    }
  };

  const togglePlaceSelection = (place) => {
    setSelectedPlaces(prev => {
      const isSelected = prev.some(p => p.name === place.name);
      let next;
      if (isSelected) {
        next = prev.filter(p => p.name !== place.name);
      } else {
        next = [...prev, place];
      }

      // compute selection cost and warn if exceeds activities allocation
      try {
        const paxNum = Math.max(1, Number(formData.pax) || 1);
        const selectedPerPax = next.reduce((sum, sp) => sum + (Number(sp.budget) || parseNumericBudget(sp.raw || sp) || 0), 0);
        const selectedTotal = selectedPerPax * paxNum;
        const totalBudgetNum = formData.budget === '' ? 0 : Number(formData.budget);
        const activitiesAllocationTotal = (totalBudgetNum * (formData.budgetAllocation.activities || 0)) / 100;
        const timeMultiplier = (formData.preferredTime === 'evening') ? 1.2 : (formData.preferredTime === 'afternoon' ? 1.1 : 1.0);
        const adjustedActivitiesBudget = activitiesAllocationTotal * timeMultiplier;
        if (selectedTotal > adjustedActivitiesBudget) {
          // compute minimal total needed so activities allocation covers selectedTotal
          const minimalTotalNeeded = Math.round((selectedTotal / timeMultiplier) / Math.max(0.01, (formData.budgetAllocation.activities || 0) / 100));
          setSelectionWarning({ needsIncrease: true, minimalTotalNeeded, selectedTotal });
        } else {
          setSelectionWarning(null);
        }
      } catch (e) {
        setSelectionWarning(null);
      }

      return next;
    });
  };

  const handleSaveTrip = async () => {
    if (selectedPlaces.length === 0) {
      alert('Please select at least one place to save your trip!');
      return;
    }

    setLoading(true);
    try {
      const budgetBreakdown = {
        accommodation: (formData.budget * formData.budgetAllocation.accommodation) / 100,
        activities: (formData.budget * formData.budgetAllocation.activities) / 100,
        food: (formData.budget * formData.budgetAllocation.food) / 100,
        transportation: (formData.budget * formData.budgetAllocation.transportation) / 100
      };

      // validate before saving
      const days = computeDays(formData.startDate, formData.endDate);
      if (days < 1) {
        alert('End date must not be earlier than start date.');
        setLoading(false);
        return;
      }
      if (!formData.pax || Number(formData.pax) < 1) {
        alert('Pax must be at least 1.');
        setLoading(false);
        return;
      }
      if (!formData.budget || Number(formData.budget) <= 0) {
        alert('Budget must be greater than 0.');
        setLoading(false);
        return;
      }

      // Before saving, ensure selected places fit within activities allocation
      if (selectionWarning && selectionWarning.needsIncrease) {
        alert('Selected places exceed your activities allocation. Increase total budget or remove some places before saving.');
        setLoading(false);
        return;
      }

      if (editingId) {
        // Update existing trip plan
        await updateDoc(doc(db, 'tripPlans', editingId), {
          ...formData,
          pax: formData.pax,
          numberOfDays: days,
          adjustedBudgetPerPax: formData.budgetPerPax,
          adjustedTotalBudget: formData.budget,
          baseBudgetPerPax,
          budgetBreakdown,
          allocations: allocations.alloc,
          perPaxAllocations: allocations.perPaxAlloc,
          suggestion,
          selectedPlaces: selectedPlaces,
          recommendedPlaces: recommendedPlaces,
          updatedAt: new Date().toISOString()
        });
        alert('Trip plan updated successfully!');
        setEditingId(null);
      } else {
        // Save new trip plan to Firestore
        await addDoc(collection(db, 'tripPlans'), {
          ...formData,
          pax: formData.pax,
          numberOfDays: days,
          adjustedBudgetPerPax: formData.budgetPerPax,
          adjustedTotalBudget: formData.budget,
          baseBudgetPerPax,
          budgetBreakdown,
          allocations: allocations.alloc,
          perPaxAllocations: allocations.perPaxAlloc,
          suggestion,
          selectedPlaces: selectedPlaces,
          recommendedPlaces: recommendedPlaces,
          userId: user.uid,
          userEmail: user.email,
          createdAt: new Date().toISOString()
        });
        alert('Trip plan saved successfully!');
      }
      
      // Reset form and recommendations
      setFormData({
        destination: '',
        pax: 1,
        budgetPerPax: 5000,
        budget: 5000,
        budgetAllocation: {
          accommodation: 40,
          activities: 30,
          food: 20,
          transportation: 10
        },
        startDate: '',
        endDate: '',
        preferredTime: 'morning'
      });
      setBaseBudgetPerPax(5000);
      setShowRecommendations(false);
      setRecommendedPlaces([]);
      setSelectedPlaces([]);

      // Refresh list
      const q = query(
        collection(db, 'tripPlans'), 
        where('userId', '==', user.uid)
      );
      const querySnapshot = await getDocs(q);
      const plans = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      plans.sort((a, b) => {
        const tb = Date.parse(b.updatedAt || b.createdAt) || 0;
        const ta = Date.parse(a.updatedAt || a.createdAt) || 0;
        return tb - ta;
      });
      setTripPlans(plans);
    } catch (error) {
      alert('Error saving trip plan: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (plan) => {
    setFormData({
      destination: plan.destination,
      pax: plan.pax || 1,
      budgetPerPax: plan.adjustedBudgetPerPax || plan.budgetPerPax || Math.round((plan.budget || 0) / (plan.pax || 1)),
      budget: plan.budget,
      budgetAllocation: plan.budgetAllocation,
      startDate: plan.startDate,
      endDate: plan.endDate,
      preferredTime: plan.preferredTime
    });
    setBaseBudgetPerPax(plan.baseBudgetPerPax || plan.budgetPerPax || Math.round((plan.budget || 0) / Math.max(1, plan.pax || 1)));
    // restore selected places/recommendations so user can continue editing
    setSelectedPlaces(plan.selectedPlaces || []);
    setRecommendedPlaces(plan.recommendedPlaces || []);
    setEditingId(plan.id);
    // Scroll to form smoothly
    try {
      if (formRef && formRef.current) formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      else window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleDelete = async (planId) => {
    if (!window.confirm('Are you sure you want to delete this trip plan?')) return;
    
    try {
      await deleteDoc(doc(db, 'tripPlans', planId));
      alert('Trip plan deleted successfully!');
      
      // Refresh list
      const q = query(
        collection(db, 'tripPlans'), 
        where('userId', '==', user.uid)
      );
      const querySnapshot = await getDocs(q);
      const plans = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      plans.sort((a, b) => {
        const tb = Date.parse(b.updatedAt || b.createdAt) || 0;
        const ta = Date.parse(a.updatedAt || a.createdAt) || 0;
        return tb - ta;
      });
      setTripPlans(plans);
    } catch (error) {
      alert('Error deleting trip plan: ' + error.message);
    }
  };

  // Generate a simple day-by-day itinerary from a saved plan
  const generateItineraryFromPlan = (plan) => {
    if (!plan) return null;
    const start = new Date(plan.startDate);
    const end = new Date(plan.endDate);
    const days = computeDays(plan.startDate, plan.endDate);
    const places = plan.selectedPlaces || [];
    const preferred = plan.preferredTime || 'morning';

    const slots = generateTimeSlots(preferred, 5);

    let itinerary = [];
    for (let i = 0; i < days; i++) {
      const dayDate = new Date(start);
      dayDate.setDate(start.getDate() + i);
      const dayLabel = `Day ${i + 1}`;

      // assign 1-2 places per day depending on number of places and prefer preferred time window
      const activities = [];
      const placesForDay = [];
      // Distribute places roughly evenly
      if (places.length > 0) {
        const perDay = Math.max(1, Math.ceil(places.length / days));
        const startIdx = i * perDay;
        for (let j = 0; j < perDay; j++) {
          const p = places[(startIdx + j) % places.length];
          if (p) placesForDay.push(p);
        }
      }

      // Map places into slots starting at preferred time index so main activities fall into the preferred window
      const preferredStartIndex = (preferred === 'morning') ? 0 : (preferred === 'afternoon') ? 1 : (preferred === 'evening') ? 2 : 0;
      const slotToPlace = new Array(slots.length).fill(null);
      for (let j = 0; j < placesForDay.length; j++) {
        const slotIdx = (preferredStartIndex + j) % slots.length;
        slotToPlace[slotIdx] = placesForDay[j];
      }

      const mealLabel = (preferred === 'evening') ? 'Dinner' : 'Lunch';

      for (let s = 0; s < slots.length; s++) {
        const place = slotToPlace[s] || null;
        const image = place ? (place.image || place.raw?.images?.[0] || place.raw?.imageUrl || '') : '';
        if (s === 0) {
          activities.push({ time: slots[s], activity: place ? `Visit ${place.name}` : 'Breakfast / Travel', notes: place && place.raw?.notes ? place.raw.notes : (place ? place.type : 'Start your day'), image });
        } else if (s === 1 && place) {
          activities.push({ time: slots[s], activity: `Explore ${place.name}`, notes: place.raw?.notes || 'Enjoy the activity', image });
        } else if (s === 2) {
          activities.push({ time: slots[s], activity: mealLabel, notes: mealLabel === 'Lunch' ? 'Try local cuisine' : 'Enjoy dinner at a local spot', image: '' });
        } else if (s === 3) {
          activities.push({ time: slots[s], activity: place ? `Continue at ${place.name}` : 'Free time', notes: 'Relax or explore', image });
        } else {
          activities.push({ time: slots[s], activity: 'Return to Hotel / Rest', notes: '', image: '' });
        }
      }

      itinerary.push({ day: dayLabel, date: dayDate.toISOString().split('T')[0], activities });
    }

    return {
      title: `${plan.destination} Trip`,
      startDate: plan.startDate,
      endDate: plan.endDate,
      pax: plan.pax || 1,
      numberOfDays: days,
      items: itinerary
    };
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({
      destination: '',
      pax: 1,
      budgetPerPax: 5000,
      budget: 5000,
      budgetAllocation: {
        accommodation: 40,
        activities: 30,
        food: 20,
        transportation: 10
      },
      startDate: '',
      endDate: '',
      preferredTime: 'morning'
    });
    setBaseBudgetPerPax(5000);
  };

  // If the page was opened with an initial plan (via navigation state), start editing it
  useEffect(() => {
    if (initialPlan && typeof initialPlan === 'object') {
      try {
        handleEdit(initialPlan);
      } catch (err) {
        console.warn('Failed to apply initial plan to edit:', err);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPlan]);

  return (
    <>
      <style>
        {`
          .hover-lift {
            transition: transform 0.3s ease, box-shadow 0.3s ease;
          }
          .hover-lift:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15) !important;
          }
        `}
      </style>
      <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          {/* Main Form Card */}
          <div ref={formRef} className="card shadow-lg border-0 rounded-4 mb-5">
            <div className="card-body p-4 p-md-5">
              {editingId && (
                <div className="alert alert-info d-flex justify-content-between align-items-center mb-4">
                  <span>
                    <i className="bi bi-pencil-square me-2"></i>
                    Editing trip plan
                  </span>
                  <button 
                    className="btn btn-sm btn-outline-secondary"
                    onClick={handleCancelEdit}
                  >
                    Cancel Edit
                  </button>
                </div>
              )}
              <h2 className="text-center fw-bold mb-2">
                {editingId ? 'Edit Your Trip' : 'Plan Your Perfect Trip'}
              </h2>
              <p className="text-center text-muted mb-4">
                Let Travelmate help you create the perfect itinerary
              </p>

              <form onSubmit={handleSubmit}>
                {/* Destination selector (populated from admin destinations) */}
                <div className="mb-4">
                  <label className="form-label fw-bold">
                    <i className="bi bi-geo-alt-fill text-danger me-2"></i>
                    Destination
                  </label>
                  <div className="d-flex">
                    <select
                      className="form-select form-select-lg"
                      value={formData.destination}
                      onChange={(e) => handleInputChange('destination', e.target.value)}
                      required
                    >
                      <option value="">Select a destination / city</option>
                      {(availableCities.length > 0 ? availableCities : popularDestinations).map((dest, index) => (
                        <option key={index} value={dest}>{dest}</option>
                      ))}
                    </select>
                    <div className="ms-3 d-flex align-items-center">
                      <small className="text-muted">City: <strong>{formData.destination || '—'}</strong></small>
                    </div>
                  </div>
                </div>

                {/* Pax and Budget Inputs */}
                <div className="row mb-4">
                  <div className="col-md-4">
                    <label className="form-label fw-bold">
                      <i className="bi bi-people-fill text-info me-2"></i>
                      Pax
                    </label>
                    <input
                      type="number"
                      min="1"
                      className="form-control form-control-lg"
                      value={formData.pax}
                      onChange={(e) => handleInputChange('pax', e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-bold">
                      <i className="bi bi-cash-stack text-success me-2"></i>
                      Budget per Pax (₱)
                    </label>
                    <input
                      type="number"
                      min="1"
                      className="form-control form-control-lg"
                      value={formData.budgetPerPax}
                      onChange={(e) => handleInputChange('budgetPerPax', e.target.value)}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-bold">
                      <i className="bi bi-wallet2 text-success me-2"></i>
                      Total Budget (₱)
                    </label>
                    <input
                      type="number"
                      min="0"
                      className="form-control form-control-lg"
                      value={formData.budget}
                      onChange={(e) => handleInputChange('budget', e.target.value)}
                    />
                  </div>
                </div>
                <div className="mb-3 small text-muted">
                  <strong>Trip duration:</strong> {numberOfDays} day{numberOfDays>1?'s':''} — budgets adjust automatically based on duration.
                </div>
                {/* Allocation Summary */}
                {allocations && allocations.alloc && (
                  <div className="mb-4">
                    <h6 className="fw-bold">Auto Allocation</h6>
                    <div className="row g-2 small">
                      <div className="col-6">Accommodation: <strong>₱{Math.round(allocations.alloc.accommodation).toLocaleString()}</strong></div>
                      <div className="col-6">Per Pax: <strong>₱{Math.round(allocations.perPaxAlloc.accommodation).toLocaleString()}</strong></div>
                      <div className="col-6">Food: <strong>₱{Math.round(allocations.alloc.food).toLocaleString()}</strong></div>
                      <div className="col-6">Per Pax: <strong>₱{Math.round(allocations.perPaxAlloc.food).toLocaleString()}</strong></div>
                      <div className="col-6">Transportation: <strong>₱{Math.round(allocations.alloc.transportation).toLocaleString()}</strong></div>
                      <div className="col-6">Per Pax: <strong>₱{Math.round(allocations.perPaxAlloc.transportation).toLocaleString()}</strong></div>
                      <div className="col-6">Activities: <strong>₱{Math.round(allocations.alloc.activities).toLocaleString()}</strong></div>
                      <div className="col-6">Per Pax: <strong>₱{Math.round(allocations.perPaxAlloc.activities).toLocaleString()}</strong></div>
                    </div>
                  </div>
                )}

                {/* Suggestion */}
                {suggestion && suggestion.needsIncrease && (
                  <div className="alert alert-warning">
                    <strong>Suggestion:</strong> For the selected dates we recommend a total budget of <strong>₱{suggestion.expectedTotalBudget.toLocaleString()}</strong> (≈ ₱{suggestion.expectedBudgetPerPax.toLocaleString()} per pax) to maintain the same daily spending.
                  </div>
                )}

                {/* Budget Allocation */}
                <div className="mb-4">
                  <label className="form-label fw-bold mb-3">
                    <i className="bi bi-pie-chart-fill text-primary me-2"></i>
                    Budget Allocation (%)
                  </label>

                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label small">Accommodation ({formData.budgetAllocation.accommodation}%)</label>
                      <input
                        type="range"
                        className="form-range"
                        min="0"
                        max="100"
                        value={formData.budgetAllocation.accommodation}
                        onChange={(e) => handleBudgetAllocation('accommodation', e.target.value)}
                      />
                      <span className="small text-muted">₱{((formData.budget * formData.budgetAllocation.accommodation) / 100).toLocaleString()}</span>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small">Activities ({formData.budgetAllocation.activities}%)</label>
                      <input
                        type="range"
                        className="form-range"
                        min="0"
                        max="100"
                        value={formData.budgetAllocation.activities}
                        onChange={(e) => handleBudgetAllocation('activities', e.target.value)}
                      />
                      <span className="small text-muted">₱{((formData.budget * formData.budgetAllocation.activities) / 100).toLocaleString()}</span>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small">Food ({formData.budgetAllocation.food}%)</label>
                      <input
                        type="range"
                        className="form-range"
                        min="0"
                        max="100"
                        value={formData.budgetAllocation.food}
                        onChange={(e) => handleBudgetAllocation('food', e.target.value)}
                      />
                      <span className="small text-muted">₱{((formData.budget * formData.budgetAllocation.food) / 100).toLocaleString()}</span>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small">Transportation ({formData.budgetAllocation.transportation}%)</label>
                      <input
                        type="range"
                        className="form-range"
                        min="0"
                        max="100"
                        value={formData.budgetAllocation.transportation}
                        onChange={(e) => handleBudgetAllocation('transportation', e.target.value)}
                      />
                      <span className="small text-muted">₱{((formData.budget * formData.budgetAllocation.transportation) / 100).toLocaleString()}</span>
                    </div>
                  </div>

                  {(() => {
                    const totalAlloc = Object.values(formData.budgetAllocation).reduce((a, b) => a + b, 0);
                    return (
                      <div className={`mt-3 small alert ${totalAlloc > 100 ? 'alert-danger' : 'alert-info'}`}>
                        <i className="bi bi-info-circle me-2"></i>
                        Total: {totalAlloc}%
                        {totalAlloc > 100 && (
                          <strong className="ms-2">Allocation exceeds 100% — fix to continue</strong>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Dates */}
                <div className="row mb-4">
                  <div className="col-md-6">
                    <label className="form-label fw-bold">
                      <i className="bi bi-calendar-check text-warning me-2"></i>
                      Start Date
                    </label>
                    <div className="input-group">
                      <span
                        className="input-group-text bg-white"
                        style={{ cursor: 'pointer' }}
                        onClick={() => document.getElementById('startDate').showPicker()}
                      >
                        <i className="bi bi-calendar3"></i>
                      </span>
                      <input
                        id="startDate"
                        type="date"
                        className="form-control form-control-lg"
                        value={formData.startDate}
                        onChange={(e) => handleInputChange('startDate', e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        required
                        style={{ cursor: 'pointer' }}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold">
                      <i className="bi bi-calendar-x text-warning me-2"></i>
                      End Date
                    </label>
                    <div className="input-group">
                      <span
                        className="input-group-text bg-white"
                        style={{ cursor: 'pointer' }}
                        onClick={() => document.getElementById('endDate').showPicker()}
                      >
                        <i className="bi bi-calendar3"></i>
                      </span>
                      <input
                        id="endDate"
                        type="date"
                        className="form-control form-control-lg"
                        value={formData.endDate}
                        onChange={(e) => handleInputChange('endDate', e.target.value)}
                        min={formData.startDate || new Date().toISOString().split('T')[0]}
                        required
                        style={{ cursor: 'pointer' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Preferred Time */}
                <div className="mb-4">
                  <label className="form-label fw-bold">
                    <i className="bi bi-brightness-high-fill text-warning me-2"></i>
                    Preferred Time for Activities
                  </label>
                  <select
                    className="form-select form-select-lg"
                    value={formData.preferredTime}
                    onChange={(e) => handleInputChange('preferredTime', e.target.value)}
                  >
                    <option value="morning">Morning (6 AM - 12 PM)</option>
                    <option value="afternoon">Afternoon (12 PM - 6 PM)</option>
                    <option value="evening">Evening (6 PM - 12 AM)</option>
                    <option value="flexible">Flexible (Anytime)</option>
                  </select>
                </div>

                {/* Submit Button */}
                {suggestion && suggestion.minRequiredTotal > 0 && Number(formData.budget || 0) < suggestion.minRequiredTotal && (
                  <div className="alert alert-warning">
                    <strong>Budget may be low for {formData.destination || 'this destination'}</strong>. Recommended minimum: <strong>₱{suggestion.minRequiredTotal.toLocaleString()}</strong>. You can still get recommendations, but consider increasing your budget.
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-danger btn-lg w-100 py-3 fw-bold"
                  style={{ background: 'linear-gradient(to right, #FF385C, #E31C5F)', border: 'none' }}
                  disabled={loading || Object.values(formData.budgetAllocation).reduce((a,b)=>a+b,0) > 100}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Processing...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-stars me-2"></i>
                      {editingId ? 'Update Trip Plan' : 'Get Recommendations'}
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Recommended Places Section */}
          {showRecommendations && (
            <div className="card shadow-lg border-0 rounded-4 mb-5">
              <div className="card-body p-4 p-md-5">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h3 className="fw-bold mb-0">
                    <i className="bi bi-stars text-warning me-2"></i>
                    Recommended Places for {formData.destination}
                  </h3>
                  <button 
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => setShowRecommendations(false)}
                  >
                    <i className="bi bi-x-lg"></i> Hide
                  </button>
                </div>

                {recommendedPlaces.length > 0 ? (
                  <>
                    <div className="alert alert-info mb-4">
                      <i className="bi bi-info-circle me-2"></i>
                      Select the places you want to visit, then click "Save Trip" below.
                      {selectedPlaces.length > 0 && (
                        <strong className="ms-2">({selectedPlaces.length} selected)</strong>
                      )}
                    </div>
                    
                    <div className="row g-4 mb-4">
                      {recommendedPlaces.map((place, index) => {
                        const isSelected = selectedPlaces.some(p => p.name === place.name);
                        return (
                          <div key={index} className="col-md-6">
                            <div 
                              className={`card h-100 border-0 shadow-sm hover-lift ${isSelected ? 'border-success' : ''}`}
                              style={{ 
                                border: isSelected ? '3px solid #28a745' : 'none',
                                cursor: 'pointer',
                                position: 'relative'
                              }}
                              onClick={() => togglePlaceSelection(place)}
                            >
                              {isSelected && (
                                <div 
                                  className="position-absolute top-0 end-0 m-3"
                                  style={{ zIndex: 10 }}
                                >
                                  <div className="badge bg-success rounded-circle" style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <i className="bi bi-check-lg" style={{ fontSize: '1.5rem' }}></i>
                                  </div>
                                </div>
                              )}
                              {/* wishlist heart */}
                              <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 30 }} onClick={(e) => toggleWishlist(place, e)}>
                                {wishlistMap[(place.raw && place.raw.id) || place.id || place.name] ? (
                                  <button className="wishlist-btn wishlist-btn-sm active" title="Remove from wishlist"><i className="bi bi-heart-fill" /></button>
                                ) : (
                                  <button className="wishlist-btn wishlist-btn-sm inactive" title="Add to wishlist"><i className="bi bi-heart" /></button>
                                )}
                              </div>
                              <img 
                                src={getPrimaryImage(place)} 
                                alt={place.name}
                                className="card-img-top"
                                style={{ height: '200px', objectFit: 'cover', opacity: isSelected ? 0.9 : 1 }}
                                onClick={(e) => { e.stopPropagation(); setSelectedPlaceDetails(place.raw || place); }}
                              />
                              <div className="card-body">
                                <h5 className="card-title fw-bold">{place.name}</h5>
                                <div className="d-flex gap-2 mb-3">
                                  <span className="badge bg-primary">{place.type}</span>
                                  <span className="badge bg-success">₱{place.budget.toLocaleString()}</span>
                                  <span className="badge bg-warning text-dark">
                                    <i className="bi bi-star-fill"></i> {place.rating}
                                  </span>
                                </div>
                                <p className="text-muted small mb-0">
                                  {isSelected ? (
                                    <strong className="text-success">
                                      <i className="bi bi-check-circle-fill me-1"></i>
                                      Added to your trip
                                    </strong>
                                  ) : (
                                    <>Click to add to your trip</>
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="text-center">
                      {selectionWarning && selectionWarning.needsIncrease && (
                        <div className="alert alert-warning mb-3">
                          <strong>Selected places exceed activities budget.</strong>
                          Recommended total to cover selected places: <strong>₱{selectionWarning.minimalTotalNeeded?.toLocaleString?.() || (selectionWarning.minimalTotalNeeded)}</strong>.
                          <div className="mt-2">
                            <button className="btn btn-sm btn-outline-primary me-2" onClick={() => {
                              // apply suggested total
                              setFormData(prev => ({ ...prev, budget: String(selectionWarning.minimalTotalNeeded) }));
                              setSelectionWarning(null);
                            }}>Apply Suggested Budget</button>
                            <button className="btn btn-sm btn-outline-secondary" onClick={() => setSelectionWarning(null)}>Ignore</button>
                          </div>
                        </div>
                      )}

                      <button 
                        className="btn btn-danger btn-lg px-5 py-3"
                        style={{ background: 'linear-gradient(to right, #FF385C, #E31C5F)', border: 'none' }}
                        onClick={handleSaveTrip}
                        disabled={selectedPlaces.length === 0 || loading}
                      >
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2"></span>
                            Saving...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-save me-2"></i>
                            Save Trip ({selectedPlaces.length} {selectedPlaces.length === 1 ? 'place' : 'places'})
                          </>
                        )}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="alert alert-info mb-0">
                    <i className="bi bi-info-circle me-2"></i>
                    No places found matching your budget of ₱{formData.budget.toLocaleString()}. Try increasing your budget!
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Saved Trip Plans */}
          {tripPlans.length > 0 && (
            <div className="mt-5">
              <h3 className="fw-bold mb-4">Your Trip Plans</h3>
              <div className="row g-4">
                {tripPlans.map(plan => (
                  <div key={plan.id} className="col-md-6">
                    <div className="card h-100 border-0 shadow-sm hover-card">
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <h5 className="card-title fw-bold text-danger mb-0">{plan.destination}</h5>
                          <div className="btn-group">
                            <button 
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => handleEdit(plan)}
                              title="Edit"
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => handleViewItinerary(plan)}
                              title="View Itinerary"
                            >
                              <i className="bi bi-eye"></i>
                            </button>
                            <button 
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDelete(plan.id)}
                              title="Delete"
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        </div>
                        <p className="card-text small text-muted mb-2">
                          <i className="bi bi-calendar3 me-1"></i>
                          {plan.startDate} to {plan.endDate}
                        </p>
                        <p className="card-text small mb-2">
                          <i className="bi bi-wallet2 me-1"></i>
                          Budget: ₱{plan.budget?.toLocaleString()}
                        </p>
                        <p className="card-text small mb-3">
                          <i className="bi bi-brightness-high me-1"></i>
                          {plan.preferredTime}
                        </p>
                        
                        {/* Selected Places */}
                        {plan.selectedPlaces && plan.selectedPlaces.length > 0 && (
                          <div className="mt-3 pt-3 border-top">
                            <h6 className="fw-bold mb-3">
                              <i className="bi bi-geo-alt-fill text-danger me-2"></i>
                              Selected Places ({plan.selectedPlaces.length})
                            </h6>
                            <div className="row g-2">
                                {plan.selectedPlaces.map((place, idx) => (
                                <div key={idx} className="col-12">
                                  <div className="card border-0" style={{ backgroundColor: '#f8f9fa', cursor: 'pointer' }} onClick={() => setSelectedPlaceDetails(place)}>
                                    <div className="card-body p-2">
                                      <div className="d-flex align-items-center">
                                        <img 
                                          src={getPrimaryImage(place)} 
                                          alt={place.name}
                                          className="rounded"
                                          style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                                        />
                                        <div className="ms-3 flex-grow-1">
                                          <h6 className="mb-1 small fw-bold">{place.name}</h6>
                                          <div className="d-flex gap-1">
                                            <span className="badge bg-primary" style={{ fontSize: '0.7rem' }}>{place.type}</span>
                                            <span className="badge bg-success" style={{ fontSize: '0.7rem' }}>₱{(place.budget||0).toLocaleString()}</span>
                                            <span className="badge bg-warning text-dark" style={{ fontSize: '0.7rem' }}>
                                              <i className="bi bi-star-fill"></i> {place.rating}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Place Detail Modal */}
          {selectedPlaceDetails && (
            <div
              className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
              style={{ zIndex: 1050, background: 'rgba(0,0,0,0.6)' }}
              onClick={(e) => { if (e.target === e.currentTarget) setSelectedPlaceDetails(null); }}
              role="dialog"
              aria-modal="true"
            >
              <div className="bg-white shadow-lg rounded" style={{ width: '90%', maxWidth: '900px', maxHeight: '90vh', display: 'flex', overflow: 'hidden' }}>
                <div className="row g-0" style={{ flex: 1, minHeight: '60vh' }}>
                  <div className="col-md-6 d-flex align-items-center justify-content-center" style={{ background: '#f8f9fa' }}>
                    <img src={getPrimaryImage(selectedPlaceDetails)} alt={selectedPlaceDetails.name || selectedPlaceDetails.destinationName || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div className="col-md-6 p-4 d-flex flex-column" style={{ maxHeight: '100%', overflowY: 'auto' }}>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <h3 className="fw-bold mb-1">{selectedPlaceDetails.destinationName || selectedPlaceDetails.name || selectedPlaceDetails.name}</h3>
                        <div className="text-muted small">{selectedPlaceDetails.cityName || selectedPlaceDetails.city || ''}{selectedPlaceDetails.regionName ? `, ${selectedPlaceDetails.regionName}` : ''}</div>
                      </div>
                      <div className="text-warning text-end">
                        <div><i className="bi bi-star-fill"></i> {selectedPlaceDetails.rating || selectedPlaceDetails.raw?.rating || '—'}</div>
                      </div>
                    </div>
                    <p className="text-muted small mb-3">{selectedPlaceDetails.description || selectedPlaceDetails.raw?.description || ''}</p>
                    <div className="mb-3">
                      {(selectedPlaceDetails.category || selectedPlaceDetails.tags || []).slice?.(0,5).map((tag, i) => (
                        <span key={i} className="badge bg-light text-dark border me-1">{tag}</span>
                      ))}
                    </div>
                    <div className="mt-auto">
                      <div className="mb-3">
                        <strong>Estimated Budget:</strong>
                        <div className="text-muted small">{selectedPlaceDetails.budget || selectedPlaceDetails.raw?.budget || 'Varies'}</div>
                      </div>
                      <div className="card p-3 border">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <div>
                            <div className="small text-muted">Contact</div>
                            <div className="fw-bold">{selectedPlaceDetails.hostName || selectedPlaceDetails.host || selectedPlaceDetails.raw?.hostName || 'Local Host'}</div>
                          </div>
                          <div className="text-end small text-muted">Info</div>
                        </div>
                        <div className="small mb-2">
                          Phone: {selectedPlaceDetails.phone || selectedPlaceDetails.raw?.phone || 'Not provided'}
                        </div>
                        <div className="small mb-3">
                          Email: {selectedPlaceDetails.email || selectedPlaceDetails.raw?.email || 'Not provided'}
                        </div>
                        <div className="d-flex gap-2">
                          { (selectedPlaceDetails.phone || selectedPlaceDetails.raw?.phone) ? (
                            <a className="btn btn-outline-primary btn-sm" href={`tel:${selectedPlaceDetails.phone || selectedPlaceDetails.raw?.phone}`}>Call</a>
                          ) : (
                            <button className="btn btn-outline-secondary btn-sm" disabled>Call</button>
                          )}

                          { (selectedPlaceDetails.email || selectedPlaceDetails.raw?.email) ? (
                            <a className="btn btn-primary btn-sm" href={`mailto:${selectedPlaceDetails.email || selectedPlaceDetails.raw?.email}`}>Email</a>
                          ) : (
                            <button className="btn btn-secondary btn-sm" disabled>Email</button>
                          )}

                          <button className="btn btn-outline-dark btn-sm ms-auto" onClick={() => setSelectedPlaceDetails(null)}>Close</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* Itinerary Modal */}
          {itineraryToShow && (
            <div
              className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
              style={{ zIndex: 1060, background: 'rgba(0,0,0,0.6)' }}
              onClick={(e) => { if (e.target === e.currentTarget) setItineraryToShow(null); }}
              role="dialog"
              aria-modal="true"
            >
              <div className="bg-white shadow-lg rounded" style={{ width: '92%', maxWidth: '1000px', maxHeight: '90vh', overflow: 'auto' }}>
                <div className="p-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                      <h3 className="fw-bold mb-0">{itineraryToShow.title}</h3>
                      <div className="small text-muted">{itineraryToShow.startDate} → {itineraryToShow.endDate} • {itineraryToShow.numberOfDays} day{itineraryToShow.numberOfDays>1?'s':''} • {itineraryToShow.pax} pax</div>
                    </div>
                    <div>
                      <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => setItineraryToShow(null)}>Close</button>
                    </div>
                  </div>

                  <div className="mb-4">
                    {itineraryToShow.items.map((day, di) => (
                      <div key={di} className="card mb-3 shadow-sm">
                        <div className="card-body">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <h6 className="mb-0 fw-bold">{day.day} — {day.date}</h6>
                          </div>
                          <ul className="list-unstyled mb-0 mt-2">
                            {day.activities.map((act, ai) => (
                              <li key={ai} className="d-flex align-items-start mb-2">
                                <div style={{ width: '90px' }} className="text-muted small">{act.time}</div>
                                <div className="d-flex">
                                  {act.image ? (
                                    <img src={act.image} alt={act.activity} style={{ width: '90px', height: '60px', objectFit: 'cover', borderRadius: '6px', marginRight: '12px' }} />
                                  ) : null}
                                  <div>
                                    <div className="fw-bold small">{act.activity}</div>
                                    {act.notes && <div className="small text-muted">{act.notes}</div>}
                                  </div>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
    </>
  );
}

export default Destinations;