import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Layers, AlertCircle, ArrowRight } from 'lucide-react';

const LoginPage = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    // Client-side validation
    if (isRegister && (!formData.name || formData.name.trim().length < 2)) {
      setFormError('Name is required and must be at least 2 characters');
      return;
    }

    if (!formData.email || !formData.email.trim()) {
      setFormError('Email address is required');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setFormError('Please enter a valid email address');
      return;
    }

    if (!formData.password || (isRegister && formData.password.length < 6)) {
      setFormError(
        isRegister
          ? 'Password must be at least 6 characters long'
          : 'Password is required'
      );
      return;
    }

    setSubmitting(true);
    try {
      if (isRegister) {
        await register(formData.name.trim(), formData.email.trim(), formData.password);
      } else {
        await login(formData.email.trim(), formData.password);
      }
      navigate('/');
    } catch (err) {
      setFormError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div
            className="brand-icon"
            style={{ width: 44, height: 44, margin: '0 auto 12px' }}
          >
            <Layers size={24} />
          </div>
          <h2 style={{ fontSize: '1.4rem', marginBottom: 4 }}>LeadFlow CRM</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Pipeline & Follow-up Management for Agencies
          </p>
        </div>

        <div className="auth-tabs">
          <div
            className={`auth-tab ${!isRegister ? 'active' : ''}`}
            onClick={() => {
              setIsRegister(false);
              setFormError('');
            }}
          >
            Sign In
          </div>
          <div
            className={`auth-tab ${isRegister ? 'active' : ''}`}
            onClick={() => {
              setIsRegister(true);
              setFormError('');
            }}
          >
            Create Account
          </div>
        </div>

        {formError && (
          <div className="alert alert-danger">
            <AlertCircle size={16} />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <div className="form-group">
              <label className="form-label">
                Full Name <span className="required">*</span>
              </label>
              <input
                type="text"
                name="name"
                className="form-input"
                placeholder="e.g. Alex Johnson"
                value={formData.name}
                onChange={handleChange}
                disabled={submitting}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">
              Email Address <span className="required">*</span>
            </label>
            <input
              type="email"
              name="email"
              className="form-input"
              placeholder="name@agency.com"
              value={formData.email}
              onChange={handleChange}
              disabled={submitting}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Password <span className="required">*</span>
            </label>
            <input
              type="password"
              name="password"
              className="form-input"
              placeholder={isRegister ? 'At least 6 characters' : 'Enter password'}
              value={formData.password}
              onChange={handleChange}
              disabled={submitting}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: 8 }}
            disabled={submitting}
          >
            {submitting ? (
              <span className="spinner"></span>
            ) : (
              <>
                <span>{isRegister ? 'Register Account' : 'Sign In'}</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
