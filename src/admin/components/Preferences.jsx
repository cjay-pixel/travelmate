import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';

function Preferences() {
  const [preferences, setPreferences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [formData, setFormData] = useState({
    title: '',
    image: '',
    imageFilename: '',
    tags: '',
    order: 0
  });

  const BASE_IMAGE_URL = 'https://raw.githubusercontent.com/cjay-pixel/travelmate/main/public/';

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const preferencesRef = collection(db, 'preferences');
      const snapshot = await getDocs(preferencesRef);
      
      const preferencesList = [];
      snapshot.forEach((doc) => {
        preferencesList.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      preferencesList.sort((a, b) => (a.order || 0) - (b.order || 0));
      setPreferences(preferencesList);
    } catch (error) {
      console.error('Error loading preferences:', error);
      setMessage({ type: 'danger', text: 'Failed to load preferences' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    try {
      const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      const fullImageUrl = BASE_IMAGE_URL + formData.imageFilename;
      
      const preferenceData = {
        title: formData.title,
        image: fullImageUrl,
        tags: tagsArray,
        order: parseInt(formData.order) || 0,
        updatedAt: serverTimestamp()
      };

      if (editingId) {
        await updateDoc(doc(db, 'preferences', editingId), preferenceData);
        setMessage({ type: 'success', text: 'Preference updated successfully!' });
      } else {
        await addDoc(collection(db, 'preferences'), {
          ...preferenceData,
          createdAt: serverTimestamp()
        });
        setMessage({ type: 'success', text: 'Preference added successfully!' });
      }
      
      setFormData({ title: '', image: '', imageFilename: '', tags: '', order: 0 });
      setShowAddForm(false);
      setEditingId(null);
      loadPreferences();
    } catch (error) {
      console.error('Error saving preference:', error);
      setMessage({ type: 'danger', text: `Failed to save preference: ${error.message}` });
    }
  };

  const handleDelete = async (preferenceId, title) => {
    if (!window.confirm(`Delete "${title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'preferences', preferenceId));
      setMessage({ type: 'success', text: 'Preference deleted successfully' });
      loadPreferences();
    } catch (error) {
      console.error('Error deleting preference:', error);
      setMessage({ type: 'danger', text: 'Failed to delete preference' });
    }
  };

  const handleEdit = (preference) => {
    // Extract filename from full URL if it contains the base URL
    const imageFilename = preference.image.replace(BASE_IMAGE_URL, '');
    
    setFormData({
      title: preference.title,
      image: preference.image,
      imageFilename: imageFilename,
      tags: preference.tags?.join(', ') || '',
      order: preference.order || 0
    });
    setEditingId(preference.id);
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setFormData({ title: '', image: '', imageFilename: '', tags: '', order: 0 });
    setEditingId(null);
    setShowAddForm(false);
  };

  if (loading) {
    return (
      <div className="card border-0 shadow-sm rounded-4">
        <div className="card-body p-4 text-center">
          <div className="spinner-border" style={{ color: '#FF385C' }} role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card border-0 shadow-sm rounded-4">
      <div className="card-body p-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h5 className="fw-bold mb-0" style={{ color: '#222' }}>
            <i className="bi bi-grid-3x3-gap-fill me-2" style={{ color: '#FF385C' }}></i>
            Preferences Management
          </h5>
          <button 
            className="btn btn-danger"
            onClick={() => {
              if (showAddForm && editingId) {
                handleCancelEdit();
              } else {
                setShowAddForm(!showAddForm);
              }
            }}
            style={{ background: 'linear-gradient(to right, #FF385C, #E31C5F)', border: 'none' }}
          >
            <i className={`bi ${showAddForm ? 'bi-x-lg' : 'bi-plus-lg'} me-2`}></i>
            {showAddForm ? 'Cancel' : 'Add Preference'}
          </button>
        </div>

        {message.text && (
          <div className={`alert alert-${message.type} alert-dismissible fade show`} role="alert">
            <i className={`bi ${message.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-2`}></i>
            {message.text}
            <button type="button" className="btn-close" onClick={() => setMessage({ type: '', text: '' })}></button>
          </div>
        )}

        {showAddForm && (
          <div className="card mb-4" style={{ backgroundColor: '#f8f9fa' }}>
            <div className="card-body p-4">
              <h6 className="fw-bold mb-3">
                {editingId ? 'Edit Preference' : 'Add New Preference'}
              </h6>
              <form onSubmit={handleSubmit}>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold">Preference Title *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g., Nature Exploration"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold">Display Order</label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="0"
                      value={formData.order}
                      onChange={(e) => setFormData({ ...formData, order: e.target.value })}
                    />
                    <small className="text-muted">Lower numbers appear first</small>
                  </div>

                  <div className="col-12 mb-3">
                    <label className="form-label fw-semibold">Image Filename *</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light" style={{ fontSize: '0.85rem' }}>
                        {BASE_IMAGE_URL}
                      </span>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="CITY%20EXPLORATION.jpg"
                        value={formData.imageFilename}
                        onChange={(e) => setFormData({ ...formData, imageFilename: e.target.value })}
                        required
                      />
                    </div>
                    <small className="text-muted">
                      💡 Just enter the filename (e.g., BEACH%20PARADISE.jpg). Use %20 for spaces.
                    </small>
                    {formData.imageFilename && (
                      <div className="mt-2">
                        <small className="text-success">
                          <i className="bi bi-link-45deg me-1"></i>
                          Full URL: {BASE_IMAGE_URL}{formData.imageFilename}
                        </small>
                      </div>
                    )}
                  </div>

                  <div className="col-12 mb-3">
                    <label className="form-label fw-semibold">Tags *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="nature, wildlife, eco, adventure"
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      required
                    />
                    <small className="text-muted">Comma-separated tags for matching with destinations</small>
                  </div>
                </div>

                <div className="d-flex gap-2">
                  <button
                    type="submit"
                    className="btn btn-danger"
                    style={{ background: 'linear-gradient(to right, #FF385C, #E31C5F)', border: 'none' }}
                  >
                    <i className={`bi ${editingId ? 'bi-check-circle' : 'bi-plus-circle'} me-2`}></i>
                    {editingId ? 'Update Preference' : 'Add Preference'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={handleCancelEdit}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div>
          <h6 className="text-muted mb-3">
            All Preferences ({preferences.length})
          </h6>

          {preferences.length === 0 ? (
            <div className="text-center py-5">
              <div 
                className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                style={{ 
                  width: '80px', 
                  height: '80px', 
                  backgroundColor: '#f7f7f7'
                }}
              >
                <i className="bi bi-grid-3x3-gap" style={{ fontSize: '2.5rem', color: '#ddd' }}></i>
              </div>
              <p className="text-muted">No preferences added yet</p>
            </div>
          ) : (
            <div className="row g-3">
              {preferences.map((preference) => (
                <div key={preference.id} className="col-6 col-md-4 col-lg-3">
                  <div className="card border-0 shadow-sm h-100">
                    <img 
                      src={preference.image} 
                      className="card-img-top" 
                      alt={preference.title}
                      style={{ height: '150px', objectFit: 'cover' }}
                    />
                    <div className="card-body p-3">
                      <h6 className="card-title mb-2 fw-bold">{preference.title}</h6>
                      <div className="d-flex flex-wrap gap-1 mb-2">
                        {preference.tags?.slice(0, 2).map((tag, idx) => (
                          <span key={idx} className="badge bg-light text-dark border" style={{ fontSize: '0.7rem' }}>
                            {tag}
                          </span>
                        ))}
                        {preference.tags?.length > 2 && (
                          <span className="badge bg-secondary" style={{ fontSize: '0.7rem' }}>
                            +{preference.tags.length - 2}
                          </span>
                        )}
                      </div>
                      <small className="text-muted">Order: {preference.order || 0}</small>
                    </div>
                    <div className="card-footer bg-white border-0 p-2">
                      <div className="d-flex gap-1">
                        <button
                          className="btn btn-sm btn-outline-primary flex-grow-1"
                          onClick={() => handleEdit(preference)}
                        >
                          <i className="bi bi-pencil me-1"></i>
                          Edit
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDelete(preference.id, preference.title)}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Preferences;
