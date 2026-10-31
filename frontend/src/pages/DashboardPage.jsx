import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/api';

const DashboardPage = () => {
  const [metrics, setMetrics] = useState({
    totalLeads: 0,
    activeLeads: 0,
    wonLeads: 0,
    pendingFollowUps: 0,
    overdueFollowUps: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/dashboard/summary');
      if (res.success && res.data) setMetrics(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  return (
    <div>
      <div className="card-header" style={{ borderBottom: 'none', padding: '0 0 20px 0' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', marginBottom: 4 }}>Sales Dashboard</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Live metrics calculated from your real CRM database records.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={fetchSummary} className="btn btn-secondary btn-sm" disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          <Link to="/leads" className="btn btn-primary btn-sm">
            View Leads
          </Link>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger">
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center' }}>
          <div className="spinner-dark"></div>
        </div>
      ) : (
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-header">
              <span className="metric-title">Total Leads</span>
            </div>
            <div className="metric-value">{metrics.totalLeads}</div>
            <span className="form-hint" style={{ marginTop: 6 }}>All saved leads</span>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <span className="metric-title">Active Leads</span>
            </div>
            <div className="metric-value">{metrics.activeLeads}</div>
            <span className="form-hint" style={{ marginTop: 6 }}>Excludes Won / Lost</span>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <span className="metric-title">Won Leads</span>
            </div>
            <div className="metric-value">{metrics.wonLeads}</div>
            <span className="form-hint" style={{ marginTop: 6 }}>Successfully closed</span>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <span className="metric-title">Pending Follow-ups</span>
            </div>
            <div className="metric-value">{metrics.pendingFollowUps}</div>
            <span className="form-hint" style={{ marginTop: 6 }}>Scheduled activities</span>
          </div>

          <div className={`metric-card ${metrics.overdueFollowUps > 0 ? 'alert-card' : ''}`}>
            <div className="metric-header">
              <span className="metric-title">Overdue Follow-ups</span>
            </div>
            <div className="metric-value">{metrics.overdueFollowUps}</div>
            <span className="form-hint" style={{ marginTop: 6 }}>Past due server time</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
