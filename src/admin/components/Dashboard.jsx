import React from 'react';

function Dashboard({ stats, onRefresh }) {
  console.log('Dashboard received stats:', stats);
  
  return (
    <>
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="fw-bold mb-2" style={{ color: '#222' }}>Welcome back!</h2>
              <p className="text-muted mb-0">Here's what's happening with TravelMate AI today.</p>
            </div>
            <button 
              className="btn btn-outline-primary btn-sm"
              onClick={onRefresh}
            >
              <i className="bi bi-arrow-clockwise me-2"></i>
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="row g-3 g-md-4 mb-4">
        <div className="col-12 col-md-6 col-lg-4">
          <div className="card border-0 shadow-sm h-100 rounded-4" style={{ transition: 'transform 0.2s' }}>
            <div className="card-body p-3 p-md-4">
              <div className="d-flex flex-column">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div 
                    className="rounded-circle d-flex align-items-center justify-content-center"
                    style={{ 
                      width: '48px', 
                      height: '48px', 
                      backgroundColor: '#FF385C15'
                    }}
                  >
                    <i className="bi bi-people-fill" style={{ fontSize: '1.5rem', color: '#FF385C' }}></i>
                  </div>
                </div>
                <h6 className="text-muted mb-2 small">Total Users</h6>
                <h3 className="mb-0 fw-bold">{stats.totalUsers}</h3>
              </div>
            </div>
          </div>
        </div>

        {/* Bookings card removed */}

        <div className="col-12 col-md-6 col-lg-4">
          <div className="card border-0 shadow-sm h-100 rounded-4" style={{ transition: 'transform 0.2s' }}>
            <div className="card-body p-3 p-md-4">
              <div className="d-flex flex-column">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div 
                    className="rounded-circle d-flex align-items-center justify-content-center"
                    style={{ 
                      width: '48px', 
                      height: '48px', 
                      backgroundColor: '#717BA215'
                    }}
                  >
                    <i className="bi bi-geo-alt-fill" style={{ fontSize: '1.5rem', color: '#717BA2' }}></i>
                  </div>
                </div>
                <h6 className="text-muted mb-2 small">Destinations</h6>
                <h3 className="mb-0 fw-bold">{stats.totalDestinations}</h3>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6 col-lg-4">
          <div className="card border-0 shadow-sm h-100 rounded-4" style={{ transition: 'transform 0.2s' }}>
            <div className="card-body p-3 p-md-4">
              <div className="d-flex flex-column">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div 
                    className="rounded-circle d-flex align-items-center justify-content-center"
                    style={{ 
                      width: '48px', 
                      height: '48px', 
                      backgroundColor: '#FFC10715'
                    }}
                  >
                    <i className="bi bi-graph-up" style={{ fontSize: '1.5rem', color: '#FFC107' }}></i>
                  </div>
                </div>
                <h6 className="text-muted mb-2 small">Active Today</h6>
                <h3 className="mb-0 fw-bold">{stats.activeToday ?? 0}</h3>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3 g-md-4">
        {/* Recent Activity */}
        <div className="col-12">
          <div className="card border-0 shadow-sm h-100 rounded-4">
            <div className="card-body p-4">
              <h5 className="fw-bold mb-4" style={{ color: '#222' }}>
                <i className="bi bi-clock-history me-2" style={{ color: '#FF385C' }}></i>
                Recent Activity
              </h5>
              {stats.recentActivity.length === 0 ? (
                <div className="text-center py-5">
                  <div 
                    className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                    style={{ 
                      width: '80px', 
                      height: '80px', 
                      backgroundColor: '#f7f7f7'
                    }}
                  >
                    <i className="bi bi-inbox" style={{ fontSize: '2.5rem', color: '#ddd' }}></i>
                  </div>
                  <p className="text-muted">No recent activity</p>
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {stats.recentActivity.map((activity, index) => (
                    <div key={index} className="list-group-item border-0 px-0">
                      {activity}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Dashboard;
