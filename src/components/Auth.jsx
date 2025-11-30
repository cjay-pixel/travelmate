import React, { useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider 
} from 'firebase/auth';
import { auth } from '../../firebase';

function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
        alert('Account created successfully!');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        alert('Logged in successfully!');
      }
    } catch (error) {
      alert(error.message);
    }
  };

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      alert('Signed in with Google successfully!');
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
              <input 
                type="password" 
                className="form-control form-control-lg" 
                placeholder="Password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
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