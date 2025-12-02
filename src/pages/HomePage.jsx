import React from 'react';
import Header from '../components/Header';
import HeroSection from '../components/HeroSection';
import FeaturesSection from '../components/FeaturesSection';
import Footer from '../components/Footer';

function HomePage({ user, onNavigate }) {
  return (
    <div className="homepage">
      <Header user={user} onNavigate={onNavigate} />
      
      <main>
        <HeroSection />
        <FeaturesSection onNavigate={onNavigate} />
      </main>

      <Footer />
    </div>
  );
}

export default HomePage;
