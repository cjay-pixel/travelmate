import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';

// Recursively collect likely image URLs from an object
function collectImageUrls(obj) {
  const urls = new Set();
  const urlLike = (v) => typeof v === 'string' && (v.startsWith('http') || v.startsWith('data:') || /\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(v) || /images\.unsplash|firebasestorage/i.test(v));

  function walk(value) {
    if (!value) return;
    if (typeof value === 'string') {
      if (urlLike(value)) urls.add(value.trim());
      return;
    }
    if (Array.isArray(value)) {
      for (const it of value) walk(it);
      return;
    }
    if (typeof value === 'object') {
      for (const k of Object.keys(value)) {
        walk(value[k]);
      }
    }
  }

  walk(obj);
  return Array.from(urls);
}

function BudgetFriendlyPage({ user, onNavigate }) {
  const [filters, setFilters] = useState({
    budget: 15000,
    startDate: '',
    endDate: ''
  });
  const [showResults, setShowResults] = useState(false);
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState(null);

  useEffect(() => {
    loadDestinations();
  }, []);

  const loadDestinations = async () => {
    try {
      setLoading(true);
      const destinationsRef = collection(db, 'destinations');
      const snapshot = await getDocs(destinationsRef);

      const list = [];
      snapshot.forEach((doc) => {
        const data = doc.data() || {};

        // collect images robustly from any nested fields
        let images = collectImageUrls(data);

        list.push({
          id: doc.id,
          name: `${data.destinationName || data.name || ''}`,
          cityName: data.cityName || '',
          regionName: data.regionName || data.province || '',
          images: images,
          image: images[0] || data.image || '',
          description: data.description || data.summary || '',
          estimatedCost: data.estimatedCost || data.estimated_cost || data.price || (typeof data.budget === 'number' ? data.budget : undefined),
          duration: data.duration || data.length || '',
          highlights: data.highlights || [],
          tags: data.category || data.tags || [],
          budgetBreakdown: data.budgetBreakdown || data.breakdown || {},
          phone: data.phone || data.contactPhone || '',
          email: data.email || data.contactEmail || '',
          hostName: data.hostName || data.host || '',
          rating: typeof data.rating === 'number' ? data.rating : (data.rating ? parseFloat(data.rating) : undefined),
          isAISuggestion: data.source === 'AI Generated'
        });
      });

      setDestinations(list);
    } catch (error) {
      console.error('Error loading destinations:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDays = () => {
    if (filters.startDate && filters.endDate) {
      const start = new Date(filters.startDate);
      const end = new Date(filters.endDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays;
    }
    return 0;
  };

  const handleSearch = () => {
    setShowResults(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReset = () => {
    setFilters({
      budget: 15000,
      startDate: '',
      endDate: ''
    });
    setShowResults(false);
  };

  const getFilteredDestinations = () => {
    const parseCost = (dest) => {
      if (typeof dest.estimatedCost === 'number') return dest.estimatedCost;
      if (!dest.estimatedCost && dest.budgetBreakdown) {
        // try to sum breakdown values
        const vals = Object.values(dest.budgetBreakdown).filter(v => typeof v === 'number');
        if (vals.length) return vals.reduce((s, v) => s + v, 0);
      }
      if (typeof dest.estimatedCost === 'string') {
        const nums = dest.estimatedCost.replace(/[,₱\s]/g, '').match(/\d+/g);
        if (nums && nums.length) return parseInt(nums[0], 10);
      }
      return Infinity;
    };

    return destinations
      .map(dest => ({ ...dest, __cost: parseCost(dest) }))
      .filter(dest => dest.__cost <= filters.budget)
      .sort((a, b) => (a.__cost || Infinity) - (b.__cost || Infinity));
  };

  const togglePreference = (prefId) => {
    // preferences removed for Budget Friendly page
  };


  const tripDays = calculateDays();

  // Simple image carousel component (local to this page)
  function ImageCarousel({ images = [], height = '200px', fit = 'cover' }) {
    const [idx, setIdx] = useState(0);
    const len = images?.length || 0;
    if (len === 0) {
      return (
        <div className="card-img-top d-flex align-items-center justify-content-center" style={{ height, background: '#f0f0f0' }}>
          <img
            src={'https://via.placeholder.com/600x400?text=No+Image'}
            alt="No image"
            style={{ maxHeight: '100%', maxWidth: '100%', objectFit: fit }}
          />
        </div>
      );
    }

    return (
      <div className="position-relative d-flex align-items-center justify-content-center" style={{ height, background: fit === 'contain' ? '#000' : 'transparent' }}>
        <img
          src={images[idx]}
          className="card-img-top"
          alt={`Image ${idx + 1}`}
          style={{ height: '100%', width: '100%', objectFit: fit, transition: 'opacity .25s ease-in-out' }}
        />
        {len > 1 && (
          <>
            <button
              type="button"
              className="btn btn-sm btn-light"
              style={{ position: 'absolute', top: '50%', left: 8, transform: 'translateY(-50%)' }}
              onClick={(e) => { e.stopPropagation(); setIdx((idx - 1 + len) % len); }}
              aria-label="Previous image"
            >
              ‹
            </button>
            <button
              type="button"
              className="btn btn-sm btn-light"
              style={{ position: 'absolute', top: '50%', right: 8, transform: 'translateY(-50%)' }}
              onClick={(e) => { e.stopPropagation(); setIdx((idx + 1) % len); }}
              aria-label="Next image"
            >
              ›
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div>
      <Header user={user} onNavigate={onNavigate} />
      
      <div className="container py-5">
        <div className="text-center mb-5">
          <h1 className="fw-bold mb-3">
            <i className="bi bi-piggy-bank text-success me-2"></i>
            Budget Friendly Destinations
          </h1>
          <p className="text-muted">Find the perfect destination that fits your budget and schedule</p>
        </div>

        {/* Filter Section */}
        <div className="card shadow-sm border-0 mb-5">
          <div className="card-body p-4">
            <h5 className="fw-bold mb-4">Set Your Budget & Dates</h5>
            
            <div className="row g-4">
              {/* Budget Slider */}
              <div className="col-md-12">
                <label className="form-label fw-bold">
                  <i className="bi bi-wallet2 text-success me-2"></i>
                  Total Budget: ₱{filters.budget.toLocaleString()}
                </label>
                <input 
                  type="range"
                  className="form-range"
                  min="5000"
                  max="50000"
                  step="1000"
                  value={filters.budget}
                  onChange={(e) => setFilters({...filters, budget: parseInt(e.target.value)})}
                />
                <div className="d-flex justify-content-between small text-muted">
                  <span>₱5,000</span>
                  <span>₱50,000</span>
                </div>
              </div>

              {/* Date Range */}
              <div className="col-md-6">
                <label className="form-label fw-bold">
                  <i className="bi bi-calendar-check text-primary me-2"></i>
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
                    value={filters.startDate}
                    onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                    min={new Date().toISOString().split('T')[0]}
                    required
                    style={{ cursor: 'pointer' }}
                  />
                </div>
              </div>

              <div className="col-md-6">
                <label className="form-label fw-bold">
                  <i className="bi bi-calendar-check text-primary me-2"></i>
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
                    value={filters.endDate}
                    onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                    min={filters.startDate || new Date().toISOString().split('T')[0]}
                    required
                    style={{ cursor: 'pointer' }}
                  />
                </div>
              </div>

              {tripDays > 0 && (
                <div className="col-12">
                  <div className="alert alert-info mb-0">
                    <i className="bi bi-info-circle me-2"></i>
                    Trip Duration: <strong>{tripDays} days</strong>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 d-flex gap-2">
              <button 
                className="btn btn-success btn-lg flex-grow-1"
                onClick={handleSearch}
              >
                <i className="bi bi-search me-2"></i>
                Find Destinations
              </button>
              {showResults && (
                <button 
                  className="btn btn-outline-secondary btn-lg"
                  onClick={handleReset}
                >
                  <i className="bi bi-arrow-clockwise me-2"></i>
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Results Section */}
        {showResults && (
          <div>
            <h4 className="fw-bold mb-4">
              {getFilteredDestinations().length} Destinations Found Within Your Budget
            </h4>

            <div className="row g-4">
              {getFilteredDestinations().map((destination) => (
                <div key={destination.id} className="col-md-6 col-lg-4">
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedDestination(destination)}
                    onKeyDown={(e) => { if (e.key === 'Enter') setSelectedDestination(destination); }}
                    className="card border-0 shadow-sm h-100"
                    style={{ cursor: 'pointer' }}
                  >
                    <ImageCarousel images={destination.images || (destination.image ? [destination.image] : [])} height={'200px'} />
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <h5 className="card-title fw-bold mb-0">{destination.name}{destination.cityName ? `, ${destination.cityName}` : ''}</h5>
                          <div className="text-warning">
                            <i className="bi bi-star-fill"></i> {destination.rating || '—'}
                          </div>
                        </div>

                        <p className="card-text text-muted small mb-3">{destination.description}</p>

                        <div className="d-flex flex-wrap gap-1 mb-3">
                          {(destination.tags || []).slice(0, 3).map((tag, idx) => (
                            <span key={idx} className="badge bg-light text-dark border">
                              {tag}
                            </span>
                          ))}
                        </div>

                                            <div className="d-flex justify-content-between align-items-center">
                                              <small className="text-muted">
                                                <i className="bi bi-wallet2 me-1"></i>
                                                {(destination.estimatedCost && typeof destination.estimatedCost === 'number') ? `₱${destination.estimatedCost.toLocaleString()}` : 'Varies'}
                                              </small>
                                            </div>
                      </div>
                  </div>
                </div>
              ))}
            </div>

            {getFilteredDestinations().length === 0 && (
              <div className="text-center py-5">
                <i className="bi bi-emoji-frown text-muted" style={{ fontSize: '3rem' }}></i>
                <p className="text-muted mt-3">No destinations found within your budget. Try increasing your budget.</p>
              </div>
            )}
          
            {/* Detail Modal for selected destination */}
            {selectedDestination && (
              <div
                className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                style={{ zIndex: 1050, background: 'rgba(0,0,0,0.6)' }}
                onClick={(e) => { if (e.target === e.currentTarget) setSelectedDestination(null); }}
                role="dialog"
                aria-modal="true"
              >
                <div className="bg-white shadow-lg rounded position-relative" style={{ width: '90%', maxWidth: '1000px', maxHeight: '90vh', display: 'flex', overflow: 'hidden' }}>
                  <div className="modal-close-overlay">
                    <button aria-label="Close" onClick={() => setSelectedDestination(null)}>✕</button>
                  </div>
                  <div className="row g-0" style={{ flex: 1, minHeight: '60vh' }}>
                    <div className="col-md-7" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ImageCarousel images={selectedDestination.images || (selectedDestination.image ? [selectedDestination.image] : [])} height={'100%'} fit={'contain'} />
                    </div>
                    <div className="col-md-5 p-4 d-flex flex-column" style={{ maxHeight: '100%', overflowY: 'auto' }}>
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <h3 className="fw-bold mb-1">{selectedDestination.name}</h3>
                          <div className="text-muted small">{selectedDestination.duration}</div>
                        </div>
                        <div className="text-warning text-end">
                          <div><i className="bi bi-wallet2"></i> {(selectedDestination.estimatedCost && typeof selectedDestination.estimatedCost === 'number') ? `₱${selectedDestination.estimatedCost.toLocaleString()}` : 'Varies'}</div>
                        </div>
                      </div>

                      <p className="text-muted small mb-3">{selectedDestination.description}</p>

                      <div className="mb-3">
                        {(selectedDestination.highlights || []).map((tag, idx) => (
                          <span key={idx} className="badge bg-light text-dark border me-1">{tag}</span>
                        ))}
                      </div>

                      <div className="mt-auto">
                        <div className="mb-3">
                          <strong>Estimated Budget:</strong>
                          <div className="text-muted small">{(selectedDestination.estimatedCost && typeof selectedDestination.estimatedCost === 'number') ? `₱${selectedDestination.estimatedCost.toLocaleString()}` : (selectedDestination.budgetBreakdown ? 'See breakdown' : 'Varies')}</div>
                        </div>

                        <div className="card p-3 border">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <div>
                              <div className="small text-muted">Contact</div>
                              <div className="fw-bold">{selectedDestination.hostName || 'Local Host'}</div>
                            </div>
                            <div className="text-end small text-muted">Verified</div>
                          </div>

                          <div className="small mb-2">
                            Phone: {selectedDestination.phone || 'Not provided'}
                          </div>
                          <div className="small mb-3">
                            Email: {selectedDestination.email || 'Not provided'}
                          </div>

                          <div className="d-flex gap-2">
                            { (selectedDestination.phone) ? (
                              <a className="btn btn-outline-primary btn-sm" href={`tel:${selectedDestination.phone}`}>Call</a>
                            ) : (
                              <button className="btn btn-outline-secondary btn-sm" disabled>Call</button>
                            )}

                            { (selectedDestination.email) ? (
                              <a className="btn btn-primary btn-sm" href={`mailto:${selectedDestination.email}`}>Email</a>
                            ) : (
                              <button className="btn btn-secondary btn-sm" disabled>Email</button>
                            )}

                            <button className="btn btn-outline-dark btn-sm ms-auto" onClick={() => setSelectedDestination(null)}>Close</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

export default BudgetFriendlyPage;
