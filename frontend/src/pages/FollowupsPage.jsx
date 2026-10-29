import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/api';
import Modal from '../components/Modal';
import { CalendarCheck, Plus, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

const ACTIVITY_TYPES = ['Call', 'Email', 'Meeting', 'Task'];

const FollowupsPage = () => {
  const [activities, setActivities] = useState([]);
  const [leadsList, setLeadsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ leadId: '', title: '', type: 'Call', dueAt: '' });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter === 'Pending') params.status = 'Pending';
      if (statusFilter === 'Completed') params.status = 'Completed';
      const res = await api.get('/activities', { params });
      if (res.success && res.data) setActivities(res.data.activities || []);
    } catch (err) {
      setError(err.message || 'Failed to load follow-ups');
    } finally {
      setLoading(false);
    }
  };

  const fetchLeads = async () => {
    try {
      const res = await api.get('/leads');
      if (res.success && res.data?.leads) {
        setLeadsList(res.data.leads);
        if (res.data.leads.length > 0 && !formData.leadId) {
          setFormData((prev) => ({ ...prev, leadId: res.data.leads[0]._id }));
        }
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchActivities();
    fetchLeads();
  }, [statusFilter]);

  const handleToggleStatus = async (activity) => {
    const newStatus = activity.status === 'Completed' ? 'Pending' : 'Completed';
    try {
      const res = await api.patch(`/activities/${activity._id}`, { status: newStatus });
      if (res.success && res.data?.activity) {
        setActivities((prev) => prev.map((act) => (act._id === activity._id ? res.data.activity : act)));
      }
    } catch (err) {
      alert(`Could not update follow-up: ${err.message}`);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.leadId) return setFormError('Please select a lead');
    if (!formData.title?.trim()) return setFormError('Follow-up title is required');
    if (!formData.dueAt) return setFormError('Due date and time is required');

    setSubmitting(true);
    try {
      const res = await api.post('/activities', {
        ...formData,
        dueAt: new Date(formData.dueAt).toISOString(),
      });
      if (res.success) {
        setIsModalOpen(false);
        setFormData({ leadId: leadsList[0]?._id || '', title: '', type: 'Call', dueAt: '' });
        fetchActivities();
      }
    } catch (err) {
      setFormError(err.message || 'Failed to create follow-up');
    } finally {
      setSubmitting(false);
    }
  };

  const displayedActivities = activities.filter((act) => {
    if (statusFilter === 'Overdue') {
      return act.status === 'Pending' && new Date(act.dueAt) < new Date();
    }
    return true;
  });

  return (
    <div>
      <div className="card-header" style={{ borderBottom: 'none', padding: '0 0 16px 0' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', marginBottom: 4 }}>Follow-ups</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Track client calls, meetings, emails, and tasks.</p>
        </div>
        <button
          onClick={() => { setFormError(''); fetchLeads(); setIsModalOpen(true); }}
          className="btn btn-primary"
          disabled={leadsList.length === 0}
        >
          <Plus size={16} /> <span>Schedule Follow-up</span>
        </button>
      </div>

      {error && <div className="alert alert-danger"><AlertCircle size={16} /> <span>{error}</span></div>}

      <div className="toolbar">
        <div style={{ display: 'flex', gap: 6 }}>
          {['All', 'Pending', 'Overdue', 'Completed'].map((tab) => (
            <button
              key={tab}
              className={`btn btn-sm ${statusFilter === tab ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setStatusFilter(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner-dark"></div></div>
        ) : displayedActivities.length === 0 ? (
          <div className="empty-state">
            <CalendarCheck className="empty-icon" />
            <h3 className="empty-title">No follow-ups found</h3>
            <p className="empty-desc">{leadsList.length === 0 ? 'Create a lead first.' : 'No items match this filter.'}</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Lead</th>
                  <th>Type</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {displayedActivities.map((act) => {
                  const isOverdue = act.status === 'Pending' && new Date(act.dueAt) < new Date();
                  return (
                    <tr key={act._id}>
                      <td style={{ fontWeight: 600 }}>{act.title}</td>
                      <td>
                        {act.leadId ? (
                          <Link to={`/leads/${act.leadId._id}`}>{act.leadId.name}</Link>
                        ) : '—'}
                      </td>
                      <td><span className="badge" style={{ background: '#f1f5f9' }}>{act.type}</span></td>
                      <td>{new Date(act.dueAt).toLocaleString()}</td>
                      <td>
                        <span className={`badge ${act.status === 'Completed' ? 'badge-status-completed' : isOverdue ? 'badge-status-overdue' : 'badge-status-pending'}`}>
                          {act.status === 'Completed' ? 'Completed' : isOverdue ? 'Overdue' : 'Pending'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => handleToggleStatus(act)}
                          className={`btn btn-sm ${act.status === 'Completed' ? 'btn-secondary' : 'btn-primary'}`}
                        >
                          <CheckCircle2 size={13} />
                          <span>{act.status === 'Completed' ? 'Pending' : 'Complete'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Schedule Follow-up">
        {formError && <div className="alert alert-danger"><AlertCircle size={16} /> <span>{formError}</span></div>}
        <form onSubmit={handleCreateSubmit}>
          <div className="form-group">
            <label className="form-label">Select Lead *</label>
            <select className="form-select" value={formData.leadId} onChange={(e) => setFormData({ ...formData, leadId: e.target.value })} required>
              {leadsList.map((l) => (
                <option key={l._id} value={l._id}>{l.name} {l.company ? `(${l.company})` : ''}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Activity Title *</label>
            <input type="text" className="form-input" placeholder="e.g. Follow-up call" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Type</label>
            <select className="form-select" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}>
              {ACTIVITY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Due Date & Time *</label>
            <input type="datetime-local" className="form-input" value={formData.dueAt} onChange={(e) => setFormData({ ...formData, dueAt: e.target.value })} required />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? <span className="spinner"></span> : 'Schedule'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default FollowupsPage;
