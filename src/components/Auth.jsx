import React, { useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider 
} from 'firebase/auth';
import { auth, db } from '../../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

function Auth({ onClose }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const createUserDocument = async (user) => {
    try {
      // Store regular users in 'users' collection
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        displayName: user.displayName || null,
        createdAt: serverTimestamp(),
        photoURL: user.photoURL || null,
        uid: user.uid
      });
    } catch (error) {
      console.error('Error creating user document:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await createUserDocument(userCredential.user);
        // Mark this session as user
        sessionStorage.setItem('sessionType', 'user');
        alert('Account created successfully!');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        // Mark this session as user
        sessionStorage.setItem('sessionType', 'user');
        alert('Logged in successfully!');
      }
      if (onClose) onClose(); // Close modal after successful auth
    } catch (error) {
      alert(error.message);
    }
  };

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      // Check if this is a new user and create document
      if (result.user.metadata.creationTime === result.user.metadata.lastSignInTime) {
        await createUserDocument(result.user);
      }
      // Mark this session as user
      sessionStorage.setItem('sessionType', 'user');
      alert('Signed in with Google successfully!');
      if (onClose) onClose(); // Close modal after successful auth
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center min-vh-100 py-4">
      <div className="card shadow-lg border-0 rounded-4" style={{ maxWidth: '568px', width: '100%' }}>
        <div className="card-body p-4 p-md-5">
          {/* Header */}
          <div className="text-center mb-4">
            <h2 className="fw-bold mb-2">{isSignUp ? 'Sign up' : 'Log in'}</h2>
            <p className="text-muted mb-0">Welcome to TravelMate AI</p>
          </div>

          {/* Google Sign In Button */}
          <button 
            onClick={handleGoogleSignIn} 
            className="btn btn-outline-secondary w-100 py-3 mb-3 d-flex align-items-center justify-content-center gap-2"
            type="button"
          >
            <i className="bi bi-google"></i>
            <span>Continue with Google</span>
          </button>

          {/* Divider */}
          <div className="d-flex align-items-center my-4">
            <hr className="flex-grow-1" />
            <span className="px-3 text-muted small">or</span>
            <hr className="flex-grow-1" />
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <input 
                type="email" 
                className="form-control form-control-lg" 
                placeholder="Email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
            </div>
            <div className="mb-4">
              <div className="position-relative">
                <input 
                  type={showPassword ? "text" : "password"}
                  className="form-control form-control-lg pe-5" 
                  placeholder="Password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                />
                <button
                  type="button"
                  className="btn btn-link position-absolute end-0 top-50 translate-middle-y text-muted"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ textDecoration: 'none', zIndex: 10 }}
                >
                  <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                </button>
              </div>
            </div>
            <button type="submit" className="btn btn-danger w-100 py-3 fw-bold" style={{ background: 'linear-gradient(to right, #FF385C, #E31C5F)', border: 'none' }}>
              {isSignUp ? 'Sign up' : 'Log in'}
            </button>
          </form>

          {/* Footer */}
          <div className="text-center mt-4">
            <span className="text-muted">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            </span>
            <button className="btn btn-link text-decoration-none fw-bold p-0 ms-2" onClick={() => setIsSignUp(!isSignUp)}>
              {isSignUp ? 'Log in' : 'Sign up'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Auth;