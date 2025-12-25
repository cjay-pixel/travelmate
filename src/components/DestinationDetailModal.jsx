import React, { useState } from 'react';

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
            <ImageCarousel images={dest.images || (dest.image ? [dest.image] : [])} height={'100%'} fit={'contain'} />
          </div>
          <div className="col-md-5 p-4 d-flex flex-column" style={{ maxHeight: '100%', overflowY: 'auto' }}>
            <div className="d-flex justify-content-between align-items-start mb-2">
              <div>
                <h3 className="fw-bold mb-1">{dest.name}</h3>
                <div className="text-muted small">{dest.cityName}{dest.regionName ? `, ${dest.regionName}` : ''}</div>
              </div>
              <div className="text-warning text-end">
                <div><i className="bi bi-star-fill"></i> {dest.rating}</div>
              </div>
            </div>

            <p className="text-muted small mb-3">{dest.description}</p>

            <div className="mb-3">
              {(dest.tags || []).map((tag, idx) => (
                <span key={idx} className="badge bg-light text-dark border me-1">{tag}</span>
              ))}
            </div>

            <div className="mt-auto">
              <div className="mb-3">
                <strong>Estimated Budget:</strong>
                <div className="text-muted small">{(dest.estimatedCost && typeof dest.estimatedCost === 'number') ? `₱${dest.estimatedCost.toLocaleString()}` : (dest.budgetBreakdown ? 'See breakdown' : 'Varies')}</div>
              </div>

              <div className="card p-3 border">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <div>
                    <div className="small text-muted">Contact</div>
                    <div className="fw-bold">{dest.hostName || 'Local Host'}</div>
                  </div>
                  <div className="text-end small text-muted">Verified</div>
                </div>

                <div className="small mb-2">Phone: {dest.phone || 'Not provided'}</div>
                <div className="small mb-3">Email: {dest.email || 'Not provided'}</div>

                <div className="d-flex gap-2">
                  { (dest.phone) ? (
                    <a className="btn btn-outline-primary btn-sm" href={`tel:${dest.phone}`}>Call</a>
                  ) : (
                    <button className="btn btn-outline-secondary btn-sm" disabled>Call</button>
                  )}

                  { (dest.email) ? (
                    <a className="btn btn-primary btn-sm" href={`mailto:${dest.email}`}>Email</a>
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
