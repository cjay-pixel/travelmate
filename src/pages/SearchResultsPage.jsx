import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

function SearchResultsPage({ user, onNavigate, searchQuery }) {
  const [results, setResults] = useState([]);

  // Hardcoded destinations database (same as BudgetFriendlyPage)
  const allDestinations = [
    {
      id: 1,
      name: 'Boracay',
      location: 'Aklan',
      image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800',
      pricePerDay: 3500,
      description: 'Famous white sand beach paradise with crystal clear waters',
      tags: ['beach', 'island', 'adventure', 'nightlife', 'water sports']
    },
    {
      id: 2,
      name: 'Palawan',
      location: 'Puerto Princesa',
      image: 'https://images.unsplash.com/photo-1583414264145-a2b0c4f0d64c?w=800',
      pricePerDay: 4000,
      description: 'Stunning limestone cliffs and pristine lagoons',
      tags: ['beach', 'island', 'nature', 'adventure', 'diving']
    },
    {
      id: 3,
      name: 'Baguio',
      location: 'Benguet',
      image: 'https://images.unsplash.com/photo-1605722243979-fe0be8158232?w=800',
      pricePerDay: 2000,
      description: 'Cool mountain city with pine trees and strawberry farms',
      tags: ['mountains', 'culture', 'food', 'nature', 'family-friendly']
    },
    {
      id: 4,
      name: 'Siargao',
      location: 'Surigao del Norte',
      image: 'https://images.unsplash.com/photo-1565538420870-da08ff96a207?w=800',
      pricePerDay: 3000,
      description: 'Surfer\'s paradise with Cloud 9 and island hopping',
      tags: ['beach', 'island', 'adventure', 'surfing', 'nature']
    },
    {
      id: 5,
      name: 'Cebu',
      location: 'Cebu',
      image: 'https://images.unsplash.com/photo-1584646098378-0874589d76b1?w=800',
      pricePerDay: 2500,
      description: 'Historic city with beautiful beaches and diving spots',
      tags: ['beach', 'culture', 'food', 'history', 'diving']
    },
    {
      id: 6,
      name: 'Vigan',
      location: 'Ilocos Sur',
      image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800',
      pricePerDay: 1800,
      description: 'UNESCO World Heritage Spanish colonial town',
      tags: ['culture', 'history', 'food', 'architecture', 'family-friendly']
    },
    {
      id: 7,
      name: 'Batanes',
      location: 'Batanes',
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
      pricePerDay: 4500,
      description: 'Rolling hills and dramatic coastlines',
      tags: ['nature', 'mountains', 'culture', 'photography', 'adventure']
    },
    {
      id: 8,
      name: 'Bohol',
      location: 'Bohol',
      image: 'https://images.unsplash.com/photo-1551244072-5d12893278ab?w=800',
      pricePerDay: 2800,
      description: 'Chocolate Hills and adorable tarsiers',
      tags: ['nature', 'beach', 'island', 'family-friendly', 'wildlife']
    },
    {
      id: 9,
      name: 'Sagada',
      location: 'Mountain Province',
      image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800',
      pricePerDay: 1500,
      description: 'Mountain caves, hanging coffins, and sea of clouds',
      tags: ['mountains', 'nature', 'adventure', 'culture', 'hiking']
    },
    {
      id: 10,
      name: 'Coron',
      location: 'Palawan',
      image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800',
      pricePerDay: 3500,
      description: 'Turquoise lakes and world-class shipwreck diving',
      tags: ['island', 'beach', 'diving', 'adventure', 'nature']
    }
  ];

  useEffect(() => {
    if (searchQuery) {
      // Search in name, location, description, and tags
      const filtered = allDestinations.filter(dest => {
        const query = searchQuery.toLowerCase();
        return (
          dest.name.toLowerCase().includes(query) ||
          dest.location.toLowerCase().includes(query) ||
          dest.description.toLowerCase().includes(query) ||
          dest.tags.some(tag => tag.toLowerCase().includes(query))
        );
      });
      setResults(filtered);
    } else {
      setResults([]);
    }
  }, [searchQuery]);

  return (
    <div className="min-vh-100 d-flex flex-column">
      <Header user={user} onNavigate={onNavigate} />
      
      <div className="flex-grow-1 bg-light py-5">
        <div className="container">
          <div className="mb-4">
            <h2 className="fw-bold">
              {searchQuery ? `Search results for "${searchQuery}"` : 'Search Results'}
            </h2>
            <p className="text-muted">
              {results.length} {results.length === 1 ? 'destination' : 'destinations'} found
            </p>
          </div>

          {results.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-search fs-1 text-muted mb-3 d-block"></i>
              <h4 className="text-muted">
                {searchQuery ? 'No destinations found' : 'Enter a search query to see results'}
              </h4>
              <p className="text-muted">
                Try searching for beaches, mountains, or city names
              </p>
            </div>
          ) : (
            <div className="row g-4">
              {results.map(dest => (
                <div key={dest.id} className="col-12 col-md-6 col-lg-4">
                  <div className="card h-100 border-0 shadow-sm hover-shadow" style={{ transition: 'all 0.3s' }}>
                    <img 
                      src={dest.image} 
                      className="card-img-top" 
                      alt={dest.name}
                      style={{ height: '200px', objectFit: 'cover' }}
                    />
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <h5 className="card-title fw-bold mb-1">{dest.name}</h5>
                          <p className="text-muted small mb-2">
                            <i className="bi bi-geo-alt-fill me-1"></i>
                            {dest.location}
                          </p>
                        </div>
                      </div>
                      <p className="card-text text-muted small mb-3">
                        {dest.description}
                      </p>
                      <div className="mb-3">
                        {dest.tags.slice(0, 3).map((tag, index) => (
                          <span key={index} className="badge bg-light text-dark me-1 mb-1">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <span className="fw-bold fs-5">₱{dest.pricePerDay.toLocaleString()}</span>
                          <span className="text-muted small"> / day</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default SearchResultsPage;
