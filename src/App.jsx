import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import SmartRecommendationsPage from './pages/SmartRecommendationsPage';
import BudgetFriendlyPage from './pages/BudgetFriendlyPage';
import EasyPlanningPage from './pages/EasyPlanningPage';
import SearchResultsPage from './pages/SearchResultsPage';
import AdminLoginPage from './admin/AdminLoginPage';
import AdminDashboardPage from './admin/AdminDashboardPage';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // If URL starts with /admin set session type to admin
    const path = window.location.pathname;
    if (path === '/admin' || path.startsWith('/admin')) {
      sessionStorage.setItem('sessionType', 'admin');
    }

    const loadingTimeout = setTimeout(() => {
      setAuthLoading(false);
    }, 3000);

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      clearTimeout(loadingTimeout);
      const sessionType = sessionStorage.getItem('sessionType');
      const isAdminPage = location.pathname === '/admin' || location.pathname.startsWith('/admin');

      if (currentUser) {
        if (!sessionType) {
          sessionStorage.setItem('sessionType', isAdminPage ? 'admin' : 'user');
        }

        if (isAdminPage && sessionType === 'user') {
          auth.signOut();
          setUser(null);
          setAuthLoading(false);
          return;
        }

        if (!isAdminPage && sessionType === 'admin') {
          auth.signOut();
          setUser(null);
          setAuthLoading(false);
          return;
        }

        setUser(currentUser);
      } else {
        setUser(null);
        if (!isAdminPage) sessionStorage.removeItem('sessionType');
      }

      setAuthLoading(false);
    });

    return () => {
      clearTimeout(loadingTimeout);
      unsubscribe();
    };
    // eslint-disable-next-line
  }, [location.pathname]);

  const handleNavigate = (page, data) => {
    if (page === 'admin-login') {
      sessionStorage.removeItem('sessionType');
      if (user) {
        auth.signOut();
        setUser(null);
      }
      navigate('/admin');
      return;
    }

    if (page === 'home') {
      sessionStorage.removeItem('sessionType');
      if (user) {
        auth.signOut();
        setUser(null);
      }
      navigate('/');
      return;
    }

    if (page === 'search' && data) {
      setSearchQuery(data);
      navigate('/search');
      return;
    }

    if (page === 'smart-recommendations') return navigate('/smart-recommendations');
    if (page === 'budget-friendly') return navigate('/budget-friendly');
    if (page === 'easy-planning') return navigate('/easy-planning');
    if (page === 'admin-dashboard') {
      const section = data || 'dashboard';
      sessionStorage.setItem('sessionType', 'admin');
      navigate(`/admin/${section}`);
      return;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (authLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-danger" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<HomePage user={user} onNavigate={handleNavigate} />} />
        <Route path="/smart-recommendations" element={<SmartRecommendationsPage user={user} onNavigate={handleNavigate} />} />
        <Route path="/budget-friendly" element={<BudgetFriendlyPage user={user} onNavigate={handleNavigate} />} />
        <Route path="/easy-planning" element={<EasyPlanningPage user={user} onNavigate={handleNavigate} />} />
        <Route path="/search" element={<SearchResultsPage user={user} onNavigate={handleNavigate} searchQuery={searchQuery} />} />
        <Route path="/admin" element={<AdminLoginPage onNavigate={handleNavigate} />} />
        <Route path="/admin/:section" element={<AdminDashboardPage user={user} onNavigate={handleNavigate} authLoading={authLoading} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;