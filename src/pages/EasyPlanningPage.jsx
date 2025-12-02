import React from 'react';
import Header from '../components/Header';
import Destinations from '../components/Destinations';
import Footer from '../components/Footer';

function EasyPlanningPage({ user, onNavigate }) {
  return (
    <div>
      <Header user={user} onNavigate={onNavigate} />
      
      <div className="container py-5">
        <div className="text-center mb-5">
          <h1 className="fw-bold mb-3">
            <i className="bi bi-calendar-check text-primary me-2"></i>
            Easy Planning
          </h1>
          <p className="text-muted">Plan your entire trip with our comprehensive trip planner</p>
        </div>

        {user ? (
          <Destinations user={user} />
        ) : (
          <div className="text-center py-5">
            <i className="bi bi-lock text-muted" style={{ fontSize: '3rem' }}></i>
            <h4 className="mt-3 text-muted">Please log in to use the trip planner</h4>
            <p className="text-muted">Sign in to save and manage your trip plans</p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

export default EasyPlanningPage;
