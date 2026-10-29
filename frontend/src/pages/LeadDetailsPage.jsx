import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/api';
import Modal from '../components/Modal';
import {
  ArrowLeft,
  Save,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  Check,
} from 'lucide-react';

const STAGES = ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Won', 'Lost'];
const SERVICE_OPTIONS = ['Web Development', 'Digital Marketing', 'SEO', 'Mobile App', 'UI/UX Design', 'Other'];
const SOURCE_OPTIONS = ['Website', 'Referral', 'Social Media', 'Email', 'Outreach', 'Other'];
const ACTIVITY_TYPES = ['Call', 'Email', 'Meeting', 'Task'];

const LeadDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [lead, setLead] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    serviceInterest: 'Web Development',
    source: 'Website',
    budget: '',
    stage: 'New',
  });

  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [followUpData, setFollowUpData] = useState({ title: '', type: 'Call', dueAt: '' });
  const [followUpError, setFollowUpError] = useState('');
  const [submittingFollowUp, setSubmittingFollowUp] = useState(false);

  const fetchLeadDetails = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/leads/${id}`);
      if (res.success && res.data) {
        const leadDoc = res.data.lead;
        setLead(leadDoc);
        setActivities(res.data.activities || []);
        setFormData({
          name: leadDoc.name || '',
          company: leadDoc.company || '',
          email: leadDoc.email || '',
          phone: leadDoc.phone || '',
          serviceInterest: leadDoc.serviceInterest || 'Web Development',
          source: leadDoc.source || 'Website',
          budget: leadDoc.budget ?? 0,
          stage: leadDoc.stage || 'New',
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to load lead details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeadDetails();
  }, [id]);

  const handleInputChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
    setSuccessMsg('');
  };

  const handleSaveLead = async (e) => {
    e.preventDefault();
    if (!formData.name?.trim()) return setError('Lead name is required');
    if (!formData.email?.trim() && !formData.phone?.trim()) return setError('At least one of email or phone must be provided');
    if (formData.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      return setError('Please enter a valid email address');
    }
    if (formData.budget !== '' && Number(formData.budget) < 0) return setError('Budget must be greater than or equal to 0');

    setSaving(true);
    try {
      const res = await api.patch(`/leads/${id}`, {
        ...formData,
        budget: formData.budget !== '' ? Number(formData.budget) : 0,
      });
      if (res.success && res.data?.lead) {
        setLead(res.data.lead);
        setSuccessMsg('Lead details updated successfully!');
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      setError(err.message || 'Failed to update lead');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateFollowUp = async (e) => {
    e.preventDefault();
    if (!followUpData.title?.trim()) return setFollowUpError('Activity title is required');
    if (!followUpData.dueAt) return setFollowUpError('Due date and time is required');

    setSubmittingFollowUp(true);
    try {
      const res = await api.post('/activities', {
        leadId: id,
        title: followUpData.title.trim(),
        type: followUpData.type,
        dueAt: new Date(followUpData.dueAt).toISOString(),
      });
      if (res.success) {
        setIsFollowUpModalOpen(false);
        setFollowUpData({ title: '', type: 'Call', dueAt: '' });
        fetchLeadDetails();
      }
    } catch (err) {
      setFollowUpError(err.message || 'Failed to schedule follow-up');
    } finally {
      setSubmittingFollowUp(false);
    }
  };

  const toggleActivityStatus = async (activity) => {
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

  if (loading) return <div style={{ padding: 60, textAlign: 'center' }}><div className="spinner-dark"></div></div>;

  if (!lead) {
    return (
      <div className="card" style={{ padding: 40, textAlign: 'center' }}>
        <AlertCircle size={36} color="#dc2626" style={{ margin: '0 auto 10px' }} />
        <h3>Lead Not Found</h3>
        <button onClick={() => navigate('/leads')} className="btn btn-secondary btn-sm" style={{ marginTop: 12 }}>
          <ArrowLeft size={14} /> <span>Back to Leads</span>
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <button onClick={() => navigate('/leads')} className="btn btn-secondary btn-sm">
          <ArrowLeft size={14} /> <span>Back to Leads</span>
        </button>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Lead ID: {lead._id}</span>
      </div>

      {error && <div className="alert alert-danger"><AlertCircle size={16} /> <span>{error}</span></div>}
      {successMsg && <div className="alert alert-success"><Check size={16} /> <span>{successMsg}</span></div>}

      <div style={{ display: 'grid', gap: 20 }}>
        {/* Lead Form */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Lead Profile & Pipeline Stage</h2>
            <button form="lead-form" type="submit" className="btn btn-primary btn-sm" disabled={saving}>
              {saving ? <span className="spinner"></span> : <Save size={14} />} <span>Save</span>
            </button>
          </div>
          <div className="card-body">
            <form id="lead-form" onSubmit={handleSaveLead}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input type="text" name="name" className="form-input" value={formData.name} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Company</label>
                  <input type="text" name="company" className="form-input" value={formData.company} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input type="email" name="email" className="form-input" value={formData.email} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input type="tel" name="phone" className="form-input" value={formData.phone} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Stage (M03)</label>
                  <select name="stage" className="form-select" value={formData.stage} onChange={handleInputChange}>
                    {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Budget ($)</label>
                  <input type="number" name="budget" min="0" className="form-input" value={formData.budget} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Service Interest</label>
                  <select name="serviceInterest" className="form-select" value={formData.serviceInterest} onChange={handleInputChange}>
                    {SERVICE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Source</label>
                  <select name="source" className="form-select" value={formData.source} onChange={handleInputChange}>
                    {SOURCE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Follow-ups */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Follow-ups for {lead.name}</h2>
            <button onClick={() => { setFollowUpError(''); setIsFollowUpModalOpen(true); }} className="btn btn-primary btn-sm">
              <Plus size={14} /> <span>Add Follow-up</span>
            </button>
          </div>
          <div className="card-body">
            {activities.length === 0 ? (
              <div className="empty-state" style={{ padding: 24 }}>
                <Clock className="empty-icon" />
                <p className="empty-desc">No follow-ups scheduled for this lead yet.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Type</th>
                      <th>Due Date</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activities.map((act) => {
                      const isOverdue = act.status === 'Pending' && new Date(act.dueAt) < new Date();
                      return (
                        <tr key={act._id}>
                          <td style={{ fontWeight: 500 }}>{act.title}</td>
                          <td><span className="badge" style={{ background: '#f1f5f9' }}>{act.type}</span></td>
                          <td>{new Date(act.dueAt).toLocaleString()}</td>
                          <td>
                            <span className={`badge ${act.status === 'Completed' ? 'badge-status-completed' : isOverdue ? 'badge-status-overdue' : 'badge-status-pending'}`}>
                              {act.status === 'Completed' ? 'Completed' : isOverdue ? 'Overdue' : 'Pending'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button onClick={() => toggleActivityStatus(act)} className={`btn btn-sm ${act.status === 'Completed' ? 'btn-secondary' : 'btn-primary'}`}>
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
        </div>
      </div>

      <Modal isOpen={isFollowUpModalOpen} onClose={() => setIsFollowUpModalOpen(false)} title={`Schedule Follow-up for ${lead.name}`}>
        {followUpError && <div className="alert alert-danger"><AlertCircle size={16} /> <span>{followUpError}</span></div>}
        <form onSubmit={handleCreateFollowUp}>
          <div className="form-group">
            <label className="form-label">Activity Title *</label>
            <input type="text" className="form-input" placeholder="e.g. Follow-up meeting" value={followUpData.title} onChange={(e) => setFollowUpData({ ...followUpData, title: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Type</label>
            <select className="form-select" value={followUpData.type} onChange={(e) => setFollowUpData({ ...followUpData, type: e.target.value })}>
              {ACTIVITY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Due Date & Time *</label>
            <input type="datetime-local" className="form-input" value={followUpData.dueAt} onChange={(e) => setFollowUpData({ ...followUpData, dueAt: e.target.value })} required />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsFollowUpModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submittingFollowUp}>
              {submittingFollowUp ? <span className="spinner"></span> : 'Save Follow-up'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default LeadDetailsPage;
