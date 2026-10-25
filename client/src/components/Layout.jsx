import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Avatar } from './Common';
import { roleLabel } from '../utils';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const links = [
    { to: '/', icon: 'bi-grid-1x2', label: 'Dashboard', end: true },
    { to: '/employees', icon: 'bi-people', label: user.role === 'employee' ? 'Directory' : user.role === 'manager' ? 'My team' : 'Employees' },
    { to: '/attendance', icon: 'bi-clock-history', label: 'Attendance' },
    { to: '/leaves', icon: 'bi-calendar2-check', label: 'Leave' },
    { to: '/announcements', icon: 'bi-megaphone', label: 'Announcements' },
    { to: '/training', icon: 'bi-mortarboard', label: 'Training' },
    { to: '/profile', icon: 'bi-person-circle', label: 'My profile' },
  ];

  const signOut = () => { logout(); navigate('/login'); };

  return (
    <div className="shell">
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="brand">
          <span className="brand-mark"><i className="bi bi-arrow-repeat"></i></span>
          <span>StaffSync</span>
        </div>
        <nav aria-label="Main">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} onClick={() => setOpen(false)} className={({ isActive }) => `nav-item-link ${isActive ? 'active' : ''}`}>
              <i className={`bi ${l.icon}`}></i>{l.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-user">
          <Avatar name={user.name} />
          <div className="min-w-0">
            <div className="fw-semibold text-truncate">{user.name}</div>
            <small>{roleLabel[user.role]}</small>
          </div>
          <button className="icon-btn" onClick={signOut} title="Sign out" aria-label="Sign out"><i className="bi bi-box-arrow-right"></i></button>
        </div>
      </aside>
      {open && <div className="scrim" onClick={() => setOpen(false)}></div>}

      <div className="main">
        <header className="topbar">
          <button className="icon-btn menu-btn" onClick={() => setOpen(true)} aria-label="Open menu"><i className="bi bi-list fs-4"></i></button>
          <span className="topbar-brand">StaffSync</span>
        </header>
        <main className="content"><Outlet /></main>
      </div>
    </div>
  );
}
