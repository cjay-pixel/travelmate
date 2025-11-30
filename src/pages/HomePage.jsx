import React from 'react';
import Header from '../components/Header';
import HeroSection from '../components/HeroSection';
import FeaturesSection from '../components/FeaturesSection';
import CTASection from '../components/CTASection';
import Destinations from '../components/Destinations';

function HomePage({ user, onNavigate }) {
  return (
    <div className="homepage">
      <Header user={user} onNavigate={onNavigate} />
      
      <main>
        <HeroSection />
        {user && <Destinations user={user} />}
        <FeaturesSection onNavigate={onNavigate} />
        <CTASection />
      </main>
    </div>
  );
}

export default HomePage;
