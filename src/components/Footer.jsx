import React from 'react';

function Footer() {
  return (
    <footer className="bg-white border-top">
      <div className="container py-4">
        <div className="row align-items-center g-3">
          {/* Left Section - Copyright & Links */}
          <div className="col-12 col-lg-6">
            <div className="d-flex align-items-center small">
              <span className="text-muted">© 2025 TravelMate AI, Inc.</span>
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
