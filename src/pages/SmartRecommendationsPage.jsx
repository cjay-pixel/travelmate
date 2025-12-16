import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';

function SmartRecommendationsPage({ user, onNavigate }) {
  const [step, setStep] = useState('preferences'); // 'preferences' or 'results'
  const [selectedPreferences, setSelectedPreferences] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [preferenceOptions, setPreferenceOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState(null);

  // Load preferences and destinations from Firebase on mount
  useEffect(() => {
    loadPreferences();
    loadDestinations();
  }, []);

  const loadPreferences = async () => {
    try {
      const preferencesRef = collection(db, 'preferences');
      const snapshot = await getDocs(preferencesRef);
      
      const preferencesList = [];
      snapshot.forEach((doc) => {
        preferencesList.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // Sort by order or id
      preferencesList.sort((a, b) => (a.order || 0) - (b.order || 0));
      setPreferenceOptions(preferencesList);
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const loadDestinations = async () => {
    try {
      setLoading(true);
      const destinationsRef = collection(db, 'destinations');
      const snapshot = await getDocs(destinationsRef);
      
      const destinationsList = [];
      snapshot.forEach((doc) => {
        const data = doc.data() || {};

        // Normalize images similar to admin Destinations
        let images = [];
        if (Array.isArray(data.images) && data.images.length > 0) {
          images = data.images.slice();
        }

        const legacyFields = [
          'imageUrl', 'image', 'image1', 'image_1', 'image01', 'mainImage',
          'imageUrl2', 'image2', 'image_2', 'imageUrl3', 'image3', 'image_3',
          'photo1', 'photo2', 'photo3'
        ];

        for (const key of legacyFields) {
          const val = data[key];
          if (val && !images.includes(val)) images.push(val);
        }

        images = (images || []).filter(Boolean);

        destinationsList.push({
          id: doc.id,
          name: `${data.destinationName || ''}${data.cityName ? `, ${data.cityName}` : ''}`,
          images: images,
          image: images[0] || '',
          description: data.description,
          tags: data.category || [],
          rating: data.rating,
          budget: data.budget,
          cityName: data.cityName,
          regionName: data.regionName
          ,
          // contact fields (support multiple possible field names)
          phone: data.phone || data.contactPhone || '',
          contactPhone: data.contactPhone || data.phone || '',
          email: data.email || data.contactEmail || '',
          contactEmail: data.contactEmail || data.email || '',
          hostName: data.hostName || data.host || ''
        });
      });
      
      setDestinations(destinationsList);
    } catch (error) {
      console.error('Error loading destinations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAISuggestions = async (selectedCategories) => {
    try {
      setAiLoading(true);
      
      const prompt = `You are a Philippine travel expert. Based on these travel preferences: ${selectedCategories.join(', ')}, suggest 3 real Philippine destinations that match these categories.

Return ONLY a JSON array in this EXACT format (no markdown, no explanation):
[
  {
    "destinationName": "Exact place name",
    "cityName": "City",
    "regionName": "Province/Region",
    "description": "Brief 1-2 sentence description",
    "budget": "₱5,000 - ₱15,000",
    "rating": 4.5,
    "category": ["${selectedCategories[0]}", "${selectedCategories[1] || selectedCategories[0]}"],
    "imageUrl": "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600"
  }
]`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        }
      );

      const data = await response.json();
      
      if (data.error) {
        console.error('Gemini API Error:', data.error);
        return [];
      }

      if (!data.candidates || data.candidates.length === 0) {
        console.error('No candidates in response:', data);
        return [];
      }

      const aiText = data.candidates[0].content.parts[0].text;
      
      // Extract JSON from response (remove markdown if present)
      const cleanText = aiText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      const jsonMatch = cleanText.match(/\[[\s\S]*\]/);
      
      if (jsonMatch) {
        const suggestions = JSON.parse(jsonMatch[0]);
        
        // Save AI-generated destinations to Firebase
        for (const dest of suggestions) {
            try {
            await addDoc(collection(db, 'destinations'), {
              destinationName: dest.destinationName,
              cityName: dest.cityName,
              regionName: dest.regionName,
              description: dest.description,
              category: dest.category || selectedCategories,
              budget: dest.budget,
              rating: parseFloat(dest.rating),
              images: [dest.imageUrl || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600'],
              createdAt: serverTimestamp(),
              status: 'active',
              source: 'AI Generated'
            });
            
            console.log(`✅ AI added destination: ${dest.destinationName}`);
          } catch (error) {
            console.error('Error saving AI destination:', error);
          }
        }
        
        // Reload destinations to show the newly added ones
        await loadDestinations();
        
        return suggestions;
      }
      
      return [];
    } catch (error) {
      console.error('Error getting AI suggestions:', error);
      return [];
    } finally {
      setAiLoading(false);
    }
  };

  const togglePreference = (prefId) => {
    if (selectedPreferences.includes(prefId)) {
      setSelectedPreferences(selectedPreferences.filter(id => id !== prefId));
    } else {
      setSelectedPreferences([...selectedPreferences, prefId]);
    }
  };

  const handleGetRecommendations = async () => {
    setStep('results');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // AI disabled - destinations come from admin panel only
    // This keeps the app simple and reliable
  };

  const handleReset = () => {
    setSelectedPreferences([]);
    setStep('preferences');
  };

  const getFilteredRecommendations = () => {
    if (selectedPreferences.length === 0) return destinations;

    const selectedCategories = preferenceOptions
      .filter(pref => selectedPreferences.includes(pref.id))
      .map(pref => pref.title);

    return destinations
      .map(rec => {
        const matchCount = rec.tags.filter(tag => selectedCategories.includes(tag)).length;
        return { ...rec, matchScore: matchCount };
      })
      .filter(rec => rec.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore);
  };

  // Simple image carousel component (local to this page)
  function ImageCarousel({ images = [], height = '200px', fit = 'cover' }) {
    const [idx, setIdx] = useState(0);
    const len = images?.length || 0;
    if (len === 0) {
      return (
        <div className="card-img-top d-flex align-items-center justify-content-center" style={{ height, background: '#f0f0f0' }}>
          <img
            src={'https://via.placeholder.com/600x400?text=No+Image'}
            alt="No image"
            style={{ maxHeight: '100%', maxWidth: '100%', objectFit: fit }}
          />
        </div>
      );
    }

    return (
      <div className="position-relative d-flex align-items-center justify-content-center" style={{ height, background: fit === 'contain' ? '#000' : 'transparent' }}>
        <img
          src={images[idx]}
          className="card-img-top"
          alt={`Image ${idx + 1}`}
          style={{ height: '100%', width: '100%', objectFit: fit, transition: 'opacity .25s ease-in-out' }}
          onClick={(e) => e.stopPropagation()}
        />
        {len > 1 && (
          <>
            <button
              type="button"
              className="btn btn-sm btn-light"
              style={{ position: 'absolute', top: '50%', left: 8, transform: 'translateY(-50%)' }}
              onClick={(e) => { e.stopPropagation(); setIdx((idx - 1 + len) % len); }}
              aria-label="Previous image"
            >
              ‹
            </button>
            <button
              type="button"
              className="btn btn-sm btn-light"
              style={{ position: 'absolute', top: '50%', right: 8, transform: 'translateY(-50%)' }}
              onClick={(e) => { e.stopPropagation(); setIdx((idx + 1) % len); }}
              aria-label="Next image"
            >
              ›
            </button>
          </>
        )}
      </div>
    );
  }

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
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedDestination(destination)}
                    onKeyDown={(e) => { if (e.key === 'Enter') setSelectedDestination(destination); }}
                    className="card border-0 shadow-sm h-100"
                    style={{ cursor: 'pointer' }}
                  >
                    {destination.isAISuggestion && (
                      <div className="position-absolute top-0 end-0 m-2">
                        <span className="badge bg-info">
                          <i className="bi bi-stars me-1"></i>
                          AI Suggested
                        </span>
                      </div>
                    )}
                    <ImageCarousel images={destination.images} height={'200px'} />
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h5 className="card-title fw-bold mb-0">{destination.name}</h5>
                        <div className="text-warning">
                          <i className="bi bi-star-fill"></i> {destination.rating}
                        </div>
                      </div>
                      <p className="card-text text-muted small mb-3">{destination.description}</p>
                      <div className="d-flex flex-wrap gap-1 mb-3">
                        {destination.tags?.slice(0, 3).map((tag, idx) => (
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
                            {Math.round((destination.matchScore / Math.max(1, selectedPreferences.length)) * 100)}% Match
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Detail Modal / Drawer */}
            {selectedDestination && (
              <div
                className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                style={{ zIndex: 1050, background: 'rgba(0,0,0,0.6)' }}
                onClick={(e) => { if (e.target === e.currentTarget) setSelectedDestination(null); }}
                role="dialog"
                aria-modal="true"
              >
                <div className="bg-white shadow-lg rounded" style={{ width: '90%', maxWidth: '1000px', maxHeight: '90vh', display: 'flex', overflow: 'hidden' }}>
                          <div className="row g-0" style={{ flex: 1, minHeight: '60vh' }}>
                            <div className="col-md-7" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <ImageCarousel images={selectedDestination.images} height={'100%'} fit={'contain'} />
                            </div>
                            <div className="col-md-5 p-4 d-flex flex-column" style={{ maxHeight: '100%', overflowY: 'auto' }}>
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <h3 className="fw-bold mb-1">{selectedDestination.name}</h3>
                          <div className="text-muted small">
                            {selectedDestination.cityName}{selectedDestination.regionName ? `, ${selectedDestination.regionName}` : ''}
                          </div>
                        </div>
                        <div className="text-warning text-end">
                          <div><i className="bi bi-star-fill"></i> {selectedDestination.rating}</div>
                        </div>
                      </div>

                      <p className="text-muted small mb-3">{selectedDestination.description}</p>

                      <div className="mb-3">
                        {selectedDestination.tags?.map((tag, idx) => (
                          <span key={idx} className="badge bg-light text-dark border me-1">{tag}</span>
                        ))}
                      </div>

                      <div className="mt-auto">
                        <div className="mb-3">
                          <strong>Estimated Budget:</strong>
                          <div className="text-muted small">{selectedDestination.budget || 'Varies'}</div>
                        </div>

                        <div className="card p-3 border">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <div>
                              <div className="small text-muted">Contact</div>
                              <div className="fw-bold">{selectedDestination.hostName || selectedDestination.host || 'Local Host'}</div>
                            </div>
                            <div className="text-end small text-muted">Verified</div>
                          </div>

                          <div className="small mb-2">
                            Phone: {selectedDestination.phone || selectedDestination.contactPhone || 'Not provided'}
                          </div>
                          <div className="small mb-3">
                            Email: {selectedDestination.email || selectedDestination.contactEmail || 'Not provided'}
                          </div>

                          <div className="d-flex gap-2">
                            { (selectedDestination.phone || selectedDestination.contactPhone) ? (
                              <a className="btn btn-outline-primary btn-sm" href={`tel:${selectedDestination.phone || selectedDestination.contactPhone}`}>Call</a>
                            ) : (
                              <button className="btn btn-outline-secondary btn-sm" disabled>Call</button>
                            )}

                            { (selectedDestination.email || selectedDestination.contactEmail) ? (
                              <a className="btn btn-primary btn-sm" href={`mailto:${selectedDestination.email || selectedDestination.contactEmail}`}>Email</a>
                            ) : (
                              <button className="btn btn-secondary btn-sm" disabled>Email</button>
                            )}

                            <button className="btn btn-outline-dark btn-sm ms-auto" onClick={() => setSelectedDestination(null)}>Close</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {aiLoading && (
              <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading AI suggestions...</span>
                </div>
                <p className="text-muted mt-2">
                  <i className="bi bi-stars me-1"></i>
                  Getting AI-powered suggestions for you...
                </p>
              </div>
            )}

            {getFilteredRecommendations().length === 0 && !aiLoading && (
              <div className="text-center py-5">
                <i className="bi bi-search text-muted" style={{ fontSize: '3rem' }}></i>
                <p className="text-muted mt-3">No destinations match your preferences yet.</p>
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}

export default SmartRecommendationsPage;
