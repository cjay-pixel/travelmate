import React, { useEffect, useState, useRef } from 'react';
import DestinationDetailModal from './DestinationDetailModal';
import { collection, /* getDocs, */ onSnapshot, query, where, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';

// Small ImageCarousel used inside cards
function ImageCarousel({ images = [], height = '180px', fit = 'cover' }) {
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

function regionFor(data) {
  const field = (data.regionName || data.region || data.province || '').toString().toLowerCase();
  const city = (data.cityName || data.city || '').toString().toLowerCase();
  const tags = (data.tags || data.category || []).map(t => String(t).toLowerCase());

  if (/luzon/.test(field) || /luzon/.test(city) || tags.includes('luzon')) return 'Luzon';
  if (/visayas/.test(field) || /visayas/.test(city) || tags.includes('visayas')) return 'Visayas';
  if (/mindanao/.test(field) || /mindanao/.test(city) || tags.includes('mindanao')) return 'Mindanao';

  // province heuristics (common keywords)
  const luzonKeywords = /(manila|metro manila|pangasinan|iloc|la union|benguet|ifugao|kalinga|isabela|pampanga|bulacan|rizal|cavite|laguna|batangas|quezon|albay|bicol|camarines|tarlac|pampanga)/i;
  const visayasKeywords = /(cebu|bohol|leyte|samar|iloilo|negros|capiz|guimaras|antique|biliran)/i;
  const mindanaoKeywords = /(davao|zamboanga|misamis|surigao|agusan|bukidnon|cotabato|sarangani|sultan|maguindanao|lanao|tawi|sulu)/i;

  const combined = `${field} ${city}`;
  if (luzonKeywords.test(combined)) return 'Luzon';
  if (visayasKeywords.test(combined)) return 'Visayas';
  if (mindanaoKeywords.test(combined)) return 'Mindanao';

  return 'Other';
}

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

export default function BestDestinations({ title = 'Best Destinations', user, onNavigate }) {
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [wishlistMap, setWishlistMap] = useState({}); // placeId -> wishlistDocId

  useEffect(() => {
    setLoading(true);
    const ref = collection(db, 'destinations');
    const unsubscribe = onSnapshot(ref, (snap) => {
      try {
        const list = [];
        snap.forEach(doc => {
          const data = doc.data() || {};
          const isBest = !!data.bestDestination;
          if (!isBest) return; // only include admin-marked best destinations

          // collect images robustly from any nested fields
          let images = collectImageUrls(data);

          // normalize estimatedCost/budget
          let estimatedCost = data.estimatedCost || data.estimated_cost || data.price;
          if (estimatedCost === undefined || estimatedCost === null) {
            if (typeof data.budget === 'number') estimatedCost = data.budget;
            else if (typeof data.budget === 'string') {
              const nums = data.budget.replace(/[,₱\s]/g, '').match(/\d+/g);
              if (nums && nums.length) estimatedCost = parseInt(nums[0], 10);
            }
          }

          list.push({
            id: doc.id,
            name: data.destinationName || data.name || '',
            cityName: data.cityName || data.city || '',
            regionName: data.regionName || data.region || data.province || '',
            images,
            image: images[0] || data.image || '',
            description: data.description || data.summary || '',
            tags: data.category || data.tags || [],
            rating: typeof data.rating === 'number' ? data.rating : (data.rating ? parseFloat(data.rating) : undefined),
            estimatedCost,
            budgetBreakdown: data.budgetBreakdown || data.breakdown || {},
            phone: data.phone || data.contactPhone || '',
            email: data.email || data.contactEmail || '',
            hostName: data.hostName || data.host || '',
            isAISuggestion: data.source === 'AI Generated'
          });
        });

        setDestinations(list);
      } catch (err) {
        console.error('Error processing best destinations snapshot', err);
      } finally {
        setLoading(false);
      }
    }, (err) => {
      console.error('Failed to listen to best destinations', err);
      setLoading(false);
    });

    return () => { try { unsubscribe(); } catch (e) {} };
  }, []);

  useEffect(() => {
    if (!user) { setWishlistMap({}); return; }
    const q = query(collection(db, 'wishlists'), where('userId', '==', user.uid));
    const unsub = onSnapshot(q, (snap) => {
      const map = {};
      snap.forEach(d => {
        const data = d.data();
        if (data && data.placeId) map[data.placeId] = d.id;
      });
      setWishlistMap(map);
    }, (err) => { console.error('Wishlist listener failed', err); });
    return () => unsub();
  }, [user]);

  const toggleWishlist = async (destination, e) => {
    e.stopPropagation();
    if (!user) { alert('Please log in to add to wishlist'); return; }
    const placeId = destination.id;
    try {
      if (wishlistMap[placeId]) {
        await deleteDoc(doc(db, 'wishlists', wishlistMap[placeId]));
      } else {
        await addDoc(collection(db, 'wishlists'), {
          userId: user.uid,
          placeId,
          placeData: destination,
          createdAt: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error('Wishlist toggle failed', err);
      alert('Failed to update wishlist');
    }
  };

  const groups = destinations.reduce((acc, dest) => {
    const r = regionFor(dest);
    if (!acc[r]) acc[r] = [];
    acc[r].push(dest);
    return acc;
  }, {});

  const RegionRow = ({ region, items }) => {
    const containerRef = useRef(null);

    const scroll = (dir = 'right') => {
      const el = containerRef.current;
      if (!el) return;
      const amount = Math.round(el.clientWidth * 0.7);
      el.scrollBy({ left: dir === 'right' ? amount : -amount, behavior: 'smooth' });
    };

    return (
      <section className="mb-5">
        <div className="d-flex align-items-center mb-3">
          <h4 className="fw-bold me-3">{region}</h4>
          <div className="ms-auto d-none d-md-flex gap-2">
            <button className="btn btn-outline-secondary btn-sm" onClick={() => scroll('left')}>‹</button>
            <button className="btn btn-outline-secondary btn-sm" onClick={() => scroll('right')}>›</button>
          </div>
        </div>

        <div style={{ position: 'relative' }}>
          <div ref={containerRef} className="d-flex gap-3 overflow-x-auto pb-2" style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}>
            {items.map((destination) => (
              <div key={destination.id} className="card border-0 shadow-sm" style={{ minWidth: 280, maxWidth: 320, scrollSnapAlign: 'start', cursor: 'pointer', position: 'relative' }} onClick={() => setSelectedDestination(destination)}>
                {/* Heart / wishlist */}
                <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 30 }} onClick={(e) => toggleWishlist(destination, e)}>
                  {wishlistMap[destination.id] ? (
                    <button className="wishlist-btn wishlist-btn-sm active" title="Remove from wishlist"><i className="bi bi-heart-fill" /></button>
                  ) : (
                    <button className="wishlist-btn wishlist-btn-sm inactive" title="Add to wishlist"><i className="bi bi-heart" /></button>
                  )}
                </div>
                <ImageCarousel images={destination.images || (destination.image ? [destination.image] : [])} height={'180px'} />
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h6 className="card-title fw-bold mb-0 small">{destination.name}{destination.cityName ? `, ${destination.cityName}` : ''}</h6>
                    <div className="text-warning small"><i className="bi bi-star-fill"></i> {destination.rating || '—'}</div>
                  </div>
                  <p className="card-text text-muted small mb-2">{destination.description}</p>
                  <div className="d-flex flex-wrap gap-1">
                    {(destination.tags || []).slice(0, 3).map((tag, idx) => (
                      <span key={idx} className="badge bg-light text-dark border small">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* small arrows for mobile */}
          <div style={{ position: 'absolute', right: 8, top: '40%', display: 'flex', gap: 6 }} className="d-md-none">
            <button className="btn btn-outline-secondary btn-sm" onClick={() => scroll('left')}>‹</button>
            <button className="btn btn-outline-secondary btn-sm" onClick={() => scroll('right')}>›</button>
          </div>
        </div>
      </section>
    );
  };

      

  return (
    <div className="container py-5">
      <div className="text-center mb-4">
        <h2 className="fw-bold">Best Destinations</h2>
        <p className="text-muted">Top picks across Luzon, Visayas and Mindanao</p>
      </div>

      {loading && (
        <div className="text-center py-4">
          <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div>
        </div>
      )}

      {!loading && (
        <>
          {['Luzon','Visayas','Mindanao'].map(region => (
            (groups[region] && groups[region].length > 0) ? <RegionRow key={region} region={region} items={groups[region].slice(0, 12)} /> : null
          ))}
        </>
      )}
      {selectedDestination && (
        <DestinationDetailModal
          dest={selectedDestination}
          onClose={() => setSelectedDestination(null)}
        />
      )}
    </div>
  );
}
