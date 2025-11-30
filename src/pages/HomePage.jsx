import React from 'react';
import Header from '../components/Header';
import HeroSection from '../components/HeroSection';
import FeaturesSection from '../components/FeaturesSection';
import CTASection from '../components/CTASection';
import Destinations from '../components/Destinations';

function HomePage({ user }) {
  return (
    <div className="homepage">
      <Header user={user} />
      
      <main>
        <HeroSection />
        {user && <Destinations />}
        <FeaturesSection />
        <CTASection />
      </main>
    </div>
  );
}

export default HomePage;
