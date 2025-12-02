import React, { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

function BudgetFriendlyPage({ user, onNavigate }) {
  const [filters, setFilters] = useState({
    budget: 15000,
    startDate: '',
    endDate: ''
  });
  const [showResults, setShowResults] = useState(false);

  const destinations = [
    {
      id: 1,
      name: 'Baguio City',
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600',
      description: 'Cool mountain climate with gardens, parks, and local markets',
      estimatedCost: 8000,
      duration: '3-4 days',
      highlights: ['Burnham Park', 'Mines View Park', 'Strawberry Farm', 'Session Road'],
      budgetBreakdown: {
        accommodation: 3000,
        food: 2000,
        activities: 2000,
        transport: 1000
      }
    },
    {
      id: 2,
      name: 'Vigan, Ilocos Sur',
      image: 'https://images.unsplash.com/photo-1555993539-1732b0258235?w=600',
      description: 'Historic Spanish colonial town with preserved architecture',
      estimatedCost: 10000,
      duration: '2-3 days',
      highlights: ['Calle Crisologo', 'Bantay Bell Tower', 'Crisologo Museum', 'Vigan Cathedral'],
      budgetBreakdown: {
        accommodation: 3500,
        food: 2500,
        activities: 2000,
        transport: 2000
      }
    },
    {
      id: 3,
      name: 'Puerto Galera',
      image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=600',
      description: 'Beach paradise with diving spots and water activities',
      estimatedCost: 12000,
      duration: '3-4 days',
      highlights: ['White Beach', 'Tamaraw Falls', 'Snorkeling', 'Island Hopping'],
      budgetBreakdown: {
        accommodation: 4000,
        food: 3000,
        activities: 3000,
        transport: 2000
      }
    },
    {
      id: 4,
      name: 'Sagada',
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600',
      description: 'Mountain town famous for hanging coffins and caves',
      estimatedCost: 9000,
      duration: '3-4 days',
      highlights: ['Hanging Coffins', 'Sumaguing Cave', 'Kiltepan Peak', 'Echo Valley'],
      budgetBreakdown: {
        accommodation: 2500,
        food: 2000,
        activities: 2500,
        transport: 2000
      }
    },
    {
      id: 5,
      name: 'Batanes',
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600',
      description: 'Northernmost province with rolling hills and stone houses',
      estimatedCost: 25000,
      duration: '4-5 days',
      highlights: ['Basco Lighthouse', 'Marlboro Hills', 'Sabtang Island', 'Stone Houses'],
      budgetBreakdown: {
        accommodation: 8000,
        food: 5000,
        activities: 5000,
        transport: 7000
      }
    },
    {
      id: 6,
      name: 'Camiguin',
      image: 'https://images.unsplash.com/photo-1544551763046-e078b8c5f0ac?w=600',
      description: 'Island born of fire with volcanoes and hot springs',
      estimatedCost: 15000,
      duration: '3-4 days',
      highlights: ['White Island', 'Sunken Cemetery', 'Katibawasan Falls', 'Hot Springs'],
      budgetBreakdown: {
        accommodation: 5000,
        food: 3500,
        activities: 4000,
        transport: 2500
      }
    },
    {
      id: 7,
      name: 'Siargao',
      image: 'https://images.unsplash.com/photo-1544551763046-e078b8c5f0ac?w=600',
      description: 'Surfing capital with pristine beaches and laid-back vibes',
      estimatedCost: 18000,
      duration: '4-5 days',
      highlights: ['Cloud 9', 'Sugba Lagoon', 'Magpupungko Pools', 'Island Hopping'],
      budgetBreakdown: {
        accommodation: 6000,
        food: 4000,
        activities: 5000,
        transport: 3000
      }
    },
    {
      id: 8,
      name: 'El Nido, Palawan',
      image: 'https://images.unsplash.com/photo-1583037189850-1921ae7c6c22?w=600',
      description: 'Paradise with limestone cliffs and crystal clear waters',
      estimatedCost: 20000,
      duration: '4-5 days',
      highlights: ['Island Hopping', 'Big Lagoon', 'Small Lagoon', 'Secret Beach'],
      budgetBreakdown: {
        accommodation: 7000,
        food: 5000,
        activities: 5000,
        transport: 3000
      }
    },
    {
      id: 9,
      name: 'Bohol',
      image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=600',
      description: 'Home of Chocolate Hills and adorable tarsiers',
      estimatedCost: 14000,
      duration: '3-4 days',
      highlights: ['Chocolate Hills', 'Tarsier Sanctuary', 'Loboc River', 'Panglao Beach'],
      budgetBreakdown: {
        accommodation: 5000,
        food: 3000,
        activities: 4000,
        transport: 2000
      }
    },
    {
      id: 10,
      name: 'Hundred Islands',
      image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=600',
      description: 'National park with 124 islands and diverse marine life',
      estimatedCost: 7000,
      duration: '2-3 days',
      highlights: ['Island Hopping', 'Snorkeling', 'Kayaking', 'Quezon Island'],
      budgetBreakdown: {
        accommodation: 2500,
        food: 1500,
        activities: 2000,
        transport: 1000
      }
    }
  ];

  const calculateDays = () => {
    if (filters.startDate && filters.endDate) {
      const start = new Date(filters.startDate);
      const end = new Date(filters.endDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays;
    }
    return 0;
  };

  const handleSearch = () => {
    setShowResults(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReset = () => {
    setFilters({
      budget: 15000,
      startDate: '',
      endDate: ''
    });
    setShowResults(false);
  };

  const getFilteredDestinations = () => {
    return destinations
      .filter(dest => dest.estimatedCost <= filters.budget)
      .sort((a, b) => a.estimatedCost - b.estimatedCost);
  };

  const tripDays = calculateDays();

  return (
    <div>
      <Header user={user} onNavigate={onNavigate} />
      
      <div className="container py-5">
        <div className="text-center mb-5">
          <h1 className="fw-bold mb-3">
            <i className="bi bi-piggy-bank text-success me-2"></i>
            Budget Friendly Destinations
          </h1>
          <p className="text-muted">Find the perfect destination that fits your budget and schedule</p>
        </div>

        {/* Filter Section */}
        <div className="card shadow-sm border-0 mb-5">
          <div className="card-body p-4">
            <h5 className="fw-bold mb-4">Set Your Budget & Dates</h5>
            
            <div className="row g-4">
              {/* Budget Slider */}
              <div className="col-md-12">
                <label className="form-label fw-bold">
                  <i className="bi bi-wallet2 text-success me-2"></i>
                  Total Budget: ₱{filters.budget.toLocaleString()}
                </label>
                <input 
                  type="range"
                  className="form-range"
                  min="5000"
                  max="50000"
                  step="1000"
                  value={filters.budget}
                  onChange={(e) => setFilters({...filters, budget: parseInt(e.target.value)})}
                />
                <div className="d-flex justify-content-between small text-muted">
                  <span>₱5,000</span>
                  <span>₱50,000</span>
                </div>
              </div>

              {/* Date Range */}
              <div className="col-md-6">
                <label className="form-label fw-bold">
                  <i className="bi bi-calendar-check text-primary me-2"></i>
                  Start Date
                </label>
                <input 
                  type="date"
                  className="form-control form-control-lg"
                  value={filters.startDate}
                  onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-bold">
                  <i className="bi bi-calendar-check text-primary me-2"></i>
                  End Date
                </label>
                <input 
                  type="date"
                  className="form-control form-control-lg"
                  value={filters.endDate}
                  onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                  min={filters.startDate || new Date().toISOString().split('T')[0]}
                />
              </div>

              {tripDays > 0 && (
                <div className="col-12">
                  <div className="alert alert-info mb-0">
                    <i className="bi bi-info-circle me-2"></i>
                    Trip Duration: <strong>{tripDays} days</strong>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 d-flex gap-2">
              <button 
                className="btn btn-success btn-lg flex-grow-1"
                onClick={handleSearch}
              >
                <i className="bi bi-search me-2"></i>
                Find Destinations
              </button>
              {showResults && (
                <button 
                  className="btn btn-outline-secondary btn-lg"
                  onClick={handleReset}
                >
                  <i className="bi bi-arrow-clockwise me-2"></i>
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Results Section */}
        {showResults && (
          <div>
            <h4 className="fw-bold mb-4">
              {getFilteredDestinations().length} Destinations Found Within Your Budget
            </h4>

            <div className="row g-4">
              {getFilteredDestinations().map((destination) => (
                <div key={destination.id} className="col-md-6 col-lg-4">
                  <div className="card border-0 shadow-sm h-100">
                    <img 
                      src={destination.image} 
                      className="card-img-top" 
                      alt={destination.name}
                      style={{ height: '200px', objectFit: 'cover' }}
                    />
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h5 className="card-title fw-bold mb-0">{destination.name}</h5>
                        <span className="badge bg-success">₱{destination.estimatedCost.toLocaleString()}</span>
                      </div>
                      <p className="card-text text-muted small mb-3">{destination.description}</p>
                      
                      <div className="mb-3">
                        <small className="text-muted d-block mb-2">
                          <i className="bi bi-clock me-1"></i>
                          {destination.duration}
                        </small>
                      </div>

                      {/* Budget Breakdown */}
                      <div className="mb-3">
                        <h6 className="small fw-bold mb-2">Budget Breakdown:</h6>
                        <div className="small">
                          <div className="d-flex justify-content-between mb-1">
                            <span><i className="bi bi-house me-1"></i> Accommodation</span>
                            <span>₱{destination.budgetBreakdown.accommodation.toLocaleString()}</span>
                          </div>
                          <div className="d-flex justify-content-between mb-1">
                            <span><i className="bi bi-cup-hot me-1"></i> Food</span>
                            <span>₱{destination.budgetBreakdown.food.toLocaleString()}</span>
                          </div>
                          <div className="d-flex justify-content-between mb-1">
                            <span><i className="bi bi-star me-1"></i> Activities</span>
                            <span>₱{destination.budgetBreakdown.activities.toLocaleString()}</span>
                          </div>
                          <div className="d-flex justify-content-between">
                            <span><i className="bi bi-bus-front me-1"></i> Transport</span>
                            <span>₱{destination.budgetBreakdown.transport.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Highlights */}
                      <div>
                        <h6 className="small fw-bold mb-2">Highlights:</h6>
                        <div className="d-flex flex-wrap gap-1">
                          {destination.highlights.map((highlight, idx) => (
                            <span key={idx} className="badge bg-light text-dark border small">
                              {highlight}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {getFilteredDestinations().length === 0 && (
              <div className="text-center py-5">
                <i className="bi bi-emoji-frown text-muted" style={{ fontSize: '3rem' }}></i>
                <p className="text-muted mt-3">No destinations found within your budget. Try increasing your budget.</p>
              </div>
            )}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

export default BudgetFriendlyPage;
