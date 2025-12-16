import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db, rtdb } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref as rtdbRef, set as rtdbSet, onDisconnect as rtdbOnDisconnectFn, serverTimestamp as rtdbServerTimestamp } from 'firebase/database';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import SmartRecommendationsPage from './pages/SmartRecommendationsPage';
import BudgetFriendlyPage from './pages/BudgetFriendlyPage';
import EasyPlanningPage from './pages/EasyPlanningPage';
import TripsPage from './pages/TripsPage';
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

    let heartbeatInterval = null;
    let rtdbOnDisconnect = null;
    let rtdbStatusRef = null;
    const sendHeartbeat = async (uid) => {
      try {
        // write lastActive timestamp to user's Firestore document (merge so we don't overwrite)
        await setDoc(doc(db, 'users', uid), { lastActive: serverTimestamp() }, { merge: true });
        // update realtime DB presence timestamp as well
        if (rtdb && rtdbStatusRef) {
          await rtdbSet(rtdbStatusRef, { state: 'online', last_changed: rtdbServerTimestamp() });
        }
      } catch (err) {
        console.error('Failed to send heartbeat for user', uid, err);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      clearTimeout(loadingTimeout);
      const sessionType = sessionStorage.getItem('sessionType');
      const isAdminPage = location.pathname === '/admin' || location.pathname.startsWith('/admin');

      if (currentUser) {
        if (!sessionType) {
          sessionStorage.setItem('sessionType', isAdminPage ? 'admin' : 'user');
        }

        if (isAdminPage && sessionType === 'user') {
          try {
            if (currentUser?.uid && rtdb) {
                    // attempt to remove presence node if older session exists
                    await rtdbSet(rtdbRef(rtdb, `status/${currentUser.uid}`), null);
            }
          } catch (err) {
            console.warn('Failed to set RTDB offline status before signOut (sessionType mismatch)', err);
          }
          await auth.signOut();
          setUser(null);
          setAuthLoading(false);
          return;
        }

        if (!isAdminPage && sessionType === 'admin') {
          try {
            if (currentUser?.uid && rtdb) {
              await rtdbSet(rtdbRef(rtdb, `status/${currentUser.uid}`), null);
            }
          } catch (err) {
            console.warn('Failed to set RTDB offline status before signOut (sessionType mismatch)', err);
          }
          await auth.signOut();
          setUser(null);
          setAuthLoading(false);
          return;
        }

        setUser(currentUser);
        // send initial heartbeat and start periodic updates
        if (currentUser?.uid) {
          // set up RTDB status ref and onDisconnect
          try {
            rtdbStatusRef = rtdbRef(rtdb, `status/${currentUser.uid}`);
            // ensure server sets offline on disconnect
            rtdbOnDisconnect = rtdbOnDisconnectFn(rtdbStatusRef);
            await rtdbOnDisconnect.set({ state: 'offline', last_changed: rtdbServerTimestamp() });
            // immediately set online
            await rtdbSet(rtdbStatusRef, { state: 'online', last_changed: rtdbServerTimestamp() });
          } catch (err) {
            console.error('RTDB presence setup failed', err);
          }

          sendHeartbeat(currentUser.uid);
          // update every 60 seconds while logged in
          heartbeatInterval = setInterval(() => sendHeartbeat(currentUser.uid), 60000);
          // also update when tab becomes visible
          const handleVisibility = () => {
            if (document.visibilityState === 'visible') sendHeartbeat(currentUser.uid);
          };
          document.addEventListener('visibilitychange', handleVisibility);
          // ensure we remove this listener when auth changes
          // store on the unsubscribe closure
          unsubscribe._visibilityHandler = handleVisibility;
        }
      } else {
        setUser(null);
        if (!isAdminPage) sessionStorage.removeItem('sessionType');
      }

      setAuthLoading(false);
    });

    return () => {
      clearTimeout(loadingTimeout);
      // clear heartbeat interval and listeners if set
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      if (unsubscribe && unsubscribe._visibilityHandler) {
        document.removeEventListener('visibilitychange', unsubscribe._visibilityHandler);
      }
      // set RTDB status offline and cancel onDisconnect
      // clear RTDB onDisconnect and set offline (don't await in cleanup)
      if (rtdbOnDisconnect && rtdbStatusRef) {
        rtdbOnDisconnect.cancel().catch((err) => console.error('Failed to cancel RTDB onDisconnect', err));
        rtdbSet(rtdbStatusRef, null).catch((err) => console.error('Failed to remove RTDB presence node', err));
      }
      unsubscribe();
    };
    // eslint-disable-next-line
  }, [location.pathname]);

  const handleNavigate = (page, data) => {
    if (page === 'admin-login') {
      sessionStorage.removeItem('sessionType');
      if (user) {
        (async () => {
          try {
            if (user?.uid && rtdb) {
              await rtdbSet(rtdbRef(rtdb, `status/${user.uid}`), null);
            }
          } catch (err) {
            console.warn('Failed to remove RTDB presence node before signOut (navigate admin-login)', err);
          }
          await auth.signOut();
          setUser(null);
        })();
      }
      navigate('/admin');
      return;
    }

    if (page === 'home') {
      sessionStorage.removeItem('sessionType');
      // Do not sign the user out when navigating to home — just clear sessionType
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
    if (page === 'easy-planning') {
      // allow passing a plan object as navigation state to pre-fill the form
      if (data) return navigate('/easy-planning', { state: data });
      return navigate('/easy-planning');
    }
    if (page === 'trips') return navigate('/trips');
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
        <Route path="/trips" element={<TripsPage user={user} onNavigate={handleNavigate} />} />
        <Route path="/search" element={<SearchResultsPage user={user} onNavigate={handleNavigate} searchQuery={searchQuery} />} />
        <Route path="/admin" element={<AdminLoginPage onNavigate={handleNavigate} />} />
        <Route path="/admin/:section" element={<AdminDashboardPage user={user} onNavigate={handleNavigate} authLoading={authLoading} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;