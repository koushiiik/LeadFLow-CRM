import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <NavLink to="/" className="brand">
          LeadFlow CRM
        </NavLink>

        <nav className="nav-links">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              isActive ? 'nav-link active' : 'nav-link'
            }
          >
            Dashboard
          </NavLink>

          <NavLink
            to="/leads"
            className={({ isActive }) =>
              isActive ? 'nav-link active' : 'nav-link'
            }
          >
            Leads
          </NavLink>

          <NavLink
            to="/follow-ups"
            className={({ isActive }) =>
              isActive ? 'nav-link active' : 'nav-link'
            }
          >
            Follow-ups
          </NavLink>
        </nav>

        <div className="user-menu">
          <div className="user-badge" title={user?.email}>
            <span>{user?.name || 'User'}</span>
            <span className="user-role-tag">{user?.role || 'admin'}</span>
          </div>

          <button
            onClick={handleLogout}
            className="btn btn-secondary btn-sm"
            title="Log Out"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
