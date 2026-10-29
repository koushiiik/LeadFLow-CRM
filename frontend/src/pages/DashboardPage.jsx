import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/api';
import {
  Users,
  Activity as ActivityIcon,
  Award,
  Clock,
  AlertTriangle,
  RefreshCw,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';

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
            <RefreshCw size={14} className={loading ? 'spinner' : ''} />
            <span>Refresh</span>
          </button>
          <Link to="/leads" className="btn btn-primary btn-sm">
            <span>View Leads</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger">
          <AlertCircle size={16} />
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
              <div className="metric-icon-wrap" style={{ background: '#eef2ff', color: '#4f46e5' }}>
                <Users size={18} />
              </div>
            </div>
            <div className="metric-value">{metrics.totalLeads}</div>
            <span className="form-hint" style={{ marginTop: 6 }}>All saved leads</span>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <span className="metric-title">Active Leads</span>
              <div className="metric-icon-wrap" style={{ background: '#f0fdf4', color: '#16a34a' }}>
                <ActivityIcon size={18} />
              </div>
            </div>
            <div className="metric-value">{metrics.activeLeads}</div>
            <span className="form-hint" style={{ marginTop: 6 }}>Excludes Won / Lost</span>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <span className="metric-title">Won Leads</span>
              <div className="metric-icon-wrap" style={{ background: '#ecfdf5', color: '#059669' }}>
                <Award size={18} />
              </div>
            </div>
            <div className="metric-value">{metrics.wonLeads}</div>
            <span className="form-hint" style={{ marginTop: 6 }}>Successfully closed</span>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <span className="metric-title">Pending Follow-ups</span>
              <div className="metric-icon-wrap" style={{ background: '#fffbeb', color: '#d97706' }}>
                <Clock size={18} />
              </div>
            </div>
            <div className="metric-value">{metrics.pendingFollowUps}</div>
            <span className="form-hint" style={{ marginTop: 6 }}>Scheduled activities</span>
          </div>

          <div className={`metric-card ${metrics.overdueFollowUps > 0 ? 'alert-card' : ''}`}>
            <div className="metric-header">
              <span className="metric-title">Overdue Follow-ups</span>
              <div
                className="metric-icon-wrap"
                style={{
                  background: metrics.overdueFollowUps > 0 ? '#fef2f2' : '#f8fafc',
                  color: metrics.overdueFollowUps > 0 ? '#dc2626' : '#94a3b8',
                }}
              >
                <AlertTriangle size={18} />
              </div>
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
