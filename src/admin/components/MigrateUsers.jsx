import React, { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../firebase';

function MigrateUsers() {
  const [migrating, setMigrating] = useState(false);
  const [result, setResult] = useState('');

  const migrateAllUsers = async () => {
    setMigrating(true);
    setResult('');

    try {
      const migrateFunction = httpsCallable(functions, 'migrateAuthUsersToFirestore');
      const response = await migrateFunction();
      
      setResult(`✅ ${response.data.message}`);
      
      // Reload the page after 2 seconds to show the migrated users
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Migration error:', error);
      setResult(`❌ Error: ${error.message}`);
    } finally {
      setMigrating(false);
    }
  };

  return (
    <div className="card border-0 shadow-sm rounded-4 mb-4">
      <div className="card-body p-4">
        <h5 className="fw-bold mb-3" style={{ color: '#222' }}>
          <i className="bi bi-database-fill-add me-2" style={{ color: '#FF385C' }}></i>
          User Migration Tool
        </h5>
        
        <div className="alert alert-warning" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          <strong>Super Admin Only:</strong> This will migrate all Firebase Authentication users to Firestore database.
        </div>

        <p className="text-muted mb-3">
          Click the button below to automatically import all existing Firebase Authentication users into the Firestore database.
          This only needs to be done once.
        </p>

        <button
          className="btn btn-primary"
          onClick={migrateAllUsers}
          disabled={migrating}
          style={{ backgroundColor: '#FF385C', border: 'none' }}
        >
          {migrating ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Migrating All Users...
            </>
          ) : (
            <>
              <i className="bi bi-arrow-repeat me-2"></i>
              Migrate All Auth Users to Firestore
            </>
          )}
        </button>

        {result && (
          <div className={`alert mt-3 ${result.includes('✅') ? 'alert-success' : 'alert-danger'}`} role="alert">
            {result}
          </div>
        )}
      </div>
    </div>
  );
}

export default MigrateUsers;
