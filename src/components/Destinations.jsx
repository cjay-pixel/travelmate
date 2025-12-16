import React, { useEffect, useState, useRef } from 'react';
import { collection, getDocs, addDoc, query, where, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';

function Destinations({ user, initialPlan }) {
  const [tripPlans, setTripPlans] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [recommendedPlaces, setRecommendedPlaces] = useState([]);
  const [selectedPlaces, setSelectedPlaces] = useState([]);
  const [availableCities, setAvailableCities] = useState([]);
  const [allAdminPlaces, setAllAdminPlaces] = useState([]);
  const [selectedPlaceDetails, setSelectedPlaceDetails] = useState(null);
  const [formData, setFormData] = useState({
    destination: '',
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
      setTripPlans(plans);
    };
    fetchTripPlans();
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

  const handleInputChange = (field, value) => {
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

      // filter by numeric budget when provided by admin doc
      const filteredPlaces = matches.filter(place => {
        const b = Number(place.budget);
        if (!isNaN(b) && b > 0) return b <= formData.budget;
        return true;
      });

      setRecommendedPlaces(filteredPlaces.map(p => ({
        name: p.destinationName || p.cityName || 'Unknown',
        type: (p.category && p.category[0]) || 'General',
        budget: Number(p.budget) || 0,
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

  const togglePlaceSelection = (place) => {
    setSelectedPlaces(prev => {
      const isSelected = prev.some(p => p.name === place.name);
      if (isSelected) {
        return prev.filter(p => p.name !== place.name);
      } else {
        return [...prev, place];
      }
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

      if (editingId) {
        // Update existing trip plan
        await updateDoc(doc(db, 'tripPlans', editingId), {
          ...formData,
          budgetBreakdown,
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
          budgetBreakdown,
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
      budget: plan.budget,
      budgetAllocation: plan.budgetAllocation,
      startDate: plan.startDate,
      endDate: plan.endDate,
      preferredTime: plan.preferredTime
    });
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
      setTripPlans(plans);
    } catch (error) {
      alert('Error deleting trip plan: ' + error.message);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({
      destination: '',
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

                {/* Budget */}
                <div className="mb-4">
                  <label className="form-label fw-bold">
                    <i className="bi bi-wallet2 text-success me-2"></i>
                    Total Budget: ₱{formData.budget.toLocaleString()}
                  </label>
                  <input
                    type="range"
                    className="form-range"
                    min="1000"
                    max="500000"
                    step="1000"
                    value={formData.budget}
                    onChange={(e) => handleInputChange('budget', parseInt(e.target.value))}
                  />
                  <div className="d-flex justify-content-between small text-muted">
                    <span>₱1,000</span>
                    <span>₱500,000</span>
                  </div>
                </div>

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
                              <img 
                                src={place.image} 
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
                                          src={place.image} 
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
                    <img src={(selectedPlaceDetails.images && selectedPlaceDetails.images[0]) || selectedPlaceDetails.image || selectedPlaceDetails.imageUrl || 'https://via.placeholder.com/600x400'} alt={selectedPlaceDetails.name || selectedPlaceDetails.destinationName || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
        </div>
      </div>
      </div>
    </>
  );
}

export default Destinations;