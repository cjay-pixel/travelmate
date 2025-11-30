import React from 'react';

function FeaturesSection({ onNavigate }) {
  const features = [
    {
      icon: '🗺️',
      title: 'Smart Recommendations',
      description: 'Get personalized travel suggestions based on your preferences',
      page: 'smart-recommendations'
    },
    {
      icon: '✈️',
      title: 'Easy Planning',
      description: 'Plan your entire trip with AI-powered itinerary generation',
      page: 'easy-planning'
    },
    {
      icon: '💰',
      title: 'Budget Friendly',
      description: 'Find the best deals and optimize your travel budget',
      page: 'budget-friendly'
    }
  ];

  return (
    <section className="py-5 bg-light">
      <div className="container py-5">
        <div className="row g-4">
          {features.map((feature, index) => (
            <div key={index} className="col-md-4">
              <div 
                className="card h-100 border-0 shadow-sm text-center p-4 hover-card"
                style={{ cursor: 'pointer' }}
                onClick={() => feature.page && onNavigate(feature.page)}
              >
                <div className="card-body">
                  <div className="mb-3" style={{ fontSize: '3rem' }}>{feature.icon}</div>
                  <h5 className="card-title fw-bold mb-3">{feature.title}</h5>
                  <p className="card-text text-muted">{feature.description}</p>
                  {feature.page && (
                    <button className="btn btn-primary mt-2">
                      Explore <i className="bi bi-arrow-right ms-2"></i>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default FeaturesSection;
