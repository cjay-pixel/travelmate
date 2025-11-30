import React, { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, query, where, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';

function Destinations({ user }) {
  const [tripPlans, setTripPlans] = useState([]);
  const [editingId, setEditingId] = useState(null);
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

  // Popular Philippine destinations
  const popularDestinations = [
    'Manila', 'Boracay', 'Palawan', 'Cebu', 'Bohol', 
    'Siargao', 'Baguio', 'Vigan', 'Davao', 'El Nido',
    'Coron', 'Batanes', 'Sagada', 'Ilocos Norte', 'Camiguin'
  ];

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

      if (editingId) {
        // Update existing trip plan
        await updateDoc(doc(db, 'tripPlans', editingId), {
          ...formData,
          budgetBreakdown,
          updatedAt: new Date().toISOString()
        });
        alert('Trip plan updated successfully!');
        setEditingId(null);
      } else {
        // Save new trip plan to Firestore
        await addDoc(collection(db, 'tripPlans'), {
          ...formData,
          budgetBreakdown,
          userId: user.uid,
          userEmail: user.email,
          createdAt: new Date().toISOString()
        });
        alert('Trip plan saved successfully!');
      }
      
      // Reset form
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
    setEditingId(plan.id);
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          {/* Main Form Card */}
          <div className="card shadow-lg border-0 rounded-4 mb-5">
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
                Let AI help you create the perfect itinerary
              </p>

              <form onSubmit={handleSubmit}>
                {/* Destination */}
                <div className="mb-4">
                  <label className="form-label fw-bold">
                    <i className="bi bi-geo-alt-fill text-danger me-2"></i>
                    Destination
                  </label>
                  <select 
                    className="form-select form-select-lg"
                    value={formData.destination}
                    onChange={(e) => handleInputChange('destination', e.target.value)}
                    required
                  >
                    <option value="">Select a destination</option>
                    {popularDestinations.map((dest, index) => (
                      <option key={index} value={dest}>{dest}</option>
                    ))}
                  </select>
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
                    max="50000"
                    step="500"
                    value={formData.budget}
                    onChange={(e) => handleInputChange('budget', parseInt(e.target.value))}
                  />
                  <div className="d-flex justify-content-between small text-muted">
                    <span>₱1,000</span>
                    <span>₱50,000</span>
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
                  
                  <div className="alert alert-info mt-3 small">
                    <i className="bi bi-info-circle me-2"></i>
                    Total: {Object.values(formData.budgetAllocation).reduce((a, b) => a + b, 0)}%
                  </div>
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
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Processing...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-stars me-2"></i>
                      {editingId ? 'Update Trip Plan' : 'Get AI Recommendations'}
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

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
                        <p className="card-text small mb-0">
                          <i className="bi bi-brightness-high me-1"></i>
                          {plan.preferredTime}
                        </p>
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
  );
}

export default Destinations;