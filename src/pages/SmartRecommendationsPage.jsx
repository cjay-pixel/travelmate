import React, { useState } from 'react';
import Header from '../components/Header';

function SmartRecommendationsPage({ user, onNavigate }) {
  const [step, setStep] = useState('preferences'); // 'preferences' or 'results'
  const [selectedPreferences, setSelectedPreferences] = useState([]);

  const preferenceOptions = [
    { id: 1, title: 'Beach Paradise', image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400', tags: ['beach', 'relaxation', 'water'] },
    { id: 2, title: 'Mountain Adventures', image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400', tags: ['mountain', 'hiking', 'nature'] },
    { id: 3, title: 'City Exploration', image: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400', tags: ['city', 'culture', 'urban'] },
    { id: 4, title: 'Historical Sites', image: 'https://images.unsplash.com/photo-1533929736458-ca588d08c8be?w=400', tags: ['history', 'culture', 'heritage'] },
    { id: 5, title: 'Island Hopping', image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400', tags: ['island', 'beach', 'adventure'] },
    { id: 6, title: 'Food & Cuisine', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400', tags: ['food', 'culture', 'local'] },
    { id: 7, title: 'Nature & Wildlife', image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400', tags: ['nature', 'wildlife', 'eco'] },
    { id: 8, title: 'Water Activities', image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400', tags: ['water', 'sports', 'diving'] },
    { id: 9, title: 'Rice Terraces', image: 'https://images.unsplash.com/photo-1536431311719-398b6704d4cc?w=400', tags: ['nature', 'culture', 'scenic'] },
    { id: 10, title: 'Night Life', image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400', tags: ['nightlife', 'city', 'entertainment'] },
    { id: 11, title: 'Waterfalls', image: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=400', tags: ['waterfall', 'nature', 'adventure'] },
    { id: 12, title: 'Temples & Churches', image: 'https://images.unsplash.com/photo-1548013146-72479768bada?w=400', tags: ['spiritual', 'architecture', 'culture'] },
    { id: 13, title: 'Shopping Districts', image: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=400', tags: ['shopping', 'city', 'urban'] },
    { id: 14, title: 'Festivals & Events', image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400', tags: ['festival', 'culture', 'celebration'] },
    { id: 15, title: 'Sunset Views', image: 'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=400', tags: ['scenic', 'relaxation', 'photography'] },
  ];

  const recommendations = [
    {
      id: 1,
      name: 'El Nido, Palawan',
      image: 'https://images.unsplash.com/photo-1583037189850-1921ae7c6c22?w=600',
      description: 'Crystal clear waters, stunning limestone cliffs, and pristine beaches',
      tags: ['beach', 'island', 'water', 'nature'],
      rating: 4.9,
      budget: '₱15,000 - ₱25,000'
    },
    {
      id: 2,
      name: 'Banaue Rice Terraces',
      image: 'https://images.unsplash.com/photo-1536431311719-398b6704d4cc?w=600',
      description: '2000-year-old terraces carved into the mountains',
      tags: ['nature', 'culture', 'scenic', 'mountain'],
      rating: 4.8,
      budget: '₱8,000 - ₱15,000'
    },
    {
      id: 3,
      name: 'Boracay Island',
      image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=600',
      description: 'World-famous white sand beaches and vibrant nightlife',
      tags: ['beach', 'island', 'nightlife', 'water'],
      rating: 4.7,
      budget: '₱20,000 - ₱35,000'
    },
    {
      id: 4,
      name: 'Vigan, Ilocos Sur',
      image: 'https://images.unsplash.com/photo-1555993539-1732b0258235?w=600',
      description: 'UNESCO World Heritage Spanish colonial town',
      tags: ['history', 'culture', 'heritage', 'city'],
      rating: 4.6,
      budget: '₱6,000 - ₱12,000'
    },
    {
      id: 5,
      name: 'Siargao Island',
      image: 'https://images.unsplash.com/photo-1544551763046-e078b8c5f0ac?w=600',
      description: 'Surfing capital of the Philippines with laid-back island vibes',
      tags: ['beach', 'island', 'water', 'sports', 'adventure'],
      rating: 4.8,
      budget: '₱12,000 - ₱20,000'
    },
    {
      id: 6,
      name: 'Intramuros, Manila',
      image: 'https://images.unsplash.com/photo-1548013146-72479768bada?w=600',
      description: 'Historic walled city with Spanish colonial architecture',
      tags: ['history', 'culture', 'city', 'heritage'],
      rating: 4.5,
      budget: '₱5,000 - ₱10,000'
    },
  ];

  const togglePreference = (prefId) => {
    if (selectedPreferences.includes(prefId)) {
      setSelectedPreferences(selectedPreferences.filter(id => id !== prefId));
    } else {
      setSelectedPreferences([...selectedPreferences, prefId]);
    }
  };

  const handleGetRecommendations = () => {
    setStep('results');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReset = () => {
    setSelectedPreferences([]);
    setStep('preferences');
  };

  const getFilteredRecommendations = () => {
    if (selectedPreferences.length === 0) return recommendations;

    const selectedTags = preferenceOptions
      .filter(pref => selectedPreferences.includes(pref.id))
      .flatMap(pref => pref.tags);

    return recommendations
      .map(rec => {
        const matchCount = rec.tags.filter(tag => selectedTags.includes(tag)).length;
        return { ...rec, matchScore: matchCount };
      })
      .filter(rec => rec.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore);
  };

  return (
    <div>
      <Header user={user} onNavigate={onNavigate} />
      
      <div className="container py-5">
        <div className="text-center mb-5">
          <h1 className="fw-bold mb-3">
            <i className="bi bi-stars text-warning me-2"></i>
            Smart Recommendations
          </h1>
          <p className="text-muted">
            {step === 'preferences' 
              ? 'Select your travel preferences to get personalized destination recommendations'
              : 'Here are the best destinations based on your preferences'}
          </p>
        </div>

        {step === 'preferences' ? (
          <>
            {/* Pinterest-style Preference Grid */}
            <div className="row g-3 mb-4">
              {preferenceOptions.map((option) => (
                <div key={option.id} className="col-6 col-md-4 col-lg-3">
                  <div 
                    className={`card border-0 shadow-sm position-relative ${selectedPreferences.includes(option.id) ? 'border-primary' : ''}`}
                    style={{ 
                      cursor: 'pointer',
                      transition: 'transform 0.2s',
                      border: selectedPreferences.includes(option.id) ? '3px solid #0d6efd' : 'none'
                    }}
                    onClick={() => togglePreference(option.id)}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <img 
                      src={option.image} 
                      className="card-img-top" 
                      alt={option.title}
                      style={{ height: '150px', objectFit: 'cover' }}
                    />
                    <div className="card-body p-2">
                      <h6 className="card-title mb-0 text-center small fw-bold">{option.title}</h6>
                    </div>
                    {selectedPreferences.includes(option.id) && (
                      <div 
                        className="position-absolute top-0 end-0 m-2 bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
                        style={{ width: '30px', height: '30px' }}
                      >
                        <i className="bi bi-check-lg"></i>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="text-center">
              <button 
                className="btn btn-primary btn-lg px-5"
                onClick={handleGetRecommendations}
                disabled={selectedPreferences.length === 0}
              >
                <i className="bi bi-search me-2"></i>
                Get Recommendations ({selectedPreferences.length} selected)
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Results Section */}
            <div className="mb-4">
              <button 
                className="btn btn-outline-primary"
                onClick={handleReset}
              >
                <i className="bi bi-arrow-left me-2"></i>
                Change Preferences
              </button>
            </div>

            <div className="row g-4">
              {getFilteredRecommendations().map((destination) => (
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
                        <div className="text-warning">
                          <i className="bi bi-star-fill"></i> {destination.rating}
                        </div>
                      </div>
                      <p className="card-text text-muted small mb-3">{destination.description}</p>
                      <div className="d-flex flex-wrap gap-1 mb-3">
                        {destination.tags.map((tag, idx) => (
                          <span key={idx} className="badge bg-light text-dark border">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="d-flex justify-content-between align-items-center">
                        <small className="text-muted">
                          <i className="bi bi-wallet2 me-1"></i>
                          {destination.budget}
                        </small>
                        {destination.matchScore && (
                          <span className="badge bg-success">
                            {Math.round((destination.matchScore / selectedPreferences.length) * 100)}% Match
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {getFilteredRecommendations().length === 0 && (
              <div className="text-center py-5">
                <i className="bi bi-search text-muted" style={{ fontSize: '3rem' }}></i>
                <p className="text-muted mt-3">No destinations match your preferences. Try selecting different options.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default SmartRecommendationsPage;
