import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/api';
import Modal from '../components/Modal';
import { Search, Plus, Trash2, ExternalLink, Mail, Phone, Building, AlertCircle, Users } from 'lucide-react';

const STAGES = ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Won', 'Lost'];
const SERVICE_OPTIONS = ['Web Development', 'Digital Marketing', 'SEO', 'Mobile App', 'UI/UX Design', 'Other'];
const SOURCE_OPTIONS = ['Website', 'Referral', 'Social Media', 'Email', 'Outreach', 'Other'];

const getStageBadgeClass = (stage) => {
  const map = {
    New: 'badge-stage-new',
    Contacted: 'badge-stage-contacted',
    Qualified: 'badge-stage-qualified',
    'Proposal Sent': 'badge-stage-proposalsent',
    Won: 'badge-stage-won',
    Lost: 'badge-stage-lost',
  };
  return map[stage] || 'badge-stage-new';
};

const LeadsPage = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStage, setSelectedStage] = useState('All');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState(null);

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
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (selectedStage !== 'All') params.stage = selectedStage;
      const res = await api.get('/leads', { params });
      if (res.success && res.data) setLeads(res.data.leads || []);
    } catch (err) {
      setError(err.message || 'Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchLeads, 200);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedStage]);

  // Stage change directly from dropdown (M03 Pipeline Requirement)
  const handleStageChange = async (leadId, newStage) => {
    try {
      const res = await api.patch(`/leads/${leadId}`, { stage: newStage });
      if (res.success && res.data?.lead) {
        setLeads((prev) => prev.map((l) => (l._id === leadId ? res.data.lead : l)));
      }
    } catch (err) {
      alert(`Could not update stage: ${err.message}`);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name?.trim()) return setFormError('Lead name is required');
    if (!formData.email?.trim() && !formData.phone?.trim()) {
      return setFormError('At least one of email or phone must be provided');
    }
    if (formData.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      return setFormError('Please enter a valid email address');
    }
    if (formData.budget !== '' && Number(formData.budget) < 0) {
      return setFormError('Budget must be greater than or equal to 0');
    }

    setSubmitting(true);
    try {
      const res = await api.post('/leads', {
        ...formData,
        budget: formData.budget !== '' ? Number(formData.budget) : 0,
      });
      if (res.success) {
        setIsAddModalOpen(false);
        setFormData({
          name: '',
          company: '',
          email: '',
          phone: '',
          serviceInterest: 'Web Development',
          source: 'Website',
          budget: '',
          stage: 'New',
        });
        fetchLeads();
      }
    } catch (err) {
      setFormError(err.message || 'Failed to create lead');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!leadToDelete) return;
    setSubmitting(true);
    try {
      const res = await api.delete(`/leads/${leadToDelete._id}`);
      if (res.success) {
        setIsDeleteModalOpen(false);
        setLeads((prev) => prev.filter((l) => l._id !== leadToDelete._id));
        setLeadToDelete(null);
      }
    } catch (err) {
      alert(`Failed to delete lead: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="card-header" style={{ borderBottom: 'none', padding: '0 0 16px 0' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', marginBottom: 4 }}>Leads Pipeline</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Move leads through sales stages and manage enquiries.</p>
        </div>
        <button onClick={() => { setFormError(''); setIsAddModalOpen(true); }} className="btn btn-primary">
          <Plus size={16} /> <span>New Lead</span>
        </button>
      </div>

      {error && <div className="alert alert-danger"><AlertCircle size={16} /> <span>{error}</span></div>}

      <div className="toolbar">
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="input-search"
            placeholder="Search leads by name or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Stage:</span>
          <select className="form-select" style={{ width: 'auto' }} value={selectedStage} onChange={(e) => setSelectedStage(e.target.value)}>
            <option value="All">All Stages</option>
            {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner-dark"></div></div>
        ) : leads.length === 0 ? (
          <div className="empty-state">
            <Users className="empty-icon" />
            <h3 className="empty-title">No leads found</h3>
            <p className="empty-desc">{searchTerm || selectedStage !== 'All' ? 'Try adjusting search/filter.' : 'Create your first lead to get started.'}</p>
            <button onClick={() => setIsAddModalOpen(true)} className="btn btn-primary btn-sm"><Plus size={14} /> <span>Add First Lead</span></button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Lead Name</th>
                  <th>Company</th>
                  <th>Contact Info</th>
                  <th>Budget</th>
                  <th>Stage (Dropdown)</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead._id}>
                    <td><Link to={`/leads/${lead._id}`} style={{ fontWeight: 600 }}>{lead.name}</Link></td>
                    <td>{lead.company || <span style={{ color: 'var(--text-light)' }}>—</span>}</td>
                    <td>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {lead.email && <div>{lead.email}</div>}
                        {lead.phone && <div>{lead.phone}</div>}
                      </div>
                    </td>
                    <td>${Number(lead.budget || 0).toLocaleString()}</td>
                    <td>
                      <select
                        className={`badge ${getStageBadgeClass(lead.stage)}`}
                        style={{ cursor: 'pointer', padding: '4px 8px', outline: 'none' }}
                        value={lead.stage}
                        onChange={(e) => handleStageChange(lead._id, e.target.value)}
                      >
                        {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <Link to={`/leads/${lead._id}`} className="btn btn-secondary btn-icon" title="View Details"><ExternalLink size={14} /></Link>
                        <button onClick={() => { setLeadToDelete(lead); setIsDeleteModalOpen(true); }} className="btn btn-danger-outline btn-icon" title="Delete"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Lead">
        {formError && <div className="alert alert-danger"><AlertCircle size={16} /> <span>{formError}</span></div>}
        <form onSubmit={handleCreateSubmit}>
          <div className="form-group">
            <label className="form-label">Name *</label>
            <input type="text" className="form-input" placeholder="Client Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Company</label>
            <input type="text" className="form-input" placeholder="Company Name" value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" className="form-input" placeholder="name@client.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input type="tel" className="form-input" placeholder="+1..." value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="form-group">
              <label className="form-label">Service Interest</label>
              <select className="form-select" value={formData.serviceInterest} onChange={(e) => setFormData({ ...formData, serviceInterest: e.target.value })}>
                {SERVICE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Budget ($)</label>
              <input type="number" min="0" className="form-input" placeholder="5000" value={formData.budget} onChange={(e) => setFormData({ ...formData, budget: e.target.value })} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? <span className="spinner"></span> : 'Save Lead'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={() => { setIsDeleteModalOpen(false); setLeadToDelete(null); }} title="Confirm Delete">
        <p style={{ fontSize: '0.9rem', marginBottom: 12 }}>Delete lead <strong>{leadToDelete?.name}</strong> and all associated follow-ups?</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button className="btn btn-secondary" onClick={() => { setIsDeleteModalOpen(false); setLeadToDelete(null); }}>Cancel</button>
          <button className="btn btn-danger" onClick={confirmDelete} disabled={submitting}>
            {submitting ? <span className="spinner"></span> : 'Delete'}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default LeadsPage;
