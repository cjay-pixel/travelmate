import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';

function ProfilePage({ user, onNavigate }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    displayName: '',
    phone: ''
  });

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      try {
        const ref = doc(db, 'users', user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          setForm({
            displayName: data.displayName || user.displayName || '',
            phone: data.phone || ''
          });
        } else {
          setForm({
            displayName: user.displayName || '',
            phone: ''
          });
        }
      } catch (err) {
        console.error('Failed to load profile', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user) return alert('Please log in to save your profile.');
    setSaving(true);
    try {
      const ref = doc(db, 'users', user.uid);
      await setDoc(ref, {
        displayName: form.displayName || null,
        phone: form.phone || null,
        updatedAt: serverTimestamp()
      }, { merge: true });
      alert('Profile saved');
    } catch (err) {
      console.error('Failed to save profile', err);
      alert('Failed to save profile: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="min-vh-100 d-flex flex-column">
        <Header user={null} onNavigate={onNavigate} />
        <div className="flex-grow-1 d-flex align-items-center justify-content-center">
          <div className="text-center p-4">
            <h3>Please sign in</h3>
            <p className="text-muted">You must be signed in to view and edit your profile.</p>
            <button className="btn btn-primary" onClick={() => onNavigate && onNavigate('home')}>Go Home</button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div>
      <Header user={user} onNavigate={onNavigate} />
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-md-8">
            <div className="card shadow-sm border-0">
              <div className="card-body p-4">
                <h3 className="fw-bold mb-3">Your Profile</h3>
                <p className="text-muted">Manage your public profile information.</p>

                <form onSubmit={handleSave}>
                  <div className="mb-3">
                    <label className="form-label">Display name</label>
                    <input className="form-control" value={form.displayName} onChange={(e) => handleChange('displayName', e.target.value)} />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input className="form-control" value={user.email} disabled />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Phone</label>
                    <input className="form-control" value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} />
                  </div>

                    {/* Location, Bio, and Avatar URL fields removed by request */}

                  <div className="d-flex gap-2">
                    <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Profile'}</button>
                    <button className="btn btn-outline-secondary" type="button" onClick={() => { if (onNavigate) onNavigate('home'); }}>Cancel</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default ProfilePage;
