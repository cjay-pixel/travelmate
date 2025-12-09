import React, { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../../firebase';
import { doc, setDoc, serverTimestamp, collection, query, where, getDocs, updateDoc, deleteField } from 'firebase/firestore';
import { checkAdminStatus } from './adminUtils';

const SUPER_ADMIN_EMAIL = "superadmin@gmail.com";

function AdminLoginPage({ onNavigate }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If already logged in as admin, redirect to dashboard
    const checkIfAdmin = async () => {
      const isAdmin = await checkAdminStatus();
      if (isAdmin) {
        onNavigate('admin-dashboard');
      }
    };
    checkIfAdmin();
  }, [onNavigate]);

  const createAdminDocument = async (user, isSuperAdmin) => {
    try {
      console.log('Creating admin document for:', user.email, 'UID:', user.uid);
      // Store admins in 'admins_auth' collection (separate from users)
      await setDoc(doc(db, 'admins_auth', user.uid), {
        email: user.email,
        role: isSuperAdmin ? 'super_admin' : 'admin',
        createdAt: serverTimestamp(),
        uid: user.uid
      });
      console.log('Admin document created successfully');
    } catch (error) {
      console.error('Error creating admin document:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let userCredential;
      
      // Try to sign in with existing account first
      try {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log('Signed in with existing account:', userCredential.user.email);
      } catch (signInError) {
        console.log('Sign-in failed, checking for pending admin account...', signInError.code);
        
        // If sign-in fails, check if this is a first-time admin login
        if (signInError.code === 'auth/invalid-credential' || signInError.code === 'auth/user-not-found') {
          // Check admins collection for temporary password
          const adminsRef = collection(db, 'admins');
          const q = query(adminsRef, where('email', '==', email.toLowerCase().trim()));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            const adminDoc = querySnapshot.docs[0];
            const adminData = adminDoc.data();
            
            console.log('Found pending admin:', adminData.email, 'Status:', adminData.status);
            
            // Check if password matches temporary password
            if (adminData.temporaryPassword === password && adminData.status === 'pending') {
              console.log('Temporary password matched, creating Firebase Auth account...');
              
              // Create Firebase Auth account
              userCredential = await createUserWithEmailAndPassword(auth, email, password);
              console.log('Firebase Auth account created:', userCredential.user.uid);
              
              // Update admin status and remove temporary password
              await updateDoc(doc(db, 'admins', adminDoc.id), {
                status: 'active',
                uid: userCredential.user.uid,
                temporaryPassword: deleteField(),
                activatedAt: serverTimestamp()
              });
              
              console.log('Admin account activated');
            } else {
              throw new Error('Invalid credentials');
            }
          } else {
            throw signInError;
          }
        } else {
          throw signInError;
        }
      }
      
      // Check if user has admin privileges
      const isAdmin = await checkAdminStatus();
      
      if (isAdmin) {
        // Create/update admin document in admins_auth collection
        const isSuperAdmin = userCredential.user.email === SUPER_ADMIN_EMAIL;
        await createAdminDocument(userCredential.user, isSuperAdmin);
        
        // Mark this session as admin
        sessionStorage.setItem('sessionType', 'admin');
        
        onNavigate('admin-dashboard');
      } else {
        // Not an admin, sign them out
        await auth.signOut();
        setError('Access denied. You do not have admin privileges.');
      }
    } catch (err) {
      console.error('Login error:', err);
      
      // More specific error messages
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        setError('Invalid email or password. Please check your credentials and try again.');
      } else if (err.code === 'auth/user-not-found') {
        setError('No account found with this email. Please check the email address.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please try again later.');
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Login failed. Please check the console for details.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center min-vh-100 py-4">
      <div className="card shadow-lg border-0 rounded-4" style={{ maxWidth: '568px', width: '100%' }}>
        <div className="card-body p-4 p-md-5">
          {/* Header */}
          <div className="text-center mb-4">
            <div className="mb-3">
              <i className="bi bi-shield-lock-fill" style={{ fontSize: '3rem', color: '#FF385C' }}></i>
            </div>
            <h2 className="fw-bold mb-2">Admin Login</h2>
            <p className="text-muted mb-0">Welcome to TravelMate AI Admin</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="alert alert-danger alert-dismissible fade show" role="alert">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              <span>{error}</span>
            </div>
          )}

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
                autoComplete="email"
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
                  autoComplete="current-password"
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
            <button 
              type="submit" 
              className="btn btn-danger w-100 py-3 fw-bold" 
              style={{ background: 'linear-gradient(to right, #FF385C, #E31C5F)', border: 'none' }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Signing in...
                </>
              ) : (
                'Log in as Admin'
              )}
            </button>
          </form>

          {/* Back to Home */}
          <div className="text-center mt-4">
            <span className="text-muted">Not an admin?</span>
            <button 
              className="btn btn-link text-decoration-none fw-bold p-0 ms-2" 
              onClick={() => onNavigate('home')}
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminLoginPage;
