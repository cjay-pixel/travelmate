import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { auth, db, rtdb } from '../../firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { ref as rtdbRef, onValue as onRtdbValue, set as rtdbSet, serverTimestamp as rtdbServerTimestamp } from 'firebase/database';
import { checkAdminStatus } from './adminUtils';
import ManageAdmins from './ManageAdmins';
import Dashboard from './components/Dashboard';
import Users from './components/Users';
import Destinations from './components/Destinations';
import Preferences from './components/Preferences';
import Messages from './components/Messages';
import Analytics from './components/Analytics';

function AdminDashboardPage({ onNavigate, user, section = 'dashboard', authLoading }) {
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState(params?.section || section);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBookings: 0,
    totalDestinations: 0,
    recentActivity: [],
    activeToday: 0
  });

  const SESSION_TIMEOUT = 900000; // 15 minutes in milliseconds
  let inactivityTimer;

  const resetInactivityTimer = () => {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
      handleSessionTimeout();
    }, SESSION_TIMEOUT);
  };

  const handleSessionTimeout = async () => {
    alert('Session expired due to inactivity. You will be logged out.');
    try {
      try {
        if (user?.uid && rtdb) {
          await rtdbSet(rtdbRef(rtdb, `status/${user.uid}`), null);
        }
      } catch (err) {
        console.warn('Failed to set RTDB offline status on session timeout', err);
      }
      await auth.signOut();
      onNavigate('admin-login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  useEffect(() => {
    // Set up activity listeners
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, resetInactivityTimer);
    });

    // Start the timer
    resetInactivityTimer();

    // Cleanup
    return () => {
      clearTimeout(inactivityTimer);
      events.forEach(event => {
        document.removeEventListener(event, resetInactivityTimer);
      });
    };
  }, []);

  useEffect(() => {
    // Don't do anything while auth is still loading
    if (authLoading) {
      console.log('Auth still loading, waiting...');
      return;
    }
    
    // Verify admin status only after auth loading completes
    const verifyAdmin = async () => {
      try {
        // If no user is logged in, redirect to admin login
        if (!user) {
          console.log('No user logged in, redirecting to admin login');
          onNavigate('admin-login');
          return;
        }
        
        console.log('Checking admin status for:', user.email);
        const isAdmin = await checkAdminStatus();
        console.log('Is admin:', isAdmin);
        
        if (!isAdmin) {
          // Not an admin, sign out and redirect
          console.log('Not an admin, redirecting to login');
          try {
            if (user?.uid && rtdb) {
              await rtdbSet(rtdbRef(rtdb, `status/${user.uid}`), null);
            }
          } catch (err) {
            console.warn('Failed to set RTDB offline status before signOut', err);
          }
          await auth.signOut();
          onNavigate('admin-login');
          return;
        }
        
        console.log('Admin verified, loading dashboard data');
        loadDashboardData();
      } catch (error) {
        console.error('Error verifying admin:', error);
        // On error, redirect to login
        onNavigate('admin-login');
      }
    };
    
    verifyAdmin();
  }, [onNavigate, user, authLoading]);

  // Listen for realtime presence updates from RTDB and update activeToday
  useEffect(() => {
    try {
      const statusRef = rtdbRef(rtdb, 'status');
      const unsubscribeStatus = onRtdbValue(statusRef, (snap) => {
        const val = snap.val() || {};
        let count = 0;
        Object.values(val).forEach((s) => {
          if (s && s.state === 'online') count += 1;
        });
        setStats((prev) => ({ ...prev, activeToday: count }));
      });

      return () => {
        if (unsubscribeStatus) unsubscribeStatus();
      };
    } catch (err) {
      console.warn('RTDB status listener failed', err);
    }
  }, []);

  useEffect(() => {
    // Update active section when route param or prop changes
    setActiveSection(params?.section || section);

    // Reload dashboard data when returning to dashboard
    if ((params?.section || section) === 'dashboard' && !loading && user) {
      console.log('Section changed to dashboard, reloading data...');
      loadDashboardData();
    }
  }, [section, loading, user, params?.section]);

  const loadDashboardData = async () => {
    try {
      console.log('Loading dashboard data...');
      // Fetch real counts from Firestore
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const tripPlansSnapshot = await getDocs(collection(db, 'tripPlans'));
      const destinationsSnapshot = await getDocs(collection(db, 'destinations'));
      
      console.log('Users count:', usersSnapshot.size);
      console.log('Trip Plans count:', tripPlansSnapshot.size);
      console.log('Destinations count:', destinationsSnapshot.size);
      
      // Compute active users based on `lastActive` recency (2 minutes)
      const ACTIVE_THRESHOLD_MS = 2 * 60 * 1000; // 2 minutes
      let activeCount = 0;
      usersSnapshot.forEach((doc) => {
        const data = doc.data();
        const lastActive = data?.lastActive;
        if (lastActive && lastActive.seconds) {
          const last = new Date(lastActive.seconds * 1000).getTime();
          if (Date.now() - last <= ACTIVE_THRESHOLD_MS) activeCount += 1;
        }
      });

      setStats({
        totalUsers: usersSnapshot.size,
        totalBookings: tripPlansSnapshot.size,
        totalDestinations: destinationsSnapshot.size,
        recentActivity: [],
        activeToday: activeCount
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const confirmLogout = window.confirm('Are you sure you want to log out?');
    
    if (confirmLogout) {
      try {
        sessionStorage.removeItem('sessionType');
        try {
          if (user?.uid && rtdb) {
            await rtdbSet(rtdbRef(rtdb, `status/${user.uid}`), null);
          }
        } catch (err) {
          console.warn('Failed to set RTDB offline status on admin logout', err);
        }
        await auth.signOut();
        onNavigate('admin-login');
      } catch (error) {
        console.error('Error logging out:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="spinner-border" style={{ color: '#FF385C' }} role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex" style={{ minHeight: '100vh', backgroundColor: '#f7f7f7' }}>
      {/* Sidebar */}
      <div 
        className={`bg-white shadow-sm ${sidebarOpen ? '' : 'd-none d-lg-block'}`}
        style={{ 
          width: sidebarOpen ? '280px' : '0',
          minWidth: sidebarOpen ? '280px' : '0',
          transition: 'all 0.3s',
          position: 'fixed',
          height: '100vh',
          zIndex: 1000,
          overflowY: 'auto'
        }}
      >
        <div className="p-4">
          {/* Logo/Brand */}
          <div className="mb-4">
            <h4 className="fw-bold mb-0" style={{ color: '#FF385C' }}>
              {/* <i className="bi bi-speedometer2 me-2"></i> */}
              TravelMate
            </h4>
            <small className="text-muted">Admin Panel</small>
          </div>

          {/* Navigation Menu */}
          <nav className="nav flex-column gap-1">
            <button
              onClick={() => onNavigate('admin-dashboard', 'dashboard')}
              className={`nav-link text-start rounded-3 d-flex align-items-center px-3 py-2 border-0 ${
                activeSection === 'dashboard' ? 'active' : ''
              }`}
              style={{
                backgroundColor: activeSection === 'dashboard' ? '#FF385C15' : 'transparent',
                color: activeSection === 'dashboard' ? '#FF385C' : '#717171',
                fontWeight: activeSection === 'dashboard' ? '600' : 'normal'
              }}
            >
              <i className="bi bi-house-door me-3" style={{ fontSize: '1.1rem' }}></i>
              Dashboard
            </button>

            <button
              onClick={() => onNavigate('admin-dashboard', 'users')}
              className={`nav-link text-start rounded-3 d-flex align-items-center px-3 py-2 border-0 ${
                activeSection === 'users' ? 'active' : ''
              }`}
              style={{
                backgroundColor: activeSection === 'users' ? '#FF385C15' : 'transparent',
                color: activeSection === 'users' ? '#FF385C' : '#717171',
                fontWeight: activeSection === 'users' ? '600' : 'normal'
              }}
            >
              <i className="bi bi-people me-3" style={{ fontSize: '1.1rem' }}></i>
              Users
            </button>

            <button
              onClick={() => onNavigate('admin-dashboard', 'destinations')}
              className={`nav-link text-start rounded-3 d-flex align-items-center px-3 py-2 border-0 ${
                activeSection === 'destinations' ? 'active' : ''
              }`}
              style={{
                backgroundColor: activeSection === 'destinations' ? '#FF385C15' : 'transparent',
                color: activeSection === 'destinations' ? '#FF385C' : '#717171',
                fontWeight: activeSection === 'destinations' ? '600' : 'normal'
              }}
            >
              <i className="bi bi-geo-alt me-3" style={{ fontSize: '1.1rem' }}></i>
              Destinations
            </button>

            <button
              onClick={() => onNavigate('admin-dashboard', 'preferences')}
              className={`nav-link text-start rounded-3 d-flex align-items-center px-3 py-2 border-0 ${
                activeSection === 'preferences' ? 'active' : ''
              }`}
              style={{
                backgroundColor: activeSection === 'preferences' ? '#FF385C15' : 'transparent',
                color: activeSection === 'preferences' ? '#FF385C' : '#717171',
                fontWeight: activeSection === 'preferences' ? '600' : 'normal'
              }}
            >
              <i className="bi bi-grid-3x3-gap-fill me-3" style={{ fontSize: '1.1rem' }}></i>
              Preferences
            </button>

            <button
              onClick={() => onNavigate('admin-dashboard', 'messages')}
              className={`nav-link text-start rounded-3 d-flex align-items-center px-3 py-2 border-0 ${
                activeSection === 'messages' ? 'active' : ''
              }`}
              style={{
                backgroundColor: activeSection === 'messages' ? '#FF385C15' : 'transparent',
                color: activeSection === 'messages' ? '#FF385C' : '#717171',
                fontWeight: activeSection === 'messages' ? '600' : 'normal'
              }}
            >
              <i className="bi bi-chat-dots me-3" style={{ fontSize: '1.1rem' }}></i>
              Messages
              {/* <span className="badge rounded-pill ms-auto" style={{ backgroundColor: '#FF385C', color: 'white' }}>3</span> */}
            </button>

            <button
              onClick={() => onNavigate('admin-dashboard', 'analytics')}
              className={`nav-link text-start rounded-3 d-flex align-items-center px-3 py-2 border-0 ${
                activeSection === 'analytics' ? 'active' : ''
              }`}
              style={{
                backgroundColor: activeSection === 'analytics' ? '#FF385C15' : 'transparent',
                color: activeSection === 'analytics' ? '#FF385C' : '#717171',
                fontWeight: activeSection === 'analytics' ? '600' : 'normal'
              }}
            >
              <i className="bi bi-bar-chart me-3" style={{ fontSize: '1.1rem' }}></i>
              Analytics
            </button>

            <hr className="my-3" />

            <button
              onClick={() => onNavigate('admin-dashboard', 'admins')}
              className={`nav-link text-start rounded-3 d-flex align-items-center px-3 py-2 border-0 ${
                activeSection === 'admins' ? 'active' : ''
              }`}
              style={{
                backgroundColor: activeSection === 'admins' ? '#FF385C15' : 'transparent',
                color: activeSection === 'admins' ? '#FF385C' : '#717171',
                fontWeight: activeSection === 'admins' ? '600' : 'normal'
              }}
            >
              <i className="bi bi-shield-lock me-3" style={{ fontSize: '1.1rem' }}></i>
              Manage Admins
            </button>
          </nav>
        </div>

        {/* User Info at Bottom */}
        <div className="p-4 mt-auto border-top">
          <div className="d-flex align-items-center mb-3">
            <div 
              className="rounded-circle d-flex align-items-center justify-content-center me-2"
              style={{ 
                width: '40px', 
                height: '40px', 
                backgroundColor: '#FF385C15'
              }}
            >
              <i className="bi bi-person-circle" style={{ fontSize: '1.5rem', color: '#FF385C' }}></i>
            </div>
            <div className="flex-grow-1 overflow-hidden">
              <small className="text-muted d-block text-truncate">{user?.email}</small>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="btn btn-outline-danger w-100 btn-sm rounded-3"
          >
            <i className="bi bi-box-arrow-right me-2"></i>
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div 
        className="flex-grow-1"
        style={{
          marginLeft: sidebarOpen ? '280px' : '0',
          transition: 'margin-left 0.3s'
        }}
      >
        {/* Top Navigation Bar */}
        <nav className="navbar navbar-light bg-white shadow-sm sticky-top">
          <div className="container-fluid px-3 px-md-4 py-2">
            <button
              className="btn btn-link text-decoration-none p-0 d-lg-none"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{ color: '#222' }}
            >
              <i className="bi bi-list" style={{ fontSize: '1.5rem' }}></i>
            </button>
            <span className="navbar-brand mb-0 fw-bold d-none d-lg-block" style={{ color: '#222' }}>
              {activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}
            </span>
            <div className="d-flex align-items-center gap-2">
              <button className="btn btn-link text-decoration-none p-0" style={{ color: '#717171' }}>
                <i className="bi bi-bell" style={{ fontSize: '1.2rem' }}></i>
              </button>
            </div>
          </div>
        </nav>

        {/* Content */}
        <div className="p-3 p-md-4">
          {/* Render component based on active section */}
          {activeSection === 'dashboard' && <Dashboard stats={stats} onRefresh={loadDashboardData} />}
          {activeSection === 'users' && <Users />}
          {activeSection === 'destinations' && <Destinations />}
          {activeSection === 'preferences' && <Preferences />}
          {activeSection === 'messages' && <Messages />}
          {activeSection === 'analytics' && <Analytics />}
          {activeSection === 'admins' && <ManageAdmins />}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboardPage;
