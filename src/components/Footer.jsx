import React from 'react';

function Footer() {
  return (
    <footer className="bg-white border-top">
      <div className="container py-4">
        <div className="row align-items-center g-3">
          {/* Left Section - Copyright & Links */}
          <div className="col-12 col-lg-6">
            <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center gap-2 gap-sm-3 small">
              <span className="text-muted">© 2025 TravelMate AI, Inc.</span>
              <div className="d-flex flex-wrap gap-2 gap-sm-3">
                <a href="#" className="text-decoration-none text-dark">Privacy</a>
                <span className="text-muted d-none d-sm-inline">·</span>
                <a href="#" className="text-decoration-none text-dark">Terms</a>
                <span className="text-muted d-none d-sm-inline">·</span>
                <a href="#" className="text-decoration-none text-dark">Sitemap</a>
              </div>
            </div>
          </div>

          {/* Right Section - Language, Currency & Social */}
          <div className="col-12 col-lg-6">
            <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-lg-end gap-3">
              {/* Language */}
              <div className="d-flex gap-3 small">
                <a href="#" className="text-decoration-none text-dark d-flex align-items-center">
                  <i className="bi bi-globe me-1"></i>
                  <span className="fw-semibold">English (PH)</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
