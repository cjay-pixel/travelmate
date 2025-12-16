import React, { useState, useEffect, useRef } from 'react';
import { db, storage } from '../../../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

function Destinations() {
  const [destinations, setDestinations] = useState([]);
  const [preferences, setPreferences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Form states
  const [formData, setFormData] = useState({
    destinationName: '',
    cityName: '',
    regionName: '',
    description: '',
    category: [],
    budget: '',
    rating: 5,
    images: []
  });
  const [imageFile1, setImageFile1] = useState(null);
  const [imageFile2, setImageFile2] = useState(null);
  const [imageFile3, setImageFile3] = useState(null);
  const [uploading, setUploading] = useState(false);
  const formRef = useRef(null);

  useEffect(() => {
    loadDestinations();
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const preferencesRef = collection(db, 'preferences');
      const snapshot = await getDocs(preferencesRef);
      
      const preferencesList = [];
      snapshot.forEach((doc) => {
        preferencesList.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // Sort by order and extract titles for category options
      preferencesList.sort((a, b) => (a.order || 0) - (b.order || 0));
      setPreferences(preferencesList);
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const loadDestinations = async () => {
    try {
      setLoading(true);
      const destinationsRef = collection(db, 'destinations');
      const snapshot = await getDocs(destinationsRef);
      
      const destinationsList = [];
      snapshot.forEach((doc) => {
        const data = doc.data() || {};

        // Normalize images: prefer an `images` array, otherwise gather legacy fields
        let images = [];
        // Start with any existing images array
        if (Array.isArray(data.images) && data.images.length > 0) {
          images = data.images.slice();
        }

        // Collect common legacy field names in likely order and merge them
        const legacyFields = [
          'imageUrl', 'image', 'image1', 'image_1', 'image01', 'mainImage',
          'imageUrl2', 'image2', 'image_2', 'imageUrl3', 'image3', 'image_3',
          'photo1', 'photo2', 'photo3'
        ];

        for (const key of legacyFields) {
          const val = data[key];
          if (val) {
            // Only add if not already present
            if (!images.includes(val)) images.push(val);
          }
        }

        // Remove falsy values and keep order
        images = (images || []).filter(Boolean);

        // Debug: log document fields and resulting images array to help troubleshoot
        try {
          // eslint-disable-next-line no-console
          console.log('[Destinations] doc:', doc.id, 'fields:', Object.keys(data), '-> images:', images);
        } catch (e) {
          // ignore logging errors in environments that restrict console
        }

        destinationsList.push({
          id: doc.id,
          ...data,
          images
        });
      });
      
      setDestinations(destinationsList);
    } catch (error) {
      console.error('Error loading destinations:', error);
      setMessage({ type: 'danger', text: 'Failed to load destinations' });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file) => {
    const storageRef = ref(storage, `destinations/${Date.now()}_${file.name}`);
    
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    setMessage({ type: '', text: '' });

    try {
      // prepare images: upload files if provided, otherwise use URLs from formData.images
      const finalImages = [formData.images?.[0] || '', formData.images?.[1] || '', formData.images?.[2] || ''];
      if (imageFile1) {
        try {
          const url1 = await handleImageUpload(imageFile1);
          finalImages[0] = url1;
        } catch (err) {
          console.error('Failed uploading image 1', err);
        }
      }
      if (imageFile2) {
        try {
          const url2 = await handleImageUpload(imageFile2);
          finalImages[1] = url2;
        } catch (err) {
          console.error('Failed uploading image 2', err);
        }
      }
      if (imageFile3) {
        try {
          const url3 = await handleImageUpload(imageFile3);
          finalImages[2] = url3;
        } catch (err) {
          console.error('Failed uploading image 3', err);
        }
      }

      // Ensure at least one image
      if (!finalImages[0]) {
        throw new Error('Please provide at least one image (URL or upload) for the destination.');
      }
      if (editingId) {
        // Update existing destination
        await updateDoc(doc(db, 'destinations', editingId), {
          destinationName: formData.destinationName,
          cityName: formData.cityName,
          regionName: formData.regionName,
          description: formData.description,
          category: formData.category,
          budget: formData.budget,
          rating: parseFloat(formData.rating),
          images: finalImages.filter(Boolean),
          updatedAt: serverTimestamp()
        });

        setMessage({ type: 'success', text: 'Destination updated successfully!' });
      } else {
        // Add new destination
        await addDoc(collection(db, 'destinations'), {
          destinationName: formData.destinationName,
          cityName: formData.cityName,
          regionName: formData.regionName,
          description: formData.description,
          category: formData.category,
          budget: formData.budget,
          rating: parseFloat(formData.rating),
          images: finalImages.filter(Boolean),
          createdAt: serverTimestamp(),
          status: 'active'
        });

        setMessage({ type: 'success', text: 'Destination added successfully!' });
      }
      
      // Reset form
      setFormData({
        destinationName: '',
        cityName: '',
        regionName: '',
        description: '',
        category: [],
        budget: '',
        rating: 5,
        images: []
      });
      setImageFile1(null);
      setImageFile2(null);
      setImageFile3(null);
      setShowAddForm(false);
      setEditingId(null);
      
      // Reload destinations
      loadDestinations();
    } catch (error) {
      console.error('Error saving destination:', error);
      setMessage({ type: 'danger', text: `Failed to save destination: ${error.message}` });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (destinationId, name) => {
    if (!window.confirm(`Delete "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'destinations', destinationId));
      setMessage({ type: 'success', text: 'Destination deleted successfully' });
      loadDestinations();
    } catch (error) {
      console.error('Error deleting destination:', error);
      setMessage({ type: 'danger', text: 'Failed to delete destination' });
    }
  };

  const handleEdit = (destination) => {
    setFormData({
      destinationName: destination.destinationName,
      cityName: destination.cityName,
      regionName: destination.regionName,
      description: destination.description,
      category: destination.category || [],
      budget: destination.budget,
      rating: destination.rating,
      images: [
        (destination.images && destination.images[0]) || '',
        (destination.images && destination.images[1]) || '',
        (destination.images && destination.images[2]) || ''
      ]
    });
    setEditingId(destination.id);
    setShowAddForm(true);
  };

  // Scroll the add/edit form into view whenever it is shown (for edit or add)
  useEffect(() => {
    if (showAddForm && formRef.current) {
      // small delay to ensure the element is rendered
      setTimeout(() => {
        try {
          formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } catch (e) {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 50);
    }
  }, [showAddForm]);

  const handleCancelEdit = () => {
    setFormData({
      destinationName: '',
      cityName: '',
      regionName: '',
      description: '',
      category: [],
      budget: '',
      rating: 5,
      images: []
    });
    setEditingId(null);
    setShowAddForm(false);
  };

  const handleCategoryToggle = (category) => {
    setFormData(prev => ({
      ...prev,
      category: prev.category.includes(category)
        ? prev.category.filter(c => c !== category)
        : [...prev.category, category]
    }));
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
            <i className="bi bi-geo-alt-fill me-2" style={{ color: '#FF385C' }}></i>
            Destinations Management
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
            {showAddForm ? 'Cancel' : 'Add Destination'}
          </button>
        </div>

        {/* Message Alert */}
        {message.text && (
          <div className={`alert alert-${message.type} alert-dismissible fade show`} role="alert">
            <i className={`bi ${message.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-2`}></i>
            {message.text}
            <button type="button" className="btn-close" onClick={() => setMessage({ type: '', text: '' })}></button>
          </div>
        )}

        {/* Add/Edit Destination Form */}
        {showAddForm && (
          <div ref={formRef} className="card mb-4" style={{ backgroundColor: '#f8f9fa' }}>
            <div className="card-body p-4">
              <h6 className="fw-bold mb-3">
                {editingId ? 'Edit Destination' : 'Add New Destination'}
              </h6>
              <form onSubmit={handleSubmit}>
                <div className="row">
                  <div className="col-md-4 mb-3">
                    <label className="form-label fw-semibold">Destination Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g., El Nido Beach"
                      value={formData.destinationName}
                      onChange={(e) => setFormData({ ...formData, destinationName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="col-md-4 mb-3">
                    <label className="form-label fw-semibold">City Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g., El Nido"
                      value={formData.cityName}
                      onChange={(e) => setFormData({ ...formData, cityName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="col-md-4 mb-3">
                    <label className="form-label fw-semibold">Region Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g., Palawan"
                      value={formData.regionName}
                      onChange={(e) => setFormData({ ...formData, regionName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold">Budget Range *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g., ₱10,000 - ₱20,000"
                      value={formData.budget}
                      onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                      required
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold">Rating *</label>
                    <div className="d-flex align-items-center gap-2">
                      <input
                        type="number"
                        className="form-control"
                        min="0"
                        max="5"
                        step="0.1"
                        value={formData.rating}
                        onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                        required
                      />
                      <span className="text-muted">/ 5.0</span>
                    </div>
                  </div>

                  <div className="col-12 mb-3">
                    <label className="form-label fw-semibold">Description *</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      placeholder="Brief description of the destination..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      required
                    ></textarea>
                  </div>

                  <div className="col-12 mb-3">
                    <label className="form-label fw-semibold">Image URL *</label>
                    <div className="mb-2">
                      <input
                        type="url"
                        className="form-control mb-2"
                        placeholder="Main image URL (required)"
                        value={formData.images[0] || ''}
                        onChange={(e) => setFormData({ ...formData, images: [e.target.value, formData.images[1], formData.images[2]] })}
                        required
                      />
                      <input
                        type="file"
                        accept="image/*"
                        className="form-control"
                        onChange={(e) => setImageFile1(e.target.files?.[0] || null)}
                      />
                    </div>

                    <div className="mb-2">
                      <input
                        type="url"
                        className="form-control mb-2"
                        placeholder="Optional image URL 2"
                        value={formData.images[1] || ''}
                        onChange={(e) => setFormData({ ...formData, images: [formData.images[0], e.target.value, formData.images[2]] })}
                      />
                      <input
                        type="file"
                        accept="image/*"
                        className="form-control"
                        onChange={(e) => setImageFile2(e.target.files?.[0] || null)}
                      />
                    </div>

                    <div>
                      <input
                        type="url"
                        className="form-control mb-2"
                        placeholder="Optional image URL 3"
                        value={formData.images[2] || ''}
                        onChange={(e) => setFormData({ ...formData, images: [formData.images[0], formData.images[1], e.target.value] })}
                      />
                      <input
                        type="file"
                        accept="image/*"
                        className="form-control"
                        onChange={(e) => setImageFile3(e.target.files?.[0] || null)}
                      />
                    </div>
                    <small className="text-muted">
                      💡 Tip: Right-click any image online → "Copy image address" → Paste here
                      <br />
                      Or use free image hosting: <a href="https://imgur.com" target="_blank" rel="noopener noreferrer">Imgur</a>, <a href="https://postimages.org" target="_blank" rel="noopener noreferrer">PostImages</a>
                    </small>
                  </div>

                  <div className="col-12 mb-3">
                    <label className="form-label fw-semibold">Categories *</label>
                    <div className="row g-2">
                      {preferences.length > 0 ? (
                        preferences.map((preference) => (
                          <div key={preference.id} className="col-md-4 col-lg-3">
                            <div
                              className={`p-2 rounded text-center cursor-pointer ${
                                formData.category.includes(preference.title)
                                  ? 'bg-danger text-white'
                                  : 'bg-light'
                              }`}
                              onClick={() => handleCategoryToggle(preference.title)}
                              style={{ cursor: 'pointer', fontSize: '0.875rem' }}
                            >
                              {preference.title}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="col-12">
                          <p className="text-muted mb-0">
                            <i className="bi bi-info-circle me-2"></i>
                            No preferences available. Please add preferences first in the Preferences section.
                          </p>
                        </div>
                      )}
                    </div>
                    <small className="text-muted">Click to select/deselect categories</small>
                  </div>
                </div>

                <div className="d-flex gap-2">
                  <button
                    type="submit"
                    className="btn btn-danger"
                    disabled={uploading}
                    style={{ background: 'linear-gradient(to right, #FF385C, #E31C5F)', border: 'none' }}
                  >
                    {uploading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <i className={`bi ${editingId ? 'bi-check-circle' : 'bi-plus-circle'} me-2`}></i>
                        {editingId ? 'Update Destination' : 'Add Destination'}
                      </>
                    )}
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

        {/* Destinations List */}
        <div>
          <h6 className="text-muted mb-3">
            All Destinations ({destinations.length})
          </h6>

          {destinations.length === 0 ? (
            <div className="text-center py-5">
              <div 
                className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                style={{ 
                  width: '80px', 
                  height: '80px', 
                  backgroundColor: '#f7f7f7'
                }}
              >
                <i className="bi bi-geo-alt" style={{ fontSize: '2.5rem', color: '#ddd' }}></i>
              </div>
              <p className="text-muted">No destinations added yet</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead style={{ backgroundColor: '#f7f7f7' }}>
                  <tr>
                    <th className="border-0 py-3">Image</th>
                    <th className="border-0 py-3">Destination</th>
                    <th className="border-0 py-3">City</th>
                    <th className="border-0 py-3">Region</th>
                    <th className="border-0 py-3">Categories</th>
                    <th className="border-0 py-3">Rating</th>
                    <th className="border-0 py-3">Budget</th>
                    <th className="border-0 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {destinations.map((destination) => (
                    <tr key={destination.id}>
                      <td>
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                          <img
                            src={(destination.images && destination.images[0]) || 'https://via.placeholder.com/100x60?text=No+Image'}
                            alt={destination.destinationName}
                            style={{ 
                              width: '100px', 
                              height: '60px', 
                              objectFit: 'cover', 
                              borderRadius: '8px' 
                            }}
                          />
                          {destination.images && destination.images.length > 1 && (
                            <span className="badge bg-secondary" style={{ position: 'absolute', bottom: 4, right: 4, fontSize: '0.65rem' }}>
                              +{destination.images.length - 1}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="fw-semibold">{destination.destinationName}</div>
                        <small className="text-muted">{destination.description?.substring(0, 50)}...</small>
                      </td>
                      <td>{destination.cityName}</td>
                      <td>{destination.regionName}</td>
                      <td>
                        <div className="d-flex flex-wrap gap-1">
                          {destination.category?.slice(0, 2).map((cat, index) => (
                            <span 
                              key={index} 
                              className="badge" 
                              style={{ 
                                backgroundColor: '#FF385C15', 
                                color: '#FF385C', 
                                fontSize: '0.7rem' 
                              }}
                            >
                              {cat}
                            </span>
                          ))}
                          {destination.category?.length > 2 && (
                            <span className="badge bg-secondary" style={{ fontSize: '0.7rem' }}>
                              +{destination.category.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="badge bg-warning text-dark">
                          <i className="bi bi-star-fill me-1"></i>
                          {destination.rating}
                        </span>
                      </td>
                      <td>
                        <small className="text-muted">{destination.budget}</small>
                      </td>
                      <td>
                        <div className="d-flex gap-1">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleEdit(destination)}
                            title="Edit"
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDelete(destination.id, destination.destinationName)}
                            title="Delete"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Destinations;
