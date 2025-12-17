import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { collection, /* getDocs, */ onSnapshot } from 'firebase/firestore';
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
      for (const k of Object.keys(value)) walk(value[k]);
    }
  }

  walk(obj);
  return Array.from(urls);
}

function SearchResultsPage({ user, onNavigate, searchQuery }) {
  const [allDestinations, setAllDestinations] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState(null);

  useEffect(() => {
    // listen to admin destinations in real-time
    setLoading(true);
    const ref = collection(db, 'destinations');
    const unsubscribe = onSnapshot(ref, (snap) => {
      try {
        const list = [];
        snap.forEach(doc => {
          const data = doc.data() || {};
          const images = collectImageUrls(data);

          // normalize price/budget
          let pricePerDay = data.price || data.estimatedCost || data.estimated_cost;
          if (pricePerDay === undefined || pricePerDay === null) {
            if (typeof data.budget === 'number') pricePerDay = data.budget;
            else if (typeof data.budget === 'string') {
              const nums = data.budget.replace(/[,₱\s]/g, '').match(/\d+/g);
              if (nums && nums.length) pricePerDay = parseInt(nums[0], 10);
            }
          }

          list.push({
            id: doc.id,
            name: data.destinationName || data.name || data.cityName || 'Unknown',
            location: data.cityName || data.regionName || data.province || '',
            images,
            image: images[0] || data.image || data.imageUrl || '',
            pricePerDay: Number(pricePerDay) || 0,
            description: data.description || data.summary || '',
            tags: data.category || data.tags || [],
            raw: data,
            phone: data.phone || data.contactPhone || '',
            email: data.email || data.contactEmail || ''
          });
        });
        setAllDestinations(list);
      } catch (err) {
        console.error('Failed to process destinations snapshot for search:', err);
      } finally {
        setLoading(false);
      }
    }, (err) => {
      console.error('Failed to listen to destinations for search:', err);
      setLoading(false);
    });

    return () => { try { unsubscribe(); } catch (e) {} };
  }, []);

  useEffect(() => {
    if (!searchQuery) {
      setResults([]);
      return;
    }
    const q = searchQuery.toLowerCase();
    const filtered = allDestinations.filter(dest => {
      return (
        (dest.name || '').toString().toLowerCase().includes(q) ||
        (dest.location || '').toString().toLowerCase().includes(q) ||
        (dest.description || '').toString().toLowerCase().includes(q) ||
        (dest.tags || []).some(t => ('' + t).toLowerCase().includes(q))
      );
    });
    setResults(filtered);
  }, [searchQuery, allDestinations]);

  function ImageCarousel({ images = [], height = '200px', fit = 'cover' }) {
    const [idx, setIdx] = useState(0);
    const len = images?.length || 0;
    if (len === 0) {
      return (
        <div className="card-img-top d-flex align-items-center justify-content-center" style={{ height, background: '#f0f0f0' }}>
          <img src={'https://via.placeholder.com/600x400?text=No+Image'} alt="No image" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: fit }} />
        </div>
      );
    }

    return (
      <div className="position-relative d-flex align-items-center justify-content-center" style={{ height, background: fit === 'contain' ? '#000' : 'transparent' }}>
        <img src={images[idx]} className="card-img-top" alt={`Image ${idx + 1}`} style={{ height: '100%', width: '100%', objectFit: fit }} />
        {len > 1 && (
          <>
            <button type="button" className="btn btn-sm btn-light" style={{ position: 'absolute', top: '50%', left: 8, transform: 'translateY(-50%)' }} onClick={(e) => { e.stopPropagation(); setIdx((idx - 1 + len) % len); }} aria-label="Previous image">‹</button>
            <button type="button" className="btn btn-sm btn-light" style={{ position: 'absolute', top: '50%', right: 8, transform: 'translateY(-50%)' }} onClick={(e) => { e.stopPropagation(); setIdx((idx + 1) % len); }} aria-label="Next image">›</button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="min-vh-100 d-flex flex-column">
      <Header user={user} onNavigate={onNavigate} />

      <div className="flex-grow-1 bg-light py-5">
        <div className="container">
          <div className="mb-4">
            <h2 className="fw-bold">{searchQuery ? `Search results for "${searchQuery}"` : 'Search Results'}</h2>
            <p className="text-muted">{loading ? 'Loading...' : `${results.length} ${results.length === 1 ? 'destination' : 'destinations'} found`}</p>
          </div>

          {(!searchQuery || results.length === 0) ? (
            <div className="text-center py-5">
              <i className="bi bi-search fs-1 text-muted mb-3 d-block"></i>
              <h4 className="text-muted">{searchQuery ? 'No destinations found' : 'Enter a search query to see results'}</h4>
              <p className="text-muted">Try searching for beaches, mountains, or city names</p>
            </div>
          ) : (
            <div className="row g-4">
              {results.map(dest => (
                <div key={dest.id} className="col-12 col-md-6 col-lg-4">
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedDestination(dest)}
                    onKeyDown={(e) => { if (e.key === 'Enter') setSelectedDestination(dest); }}
                    className="card h-100 border-0 shadow-sm hover-shadow"
                    style={{ transition: 'all 0.3s', cursor: 'pointer' }}
                  >
                    <ImageCarousel images={dest.images || (dest.image ? [dest.image] : [])} height={'200px'} />
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <h5 className="card-title fw-bold mb-1">{dest.name}</h5>
                          <p className="text-muted small mb-2"><i className="bi bi-geo-alt-fill me-1"></i>{dest.location}</p>
                        </div>
                      </div>
                      <p className="card-text text-muted small mb-3">{dest.description}</p>
                      <div className="mb-3">
                        {(dest.tags || []).slice(0,3).map((tag, index) => (
                          <span key={index} className="badge bg-light text-dark me-1 mb-1">{tag}</span>
                        ))}
                      </div>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <span className="fw-bold fs-5">₱{(dest.pricePerDay||0).toLocaleString()}</span>
                          <span className="text-muted small"> / day</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />

      {/* Detail Modal */}
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
                    <div className="text-muted small">{selectedDestination.location}</div>
                  </div>
                  <div className="text-warning text-end">
                    <div><i className="bi bi-star-fill"></i></div>
                  </div>
                </div>

                <p className="text-muted small mb-3">{selectedDestination.description}</p>

                <div className="mb-3">
                  {(selectedDestination.tags || []).map((tag, idx) => (
                    <span key={idx} className="badge bg-light text-dark border me-1">{tag}</span>
                  ))}
                </div>

                <div className="mt-auto">
                  <div className="mb-3">
                    <strong>Estimated Budget:</strong>
                    <div className="text-muted small">{selectedDestination.pricePerDay ? `₱${selectedDestination.pricePerDay.toLocaleString()} / day` : 'Varies'}</div>
                  </div>

                  <div className="card p-3 border">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <div>
                        <div className="small text-muted">Contact</div>
                        <div className="fw-bold">Host</div>
                      </div>
                      <div className="text-end small text-muted">Verified</div>
                    </div>

                    <div className="d-flex gap-2">
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
  );
}

export default SearchResultsPage;
