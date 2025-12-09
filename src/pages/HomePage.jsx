import React, { useState } from 'react';
import Header from '../components/Header';
import HeroSection from '../components/HeroSection';
import FeaturesSection from '../components/FeaturesSection';
import Footer from '../components/Footer';
import Auth from '../components/Auth';

function HomePage({ user, onNavigate }) {
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleShowAuth = () => {
    setShowAuthModal(true);
  };

  const closeAuthModal = () => {
    setShowAuthModal(false);
  };

  return (
    <div className="homepage">
      <Header user={user} onNavigate={onNavigate} />
      
      <main>
        <HeroSection />
        <FeaturesSection onNavigate={onNavigate} user={user} onShowAuth={handleShowAuth} />
      </main>

      <Footer />

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }} onClick={closeAuthModal}>
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content border-0 rounded-4">
              <button 
                type="button" 
                className="btn-close position-absolute top-0 end-0 m-3" 
                onClick={closeAuthModal}
                style={{ zIndex: 10 }}
              ></button>
              <Auth onClose={closeAuthModal} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HomePage;
