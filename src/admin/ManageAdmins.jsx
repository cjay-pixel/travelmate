import React, { useState, useEffect } from 'react';
import { auth, db } from '../../firebase';
import { collection, addDoc, deleteDoc, doc, getDocs, serverTimestamp, setDoc, query, where } from 'firebase/firestore';
import { isSuperAdmin } from './adminUtils';

function ManageAdmins() {
  const [admins, setAdmins] = useState([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [autoGeneratePassword, setAutoGeneratePassword] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [generatedCredentials, setGeneratedCredentials] = useState(null);

  useEffect(() => {
    loadAdmins();
  }, []);

  const generatePassword = () => {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    try {
      const adminsSnapshot = await getDocs(collection(db, 'admins'));
      const adminList = [];
      adminsSnapshot.forEach((doc) => {
        adminList.push({
          id: doc.id,
          ...doc.data()
        });
      });
      setAdmins(adminList);
    } catch (error) {
      console.error('Error loading admins:', error);
    }
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    
    if (!isSuperAdmin()) {
      setMessage({ type: 'danger', text: 'Only super admin can add admins' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });
    setGeneratedCredentials(null);

    try {
      const email = newAdminEmail.toLowerCase().trim();
      const password = autoGeneratePassword ? generatePassword() : newAdminPassword;

      if (!autoGeneratePassword && (!newAdminPassword || newAdminPassword.length < 6)) {
        setMessage({ type: 'danger', text: 'Password must be at least 6 characters' });
        setLoading(false);
        return;
      }

      // Check if already admin
      const existing = admins.find(admin => admin.email === email);
      if (existing) {
        setMessage({ type: 'warning', text: 'This email is already an admin' });
        setLoading(false);
        return;
      }

      console.log('Creating admin account:', email);

      // Instead of creating Firebase Auth account here, store credentials in Firestore
      // The admin will create their Firebase Auth account on first login
      
      // Generate a unique admin ID
      const adminId = `admin_${Date.now()}`;

      // Add to admins collection with temporary password
      console.log('Adding to admins collection...');
      try {
        const adminDocRef = await addDoc(collection(db, 'admins'), {
          email: email,
          temporaryPassword: password,
          addedAt: serverTimestamp(),
          addedBy: 'Super Admin',
          role: 'admin',
          status: 'pending' // Will become 'active' after first login
        });
        console.log('Admin added to collection with ID:', adminDocRef.id);
      } catch (firestoreError) {
        console.error('Firestore admins error:', firestoreError);
        throw new Error(`Failed to add to admins collection: ${firestoreError.message}`);
      }

      console.log('Admin account created successfully in database');

      // Show credentials to super admin
      setGeneratedCredentials({ email, password });
      setMessage({ 
        type: 'success', 
        text: `Admin account created successfully! Save the credentials below.` 
      });

      setNewAdminEmail('');
      setNewAdminPassword('');
      setAutoGeneratePassword(true);
      
      // Reload admin list
      await loadAdmins();
    } catch (error) {
      console.error('Error adding admin:', error);
      setMessage({ type: 'danger', text: `Failed to add admin: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAdmin = async (adminId, email, uid) => {
    if (!isSuperAdmin()) {
      setMessage({ type: 'danger', text: 'Only super admin can remove admins' });
      return;
    }

    if (!window.confirm(`Remove ${email} as admin? Note: This will remove from the admin list, but you need to manually delete the user from Firebase Console > Authentication to fully remove the account.`)) {
      return;
    }

    try {
      // Delete from admins collection
      await deleteDoc(doc(db, 'admins', adminId));
      
      // Delete from admins_auth collection if uid exists
      if (uid) {
        try {
          await deleteDoc(doc(db, 'admins_auth', uid));
          console.log('Deleted from admins_auth');
        } catch (error) {
          console.error('Error deleting from admins_auth:', error);
        }
      }
      
      setMessage({ 
        type: 'success', 
        text: `${email} removed from admin list. Remember to delete from Firebase Console > Authentication > Users if needed.` 
      });
      loadAdmins();
    } catch (error) {
      console.error('Error removing admin:', error);
      setMessage({ type: 'danger', text: 'Failed to remove admin' });
    }
  };

  if (!isSuperAdmin()) {
    return (
      <div className="alert alert-warning">
        <i className="bi bi-shield-lock me-2"></i>
        Only super admin can manage administrators
      </div>
    );
  }

  return (
    <div className="card border-0 shadow-sm rounded-4">
      <div className="card-body p-4">
        <h5 className="fw-bold mb-4" style={{ color: '#222' }}>
          <i className="bi bi-people-fill me-2" style={{ color: '#FF385C' }}></i>
          Manage Administrators
        </h5>

        {/* Message Alert */}
        {message.text && (
          <div className={`alert alert-${message.type} alert-dismissible fade show`} role="alert">
            {message.text}
            <button type="button" className="btn-close" onClick={() => setMessage({ type: '', text: '' })}></button>
          </div>
        )}

        {/* Show Generated Credentials */}
        {generatedCredentials && (
          <div className="alert alert-info border-0 shadow-sm" role="alert">
            <h6 className="alert-heading fw-bold">
              <i className="bi bi-key-fill me-2"></i>
              Admin Credentials Created
            </h6>
            <hr />
            <div className="mb-2">
              <strong>Email:</strong> {generatedCredentials.email}
            </div>
            <div className="mb-3">
              <strong>Password:</strong> 
              <code className="ms-2 bg-white px-2 py-1 rounded">{generatedCredentials.password}</code>
              <button 
                className="btn btn-sm btn-outline-primary ms-2"
                onClick={() => {
                  navigator.clipboard.writeText(generatedCredentials.password);
                  alert('Password copied to clipboard!');
                }}
              >
                <i className="bi bi-clipboard"></i> Copy
              </button>
            </div>
            <small className="text-muted">
              <i className="bi bi-exclamation-circle me-1"></i>
              Please save these credentials securely. The admin will use these to log in for the first time.
            </small>
          </div>
        )}

        {/* Add Admin Form */}
        <form onSubmit={handleAddAdmin} className="mb-4">
          <div className="mb-3">
            <label className="form-label fw-semibold">Admin Email</label>
            <input
              type="email"
              className="form-control form-control-lg"
              placeholder="Enter admin email"
              value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                id="autoGeneratePassword"
                checked={autoGeneratePassword}
                onChange={(e) => setAutoGeneratePassword(e.target.checked)}
              />
              <label className="form-check-label" htmlFor="autoGeneratePassword">
                Auto-generate secure password
              </label>
            </div>
          </div>

          {!autoGeneratePassword && (
            <div className="mb-3">
              <label className="form-label fw-semibold">Password</label>
              <div className="input-group">
                <input
                  type="text"
                  className="form-control form-control-lg"
                  placeholder="Enter password (min 6 characters)"
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  required={!autoGeneratePassword}
                  minLength={6}
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setNewAdminPassword(generatePassword())}
                  title="Generate random password"
                >
                  <i className="bi bi-arrow-clockwise"></i> Generate
                </button>
              </div>
              <small className="text-muted">Password must be at least 6 characters</small>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-lg w-100"
            disabled={loading}
            style={{ 
              background: 'linear-gradient(to right, #FF385C, #E31C5F)',
              border: 'none',
              color: 'white'
            }}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Creating Admin Account...
              </>
            ) : (
              <>
                <i className="bi bi-person-plus me-2"></i>
                Create Admin Account
              </>
            )}
          </button>
        </form>

        {/* Admin List */}
        <div>
          <h6 className="text-muted mb-3">Current Administrators ({admins.length})</h6>
          {admins.length === 0 ? (
            <p className="text-muted">No additional admins added yet.</p>
          ) : (
            <div className="list-group">
              {admins.map((admin) => (
                <div key={admin.id} className="list-group-item d-flex justify-content-between align-items-center">
                  <div>
                    <i className="bi bi-person-circle me-2" style={{ color: '#FF385C' }}></i>
                    <strong>{admin.email}</strong>
                    <br />
                    <small className="text-muted">
                      Added {admin.addedAt?.toDate().toLocaleDateString() || 'Recently'}
                    </small>
                  </div>
                  <button
                    onClick={() => handleRemoveAdmin(admin.id, admin.email, admin.uid)}
                    className="btn btn-sm btn-outline-danger"
                  >
                    <i className="bi bi-trash"></i> Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Super Admin Info */}
        <div className="alert alert-info mt-4 mb-0" style={{ backgroundColor: '#E8F4F8', border: 'none' }}>
          <i className="bi bi-info-circle me-2"></i>
          <strong>Note:</strong> You are logged in as the Super Admin. Only you can add or remove other administrators.
        </div>
      </div>
    </div>
  );
}

export default ManageAdmins;
