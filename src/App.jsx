import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
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
  const [currentPage, setCurrentPage] = useState('home');
  const [adminSection, setAdminSection] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Check if URL is /admin on initial load
    const path = window.location.pathname;
    if (path === '/admin' || path.startsWith('/admin')) {
      // Set session type to admin immediately
      sessionStorage.setItem('sessionType', 'admin');
      // Parse admin section from URL
      const section = path.split('/admin/')[1] || 'dashboard';
      setCurrentPage('admin-dashboard');
      setAdminSection(section);
    }
    
    // Set a timeout to stop loading after 3 seconds even if auth hasn't loaded
    const loadingTimeout = setTimeout(() => {
      console.log('Auth loading timeout - proceeding anyway');
      setAuthLoading(false);
    }, 3000);
    
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      clearTimeout(loadingTimeout);
      
      const sessionType = sessionStorage.getItem('sessionType');
      const path = window.location.pathname;
      const isAdminPage = path === '/admin' || path.startsWith('/admin');
      
      // If user is logged in
      if (currentUser) {
        // If no session type set, determine from current page
        if (!sessionType) {
          if (isAdminPage) {
            sessionStorage.setItem('sessionType', 'admin');
          } else {
            sessionStorage.setItem('sessionType', 'user');
          }
        }
        
        // If on admin page but session is user, sign out
        if (isAdminPage && sessionType === 'user') {
          auth.signOut();
          setUser(null);
          setAuthLoading(false);
          return;
        }
        
        // If on user page but session is admin, sign out
        if (!isAdminPage && sessionType === 'admin') {
          auth.signOut();
          setUser(null);
          setAuthLoading(false);
          return;
        }
        
        setUser(currentUser);
      } else {
        setUser(null);
        // Only clear session type if not on admin page
        if (!isAdminPage) {
          sessionStorage.removeItem('sessionType');
        }
      }
      
      setAuthLoading(false);
    });

    return () => {
      clearTimeout(loadingTimeout);
      unsubscribe();
    };
  }, []);

  const handleNavigate = (page, data) => {
    // Clear session type when signing out
    if (page === 'admin-login') {
      sessionStorage.removeItem('sessionType');
      if (user) {
        auth.signOut();
        setUser(null);
      }
    }
    
    if (page === 'home' && (currentPage === 'admin-dashboard' || currentPage === 'admin-login')) {
      sessionStorage.removeItem('sessionType');
      if (user) {
        auth.signOut();
        setUser(null);
      }
    }
    
    setCurrentPage(page);
    if (page === 'search' && data) {
      setSearchQuery(data);
    }
    
    // Update URL for admin pages
    if (page === 'admin-login') {
      window.history.pushState({}, '', '/admin');
      setAdminSection('dashboard');
    } else if (page === 'admin-dashboard') {
      const section = data || 'dashboard';
      setAdminSection(section);
      window.history.pushState({}, '', `/admin/${section}`);
    } else if (page === 'home') {
      window.history.pushState({}, '', '/');
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPage = () => {
    // Show loading while auth is initializing (with 3 second max timeout)
    if (authLoading) {
      return (
        <div className="d-flex justify-content-center align-items-center min-vh-100">
          <div className="spinner-border text-danger" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      );
    }
    
    switch (currentPage) {
      case 'smart-recommendations':
        return <SmartRecommendationsPage user={user} onNavigate={handleNavigate} />;
      case 'budget-friendly':
        return <BudgetFriendlyPage user={user} onNavigate={handleNavigate} />;
      case 'easy-planning':
        return <EasyPlanningPage user={user} onNavigate={handleNavigate} />;
      case 'search':
        return <SearchResultsPage user={user} onNavigate={handleNavigate} searchQuery={searchQuery} />;
      case 'admin-login':
        return <AdminLoginPage onNavigate={handleNavigate} />;
      case 'admin-dashboard':
        return <AdminDashboardPage user={user} onNavigate={handleNavigate} section={adminSection} authLoading={authLoading} />;
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