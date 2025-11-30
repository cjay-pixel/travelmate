import React from 'react';

function CTASection() {
  return (
    <section className="py-5 bg-white">
      <div className="container py-5">
        <div className="row justify-content-center text-center">
          <div className="col-lg-6">
            <h2 className="display-5 fw-bold mb-3">Ready to explore?</h2>
            <p className="lead text-muted mb-4">
              Start planning your dream vacation today
            </p>
            <button 
              className="btn btn-danger btn-lg px-5 py-3 fw-bold" 
              style={{ background: 'linear-gradient(to right, #FF385C, #E31C5F)', border: 'none' }}
            >
              Get Started
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CTASection;
