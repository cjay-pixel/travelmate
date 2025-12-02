import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import HomePage from './pages/HomePage';
import SmartRecommendationsPage from './pages/SmartRecommendationsPage';
import BudgetFriendlyPage from './pages/BudgetFriendlyPage';
import EasyPlanningPage from './pages/EasyPlanningPage';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('home');

  useEffect(() => {
    onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
  }, []);

  const handleNavigate = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'smart-recommendations':
        return <SmartRecommendationsPage user={user} onNavigate={handleNavigate} />;
      case 'budget-friendly':
        return <BudgetFriendlyPage user={user} onNavigate={handleNavigate} />;
      case 'easy-planning':
        return <EasyPlanningPage user={user} onNavigate={handleNavigate} />;
      case 'home':
      default:
        return <HomePage user={user} onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="app">
      {renderPage()}
    </div>
  );
}

export default App;