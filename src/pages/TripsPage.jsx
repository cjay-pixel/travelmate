
import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase';

function TripsPage({ user, onNavigate }) {
  const [tripPlans, setTripPlans] = useState([]);
  const [selectedPlaceDetails, setSelectedPlaceDetails] = useState(null);

  useEffect(() => {
    const loadTrips = async () => {
      if (!user) return;
      try {
        const q = query(collection(db, 'tripPlans'), where('userId', '==', user.uid));
        const snap = await getDocs(q);
        const plans = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setTripPlans(plans);
      } catch (err) {
        console.error('Failed to load trip plans', err);
      }
    };
    loadTrips();
  }, [user]);

  return (
    <div>
      <Header user={user} onNavigate={onNavigate} />
      <div className="container py-5">
        <div className="text-center mb-4">
          <h1 className="fw-bold">My Trips</h1>
          <p className="text-muted">All your saved trip plans are listed here.</p>
        </div>

        {user ? (
          tripPlans.length > 0 ? (
            <div className="row g-4">
              {tripPlans.map(plan => (
                <div key={plan.id} className="col-md-6">
                  <div className="card h-100 border-0 shadow-sm hover-card">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h5 className="card-title fw-bold text-danger mb-0">{plan.destination}</h5>
                        <div className="btn-group">
                          <button className="btn btn-sm btn-outline-primary" onClick={() => onNavigate('easy-planning', plan)} title="Edit">
                            <i className="bi bi-pencil"></i>
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
          ) : (
            <div className="text-center py-5">
              <i className="bi bi-inbox fs-1 text-muted"></i>
              <p className="mt-3 text-muted">You have no saved trips yet. Create one in Easy Planning.</p>
            </div>
          )
        ) : (
          <div className="text-center py-5 text-muted">Please log in to view your trips.</div>
        )}
      </div>

      {/* Place Detail Modal (mirrors Destinations) */}
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
                <img src={selectedPlaceDetails.image || selectedPlaceDetails.imageUrl || 'https://via.placeholder.com/600x400'} alt={selectedPlaceDetails.name || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div className="col-md-6 p-4 d-flex flex-column" style={{ maxHeight: '100%', overflowY: 'auto' }}>
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <h3 className="fw-bold mb-1">{selectedPlaceDetails.name}</h3>
                    <div className="text-muted small">{selectedPlaceDetails.cityName || ''}</div>
                  </div>
                  <div className="text-warning text-end">
                    <div><i className="bi bi-star-fill"></i> {selectedPlaceDetails.rating || '—'}</div>
                  </div>
                </div>
                <p className="text-muted small mb-3">{selectedPlaceDetails.description || ''}</p>
                <div className="mb-3">
                  {(selectedPlaceDetails.category || selectedPlaceDetails.tags || []).slice?.(0,5).map((tag, i) => (
                    <span key={i} className="badge bg-light text-dark border me-1">{tag}</span>
                  ))}
                </div>
                <div className="mt-auto">
                  <div className="mb-3">
                    <strong>Estimated Budget:</strong>
                    <div className="text-muted small">{selectedPlaceDetails.budget || 'Varies'}</div>
                  </div>
                  <div className="card p-3 border">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <div>
                        <div className="small text-muted">Contact</div>
                        <div className="fw-bold">{selectedPlaceDetails.hostName || selectedPlaceDetails.host || 'Local Host'}</div>
                      </div>
                      <div className="text-end small text-muted">Info</div>
                    </div>
                    <div className="small mb-2">Phone: {selectedPlaceDetails.phone || 'Not provided'}</div>
                    <div className="small mb-3">Email: {selectedPlaceDetails.email || 'Not provided'}</div>
                    <div className="d-flex gap-2">
                      { selectedPlaceDetails.phone ? (
                        <a className="btn btn-outline-primary btn-sm" href={`tel:${selectedPlaceDetails.phone}`}>Call</a>
                      ) : (
                        <button className="btn btn-outline-secondary btn-sm" disabled>Call</button>
                      )}

                      { selectedPlaceDetails.email ? (
                        <a className="btn btn-primary btn-sm" href={`mailto:${selectedPlaceDetails.email}`}>Email</a>
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

      <Footer />
    </div>
  );
}

export default TripsPage;
