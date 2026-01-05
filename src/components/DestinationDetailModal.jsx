import React, { useState } from 'react';
import { getImageList } from '../utils/imageHelpers';

// Small ImageCarousel used inside the modal
function ImageCarousel({ images = [], height = '100%', fit = 'contain' }) {
  const [idx, setIdx] = useState(0);
  const len = images?.length || 0;
  if (len === 0) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ height, background: '#f0f0f0' }}>
        <img src={'https://via.placeholder.com/600x400?text=No+Image'} alt="No image" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: fit }} />
      </div>
    );
  }

  return (
    <div className="position-relative d-flex align-items-center justify-content-center" style={{ height, background: 'transparent' }}>
      <img src={images[idx]} alt={`Image ${idx + 1}`} style={{ height: '100%', width: '100%', objectFit: fit }} />
      {len > 1 && (
        <>
          <button type="button" className="btn btn-sm btn-light" style={{ position: 'absolute', top: '50%', left: 8, transform: 'translateY(-50%)' }} onClick={(e) => { e.stopPropagation(); setIdx((idx - 1 + len) % len); }} aria-label="Previous image">‹</button>
          <button type="button" className="btn btn-sm btn-light" style={{ position: 'absolute', top: '50%', right: 8, transform: 'translateY(-50%)' }} onClick={(e) => { e.stopPropagation(); setIdx((idx + 1) % len); }} aria-label="Next image">›</button>
        </>
      )}
    </div>
  );
}

export default function DestinationDetailModal({ dest, onClose, onOpenInPlanner }) {
  if (!dest) return null;

  // helper to read common fields from wrappers (dest, dest.raw, dest.placeData)
  const get = (key) => {
    if (!dest) return undefined;
    if (dest[key] !== undefined && dest[key] !== null) return dest[key];
    if (dest.raw && dest.raw[key] !== undefined && dest.raw[key] !== null) return dest.raw[key];
    if (dest.placeData && dest.placeData[key] !== undefined && dest.placeData[key] !== null) return dest.placeData[key];
    return undefined;
  };

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{ zIndex: 1050, background: 'rgba(0,0,0,0.6)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white shadow-lg rounded position-relative" style={{ width: '90%', maxWidth: '1000px', maxHeight: '90vh', display: 'flex', overflow: 'hidden' }}>
        <div className="row g-0" style={{ flex: 1, minHeight: '60vh' }}>
            <div className="col-md-7" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ImageCarousel images={getImageList(dest)} height={'100%'} fit={'contain'} />
          </div>
          <div className="col-md-5 p-4 d-flex flex-column" style={{ maxHeight: '100%', overflowY: 'auto' }}>
            <div className="d-flex justify-content-between align-items-start mb-2">
              <div>
                <h3 className="fw-bold mb-1">{get('name') || get('destinationName') || 'Unknown'}</h3>
                <div className="text-muted small">{get('cityName') || get('city')}{(get('regionName') || get('region')) ? `, ${get('regionName') || get('region')}` : ''}</div>
              </div>
              <div className="text-warning text-end">
                <div><i className="bi bi-star-fill"></i> {get('rating') || '—'}</div>
              </div>
            </div>

            <p className="text-muted small mb-3">{get('description') || get('summary') || ''}</p>

            <div className="mb-3">
              {((get('tags') || get('category') || [])).map((tag, idx) => (
                <span key={idx} className="badge bg-light text-dark border me-1">{tag}</span>
              ))}
            </div>

            <div className="mt-auto">
              <div className="mb-3">
                <strong>Estimated Budget:</strong>
                <div className="text-muted small">{(get('estimatedCost') && typeof get('estimatedCost') === 'number') ? `₱${get('estimatedCost').toLocaleString()}` : (get('budgetBreakdown') ? 'See breakdown' : 'Varies')}</div>
              </div>

              <div className="card p-3 border">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <div>
                    <div className="small text-muted">Contact</div>
                    <div className="fw-bold">{get('hostName') || get('host') || 'Local Host'}</div>
                  </div>
                  <div className="text-end small text-muted">Verified</div>
                </div>

                <div className="small mb-2">Phone: {get('phone') || get('contactPhone') || 'Not provided'}</div>
                <div className="small mb-3">Email: {get('email') || get('contactEmail') || 'Not provided'}</div>

                <div className="d-flex gap-2">
                  { (get('phone') || get('contactPhone')) ? (
                    <a className="btn btn-outline-primary btn-sm" href={`tel:${get('phone') || get('contactPhone')}`}>Call</a>
                  ) : (
                    <button className="btn btn-outline-secondary btn-sm" disabled>Call</button>
                  )}

                  { (get('email') || get('contactEmail')) ? (
                    <a className="btn btn-primary btn-sm" href={`mailto:${get('email') || get('contactEmail')}`}>Email</a>
                  ) : (
                    <button className="btn btn-secondary btn-sm" disabled>Email</button>
                  )}

                  <button className="btn btn-outline-dark btn-sm ms-auto" onClick={onClose}>Close</button>
                </div>

                {/* 'Open in Planner' button removed by request */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
