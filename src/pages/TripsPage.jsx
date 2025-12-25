
import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { collection, getDocs, query, where, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';

function TripsPage({ user, onNavigate }) {
  const [tripPlans, setTripPlans] = useState([]);
  const [selectedPlaceDetails, setSelectedPlaceDetails] = useState(null);
  const [itineraryToShow, setItineraryToShow] = useState(null);

  useEffect(() => {
    const loadTrips = async () => {
      if (!user) return;
      try {
        const q = query(collection(db, 'tripPlans'), where('userId', '==', user.uid));
        const snap = await getDocs(q);
        const plans = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        // sort by updatedAt (newest first), fall back to createdAt
        plans.sort((a, b) => {
          const tb = Date.parse(b.updatedAt || b.createdAt) || 0;
          const ta = Date.parse(a.updatedAt || a.createdAt) || 0;
          return tb - ta;
        });
        setTripPlans(plans);
      } catch (err) {
        console.error('Failed to load trip plans', err);
      }
    };
    loadTrips();
  }, [user]);

  const refreshTrips = async () => {
    if (!user) return;
    try {
      const q = query(collection(db, 'tripPlans'), where('userId', '==', user.uid));
      const snap = await getDocs(q);
      const plans = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      plans.sort((a, b) => {
        const tb = Date.parse(b.updatedAt || b.createdAt) || 0;
        const ta = Date.parse(a.updatedAt || a.createdAt) || 0;
        return tb - ta;
      });
      setTripPlans(plans);
    } catch (err) {
      console.error('Failed to load trip plans', err);
    }
  };

  const handleDelete = async (planId) => {
    if (!window.confirm('Are you sure you want to delete this trip plan?')) return;
    try {
      await deleteDoc(doc(db, 'tripPlans', planId));
      alert('Trip plan deleted successfully!');
      await refreshTrips();
    } catch (err) {
      console.error('Error deleting plan', err);
      alert('Failed to delete trip plan.');
    }
  };

  // Simple itinerary generator (matches Destinations logic)
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
    const hour12 = ((h + 11) % 12) + 1;
    const mm = m.toString().padStart(2, '0');
    return `${hour12.toString().padStart(2, '0')}:${mm} ${period}`;
  };

  const generateTimeSlots = (preferred, count = 5) => {
    const windows = {
      morning: { start: 6, end: 12 },
      afternoon: { start: 12, end: 18 },
      evening: { start: 18, end: 24 },
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

  const generateItineraryFromPlan = (plan) => {
    if (!plan) return null;
    const start = new Date(plan.startDate);
    const days = computeDays(plan.startDate, plan.endDate);
    const places = plan.selectedPlaces || [];
    const preferred = plan.preferredTime || 'morning';

    const timeSlots = {
      morning: ['08:00 AM','10:00 AM','11:00 AM','02:00 PM','05:00 PM'],
      afternoon: ['10:00 AM','12:00 PM','03:00 PM','05:00 PM','07:00 PM'],
      evening: ['12:00 PM','03:00 PM','06:00 PM','08:00 PM','10:00 PM'],
      flexible: ['08:00 AM','11:00 AM','02:00 PM','05:00 PM','08:00 PM']
    };

    const slots = timeSlots[preferred] || timeSlots.morning;
    const itinerary = [];
    for (let i = 0; i < days; i++) {
      const dayDate = new Date(start);
      dayDate.setDate(start.getDate() + i);
      const dayLabel = `Day ${i + 1}`;

      const placesForDay = [];
      if (places.length > 0) {
        const perDay = Math.max(1, Math.ceil(places.length / days));
        const startIdx = i * perDay;
        for (let j = 0; j < perDay; j++) {
          const p = places[(startIdx + j) % places.length];
          if (p) placesForDay.push(p);
        }
      }

      // prioritize slots based on preferred time so main activities align with user's preference
      const preferredStartIndex = (preferred === 'morning') ? 0 : (preferred === 'afternoon') ? 1 : (preferred === 'evening') ? 2 : 0;
      const slotToPlace = new Array(slots.length).fill(null);
      for (let j = 0; j < placesForDay.length; j++) {
        const slotIdx = (preferredStartIndex + j) % slots.length;
        slotToPlace[slotIdx] = placesForDay[j];
      }

      const mealLabel = (preferred === 'evening') ? 'Dinner' : 'Lunch';
      const activities = [];
      for (let s = 0; s < slots.length; s++) {
        const place = slotToPlace[s] || null;
        const image = place ? (place.image || place.images?.[0] || '') : '';
        if (s === 0) activities.push({ time: slots[s], activity: place ? `Visit ${place.name}` : 'Breakfast / Travel', notes: place?.notes || place?.type || '', image });
        else if (s === 1 && place) activities.push({ time: slots[s], activity: `Explore ${place.name}`, notes: place?.notes || '', image });
        else if (s === 2) activities.push({ time: slots[s], activity: mealLabel, notes: mealLabel === 'Lunch' ? 'Try local cuisine' : 'Enjoy dinner at a local spot', image: '' });
        else if (s === 3) activities.push({ time: slots[s], activity: place ? `Continue at ${place.name}` : 'Free time', notes: '', image });
        else activities.push({ time: slots[s], activity: 'Return to Hotel / Rest', notes: '', image: '' });
      }

      itinerary.push({ day: dayLabel, date: dayDate.toISOString().split('T')[0], activities });
    }

    return { title: `${plan.destination} Trip`, startDate: plan.startDate, endDate: plan.endDate, pax: plan.pax || 1, numberOfDays: days, items: itinerary };
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
                          <button className="btn btn-sm btn-outline-secondary" onClick={() => handleViewItinerary(plan)} title="View Itinerary">
                            <i className="bi bi-eye"></i>
                          </button>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(plan.id)} title="Delete">
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

      {/* Itinerary Modal (from Trips) */}
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

      <Footer />
    </div>
  );
}

export default TripsPage;
