import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { errMsg } from '../api';

const DEMO = [
  { label: 'HR', email: 'hr@staffsync.com' },
  { label: 'Manager', email: 'manager@staffsync.com' },
  { label: 'Employee', email: 'employee@staffsync.com' },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setBusy(true);
    try { await login(form.email, form.password); navigate('/'); }
    catch (err) { setError(errMsg(err)); }
    finally { setBusy(false); }
  };

  return (
    <div className="auth-page">
      <section className="auth-art" aria-hidden="true">
        <div className="brand"><span className="brand-mark"><i className="bi bi-arrow-repeat"></i></span><span>StaffSync</span></div>
        <div className="roster">
          <h2>Everyone, in sync.</h2>
          <ul>
            <li><span className="dot in"></span>Check in and out in one tap</li>
            <li><span className="dot leave"></span>Leave requests reach the right manager</li>
            <li><span className="dot in"></span>Announcements and training in one place</li>
            <li><span className="dot late"></span>HR sees who is in, late or away</li>
          </ul>
        </div>
      </section>

      <section className="auth-form">
        <form onSubmit={submit} noValidate>
          <h1>Sign in</h1>
          <p className="text-muted">Use your work email to continue.</p>
          {error && <div className="alert alert-danger py-2" role="alert">{error}</div>}
          <label className="form-label" htmlFor="email">Email</label>
          <input id="email" type="email" className="form-control mb-3" autoComplete="username" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <label className="form-label" htmlFor="password">Password</label>
          <input id="password" type="password" className="form-control mb-4" autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          <button className="btn btn-primary w-100" disabled={busy}>{busy ? 'Signing in...' : 'Sign in'}</button>

          <div className="demo-box">
            <small className="text-muted d-block mb-2">Demo accounts (after running the seed script). Password: Password@123</small>
            <div className="d-flex gap-2 flex-wrap">
              {DEMO.map((d) => (
                <button type="button" key={d.label} className="btn btn-sm btn-outline-secondary" onClick={() => setForm({ email: d.email, password: 'Password@123' })}>{d.label}</button>
              ))}
            </div>
          </div>
          <p className="mt-4 mb-0 text-center">New here? <Link to="/register">Create an account</Link></p>
        </form>
      </section>
    </div>
  );
}
