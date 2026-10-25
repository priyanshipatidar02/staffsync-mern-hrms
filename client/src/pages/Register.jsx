import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { errMsg } from '../api';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', department: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) return setError('Password must be at least 6 characters');
    setBusy(true);
    try { await register(form); navigate('/'); }
    catch (err) { setError(errMsg(err)); }
    finally { setBusy(false); }
  };

  return (
    <div className="auth-page">
      <section className="auth-art" aria-hidden="true">
        <div className="brand"><span className="brand-mark"><i className="bi bi-arrow-repeat"></i></span><span>StaffSync</span></div>
        <div className="roster">
          <h2>Start with your profile.</h2>
          <ul>
            <li><span className="dot in"></span>The first account created becomes the HR admin</li>
            <li><span className="dot leave"></span>Later sign-ups join as employees</li>
            <li><span className="dot in"></span>HR can promote people to manager later</li>
          </ul>
        </div>
      </section>
      <section className="auth-form">
        <form onSubmit={submit} noValidate>
          <h1>Create account</h1>
          <p className="text-muted">It takes under a minute.</p>
          {error && <div className="alert alert-danger py-2" role="alert">{error}</div>}
          <label className="form-label" htmlFor="name">Full name</label>
          <input id="name" className="form-control mb-3" value={form.name} onChange={set('name')} required />
          <label className="form-label" htmlFor="remail">Work email</label>
          <input id="remail" type="email" className="form-control mb-3" value={form.email} onChange={set('email')} required />
          <label className="form-label" htmlFor="dept">Department</label>
          <input id="dept" className="form-control mb-3" placeholder="e.g. Engineering" value={form.department} onChange={set('department')} />
          <label className="form-label" htmlFor="rpassword">Password</label>
          <input id="rpassword" type="password" className="form-control mb-4" autoComplete="new-password" value={form.password} onChange={set('password')} required />
          <button className="btn btn-primary w-100" disabled={busy}>{busy ? 'Creating...' : 'Create account'}</button>
          <p className="mt-4 mb-0 text-center">Already registered? <Link to="/login">Sign in</Link></p>
        </form>
      </section>
    </div>
  );
}
