import React, { useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import Auth from './Auth';

function Header({ user, onShowAuth }) {
  const [showMenu, setShowMenu] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

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
      await signOut(auth);
      setShowMenu(false);
      alert('Logged out successfully!');
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom sticky-top shadow-sm">
        <div className="container-fluid px-3 px-lg-5 py-2">
          {/* Logo */}
          <a className="navbar-brand d-flex align-items-center" href="#">
            <i className="bi bi-airplane-fill text-danger fs-3 me-2"></i>
            <span className="fw-bold fs-4">TravelMate</span>
          </a>

          {/* Search Bar - Desktop */}
          <div className="mx-auto d-none d-lg-block" style={{ maxWidth: '480px', width: '100%' }}>
            <div className="input-group rounded-pill border shadow-sm">
              <input 
                type="text" 
                className="form-control border-0 ps-4" 
                placeholder="Start your search" 
                style={{ borderRadius: '50px 0 0 50px' }}
              />
              <button className="btn btn-danger rounded-circle me-1" type="button" style={{ width: '40px', height: '40px', marginTop: '4px', marginBottom: '4px' }}>
                <i className="bi bi-search"></i>
              </button>
            </div>
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
                    <a className="dropdown-item py-2" href="#">Profile</a>
                    <a className="dropdown-item py-2" href="#">Trips</a>
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
              <Auth />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Header;
