 import React, { useState, useEffect } from 'react';
import { db, rtdb } from '../../../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { ref as rtdbRef, onValue as onRtdbValue } from 'firebase/database';

const SUPER_ADMIN_EMAIL = "superadmin@gmail.com";

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statuses, setStatuses] = useState({});

  useEffect(() => {
    fetchUsers();
    // subscribe to realtime presence
    try {
      const statusRef = rtdbRef(rtdb, 'status');
      const unsubscribeStatus = onRtdbValue(statusRef, (snap) => {
        setStatuses(snap.val() || {});
      });

      return () => {
        if (unsubscribeStatus) unsubscribeStatus();
      };
    } catch (err) {
      // RTDB may not be available in some environments; ignore
      console.warn('RTDB presence subscription failed', err);
    }
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // Fetch from 'users' collection (only regular users, no admins)
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      
      const usersList = [];
      snapshot.forEach((doc) => {
        const userData = doc.data();
        // All documents in 'users' collection are regular users
        // Derive `active` from `lastActive` recency (2 minutes)
        const lastActive = userData?.lastActive;
        const ACTIVE_THRESHOLD_MS = 2 * 60 * 1000; // 2 minutes
        let isActive = false;
        if (lastActive && lastActive.seconds) {
          const last = new Date(lastActive.seconds * 1000).getTime();
          if (Date.now() - last <= ACTIVE_THRESHOLD_MS) isActive = true;
        }
        usersList.push({
          id: doc.id,
          ...userData,
          active: isActive,
          lastActive
        });
      });
      
      setUsers(usersList);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
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
            <i className="bi bi-people me-2" style={{ color: '#FF385C' }}></i>
            User Management
          </h5>
          <span className="badge rounded-pill px-3 py-2" style={{ backgroundColor: '#FF385C15', color: '#FF385C' }}>
            {users.length} {users.length === 1 ? 'User' : 'Users'}
          </span>
        </div>

        {error && (
          <div className="alert alert-danger" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {error}
          </div>
        )}

        {users.length === 0 ? (
          <div className="text-center py-5">
            <div 
              className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
              style={{ 
                width: '80px', 
                height: '80px', 
                backgroundColor: '#f7f7f7'
              }}
            >
              <i className="bi bi-people" style={{ fontSize: '2.5rem', color: '#ddd' }}></i>
            </div>
            <p className="text-muted">No users found</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead style={{ backgroundColor: '#f7f7f7' }}>
                <tr>
                  <th className="border-0 py-3">User</th>
                  <th className="border-0 py-3">Email</th>
                  <th className="border-0 py-3">Created</th>
                  <th className="border-0 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="d-flex align-items-center">
                        <div 
                          className="rounded-circle d-flex align-items-center justify-content-center me-3"
                          style={{ 
                            width: '40px', 
                            height: '40px', 
                            backgroundColor: '#FF385C15'
                          }}
                        >
                          <i className="bi bi-person-fill" style={{ color: '#FF385C' }}></i>
                        </div>
                        <div>
                          <div className="fw-semibold">
                            {user.displayName || user.email?.split('@')[0] || 'User'}
                          </div>
                          <small className="text-muted">ID: {user.id.substring(0, 8)}...</small>
                        </div>
                      </div>
                    </td>
                    <td>{user.email || 'N/A'}</td>
                    <td>
                      {user.createdAt ? (
                        new Date(user.createdAt.seconds * 1000).toLocaleDateString()
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td>
                      {(() => {
                        const status = statuses?.[user.id];
                        const isOnline = status?.state === 'online';
                        const displayedActive = isOnline || !!user.active;
                        const title = status?.last_changed
                          ? new Date(status.last_changed).toLocaleString()
                          : user.lastActive
                          ? new Date(user.lastActive.seconds * 1000).toLocaleString()
                          : 'No activity recorded';

                        return (
                          <span
                            className="badge rounded-pill px-3 py-2"
                            style={{
                              backgroundColor: displayedActive ? '#00848515' : '#6c757d15',
                              color: displayedActive ? '#008485' : '#6c757d'
                            }}
                            title={title}
                          >
                            {displayedActive ? 'Active' : 'Inactive'}
                          </span>
                        );
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Users;
