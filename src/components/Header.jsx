import React, { useState, useEffect, useRef } from 'react';
import { signOut } from 'firebase/auth';
import { auth, rtdb } from '../../firebase';
import { ref as rtdbRef, set as rtdbSet, serverTimestamp as rtdbServerTimestamp } from 'firebase/database';
import Auth from './Auth';

function Header({ user, onShowAuth, onNavigate }) {
  const [showMenu, setShowMenu] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const searchRef = useRef(null);

  // Popular searches
  const popularSearches = [
    'Boracay', 'Palawan', 'Baguio', 'Siargao', 'Cebu',
    'Beach', 'Mountains', 'Island', 'Adventure'
  ];

  // Load search history from localStorage
  useEffect(() => {
    const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    setSearchHistory(history);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleMenu = () => {
    setShowMenu(!showMenu);
  };

  const handleLoginClick = () => {
    setShowMenu(false);
    setShowAuthModal(true);
  };

  const closeAuthModal = () => {
    setShowAuthModal(false);
  };

  const handleLogout = async () => {
    try {
      // mark RTDB presence offline immediately (best-effort)
      try {
        if (user?.uid && rtdb) {
          // remove the RTDB presence node to avoid stale 'online' values
          await rtdbSet(rtdbRef(rtdb, `status/${user.uid}`), null);
        }
      } catch (err) {
        console.warn('Failed to set RTDB offline status on logout', err);
      }
      await signOut(auth);
      setShowMenu(false);
      alert('Logged out successfully!');
    } catch (error) {
      alert(error.message);
    }
  };

  const handleLogoClick = (e) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate('home');
    }
  };

  const handleSearchFocus = () => {
    setShowSearchDropdown(true);
  };

  const handleSearch = (query) => {
    if (!query.trim()) return;

    // Add to search history
    const updatedHistory = [query, ...searchHistory.filter(item => item !== query)].slice(0, 5);
    setSearchHistory(updatedHistory);
    localStorage.setItem('searchHistory', JSON.stringify(updatedHistory));

    // Navigate to search results
    setShowSearchDropdown(false);
    setSearchQuery('');
    if (onNavigate) {
      onNavigate('search', query);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    handleSearch(searchQuery);
  };

  const handleSearchClick = (query) => {
    handleSearch(query);
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('searchHistory');
  };

  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom sticky-top shadow-sm">
        <div className="container-fluid px-3 px-lg-5 py-2">
          {/* Logo */}
          <a 
            className="navbar-brand d-flex align-items-center" 
            href="#" 
            onClick={handleLogoClick}
            style={{ cursor: 'pointer' }}
          >
            <i className="bi bi-airplane-fill text-danger fs-3 me-2"></i>
            <span className="fw-bold fs-4">TravelMate</span>
          </a>

          {/* Search Bar - Desktop */}
          <div className="mx-auto d-none d-lg-block position-relative" style={{ maxWidth: '480px', width: '100%' }} ref={searchRef}>
            <form onSubmit={handleSearchSubmit}>
              <div className="input-group rounded-pill border shadow-sm">
                <input 
                  type="text" 
                  className="form-control border-0 ps-4" 
                  placeholder="Start your search" 
                  style={{ borderRadius: '50px 0 0 50px' }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={handleSearchFocus}
                />
                <button className="btn btn-danger rounded-circle me-1" type="submit" style={{ width: '40px', height: '40px', marginTop: '4px', marginBottom: '4px' }}>
                  <i className="bi bi-search"></i>
                </button>
              </div>
            </form>

            {/* Search Dropdown */}
            {showSearchDropdown && (
              <div className="position-absolute bg-white border rounded-3 shadow-lg mt-2 p-3" style={{ width: '100%', maxHeight: '400px', overflowY: 'auto', zIndex: 1050 }}>
                {/* Recent Searches */}
                {searchHistory.length > 0 && (
                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h6 className="fw-bold mb-0 small">Recent searches</h6>
                      <button 
                        className="btn btn-link btn-sm text-muted p-0"
                        onClick={clearSearchHistory}
                      >
                        Clear all
                      </button>
                    </div>
                    {searchHistory.map((search, index) => (
                      <div 
                        key={index}
                        className="d-flex align-items-center py-2 px-2 rounded hover-bg-light"
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleSearchClick(search)}
                      >
                        <i className="bi bi-clock-history me-3 text-muted"></i>
                        <span>{search}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Popular Searches */}
                <div>
                  <h6 className="fw-bold mb-2 small">Popular searches</h6>
                  {popularSearches.map((search, index) => (
                    <div 
                      key={index}
                      className="d-flex align-items-center py-2 px-2 rounded hover-bg-light"
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleSearchClick(search)}
                    >
                      <i className="bi bi-search me-3 text-muted"></i>
                      <span>{search}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="dropdown">
            <button 
              className="btn btn-outline-secondary rounded-pill d-flex align-items-center gap-2 px-3 py-2"
              type="button"
              onClick={toggleMenu}
            >
              <i className="bi bi-list fs-5"></i>
              <i className="bi bi-person-circle fs-5"></i>
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <div className="dropdown-menu dropdown-menu-end show position-absolute mt-2 shadow-lg border-0 rounded-3" style={{ minWidth: '240px', right: 0 }}>
                {user ? (
                  <>
                    <div className="px-3 py-2 border-bottom">
                      <div className="fw-bold">{user.displayName || user.email?.split('@')[0]}</div>
                      <div className="small text-muted">{user.email}</div>
                    </div>
                    <a className="dropdown-item py-2" href="#">Profile</a>
                    <a className="dropdown-item py-2" href="#" onClick={(e) => { e.preventDefault(); if (onNavigate) onNavigate('trips'); }}>Trips</a>
                    <a className="dropdown-item py-2" href="#">Wishlists</a>
                    <hr className="dropdown-divider" />
                    <a className="dropdown-item py-2" href="#">Help Center</a>
                    <button className="dropdown-item py-2" onClick={handleLogout}>Log out</button>
                  </>
                ) : (
                  <>
                    <button className="dropdown-item py-2 fw-bold" onClick={handleLoginClick}>
                      Log in
                    </button>
                    <button className="dropdown-item py-2" onClick={handleLoginClick}>
                      Sign up
                    </button>
                    <hr className="dropdown-divider" />
                    <a className="dropdown-item py-2" href="#">Help Center</a>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>

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

      {/* Inline CSS for hover effects */}
      <style>{`
        .hover-bg-light:hover {
          background-color: #f8f9fa !important;
        }
      `}</style>
    </>
  );
}

export default Header;
