import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import DestinationDetailModal from '../components/DestinationDetailModal';
import { getPrimaryImage } from '../utils/imageHelpers';
import { collection, query, where, getDocs, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';

function WishlistPage({ user, onNavigate }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setItems([]); setLoading(false); return; }
    setLoading(true);
    const q = query(collection(db, 'wishlists'), where('userId', '==', user.uid));
    const unsub = onSnapshot(q, (snap) => {
      const list = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setItems(list);
      setLoading(false);
    }, (err) => { console.error('Wishlist snapshot error', err); setLoading(false); });

    return () => unsub();
  }, [user]);

  const handleRemove = async (docId) => {
    if (!window.confirm('Remove this item from your wishlist?')) return;
    try {
      await deleteDoc(doc(db, 'wishlists', docId));
      // onSnapshot will update list
    } catch (err) {
      console.error('Failed to remove wishlist item', err);
      alert('Failed to remove item.');
    }
  };

  const [selectedPlace, setSelectedPlace] = useState(null);
  const handleOpen = (place) => setSelectedPlace(place);
  const handleClose = () => setSelectedPlace(null);

  // import shared modal dynamically to keep bundle small (but static import is fine)
  // We'll render the shared DestinationDetailModal below.

  return (
    <div>
      <Header user={user} onNavigate={onNavigate} />
      <div className="container py-5">
        <div className="text-center mb-4">
          <h2 className="fw-bold">Your Wishlist</h2>
          <p className="text-muted">Items you hearted will appear here for quick access.</p>
        </div>

        {loading ? (
          <div className="text-center py-4">
            <div className="spinner-border text-primary" role="status" />
          </div>
        ) : (
          <>
            {items.length === 0 ? (
              <div className="text-center py-5 text-muted">Your wishlist is empty. Heart destinations to add them here.</div>
            ) : (
              <div className="row g-4">
                {items.map(item => {
                  const place = item.placeData || {};
                  return (
                    <div key={item.id} className="col-md-6 col-lg-4">
                      <div
                        className="card h-100 border-0 shadow-sm"
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleOpen(place)}
                      >
                        <img src={getPrimaryImage(place)} alt={place.name || place.destinationName || ''} className="card-img-top" style={{ height: 180, objectFit: 'cover' }} />
                        <div className="card-body">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <h6 className="card-title fw-bold mb-0 small">{place.name || place.destinationName || 'Untitled'}</h6>
                            <div className="text-warning small"><i className="bi bi-star-fill"></i> {place.rating || '—'}</div>
                          </div>
                          <p className="text-muted small mb-3">{place.description || place.cityName || ''}</p>
                          <div className="d-flex gap-2">
                            <button
                              className="btn btn-outline-primary btn-sm"
                              onClick={(e) => { e.stopPropagation(); handleOpen(place); }}
                            >View</button>
                            <button
                              className="btn btn-outline-danger btn-sm"
                              onClick={(e) => { e.stopPropagation(); handleRemove(item.id); }}
                            >Remove</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
      {selectedPlace && (
        <DestinationDetailModal
          dest={selectedPlace}
          onClose={handleClose}
        />
      )}
      <Footer />
    </div>
  );
}

export default WishlistPage;
