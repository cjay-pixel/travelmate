import React from 'react';

function Messages() {
  return (
    <div className="card border-0 shadow-sm rounded-4">
      <div className="card-body p-4">
        <h5 className="fw-bold mb-4" style={{ color: '#222' }}>
          <i className="bi bi-chat-dots me-2" style={{ color: '#FF385C' }}></i>
          Messages
        </h5>
        <p className="text-muted">Message center coming soon...</p>
      </div>
    </div>
  );
}

export default Messages;
