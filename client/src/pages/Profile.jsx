import { useState } from 'react';
import api, { errMsg } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Avatar, PageHeader } from '../components/Common';
import { fmtDate, money, roleLabel } from '../utils';

export default function Profile() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const [info, setInfo] = useState({ name: user.name, phone: user.phone || '' });
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const [busy, setBusy] = useState('');

  const saveInfo = async (e) => {
    e.preventDefault(); setBusy('info');
    try { const { data } = await api.put('/auth/me', info); setUser({ ...user, ...data.user }); toast.success('Profile updated'); }
    catch (err) { toast.error(errMsg(err)); }
    finally { setBusy(''); }
  };

  const savePw = async (e) => {
    e.preventDefault(); setBusy('pw');
    try { await api.put('/auth/password', pw); toast.success('Password changed'); setPw({ currentPassword: '', newPassword: '' }); }
    catch (err) { toast.error(errMsg(err)); }
    finally { setBusy(''); }
  };

  const facts = [
    ['Email', user.email], ['Role', roleLabel[user.role]], ['Department', user.department], ['Job title', user.designation],
    ['Reports to', user.manager?.name || '-'], ['Joined', fmtDate(user.joinDate)], ['Monthly salary', money(user.salary)],
  ];

  return (
    <>
      <PageHeader title="My profile" subtitle="Your details and sign-in settings." />
      <div className="row g-3">
        <div className="col-lg-5">
          <div className="panel">
            <div className="d-flex align-items-center gap-3 mb-3"><Avatar name={user.name} size={56} /><div><h2 className="mb-0">{user.name}</h2><span className={`role role-${user.role}`}>{roleLabel[user.role]}</span></div></div>
            <dl className="facts">{facts.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
            <p className="small text-muted mb-0">Ask HR to change your email, department or title.</p>
          </div>
        </div>
        <div className="col-lg-7 d-flex flex-column gap-3">
          <form className="panel" onSubmit={saveInfo}>
            <h2>Contact details</h2>
            <label className="form-label" htmlFor="pname">Full name</label>
            <input id="pname" className="form-control mb-3" value={info.name} onChange={(e) => setInfo({ ...info, name: e.target.value })} required />
            <label className="form-label" htmlFor="pphone">Phone</label>
            <input id="pphone" className="form-control mb-3" value={info.phone} onChange={(e) => setInfo({ ...info, phone: e.target.value })} />
            <button className="btn btn-primary" disabled={busy === 'info'}>{busy === 'info' ? 'Saving...' : 'Save changes'}</button>
          </form>
          <form className="panel" onSubmit={savePw}>
            <h2>Change password</h2>
            <label className="form-label" htmlFor="cpw">Current password</label>
            <input id="cpw" type="password" className="form-control mb-3" autoComplete="current-password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} required />
            <label className="form-label" htmlFor="npw">New password</label>
            <input id="npw" type="password" className="form-control mb-3" autoComplete="new-password" minLength={6} value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} required />
            <button className="btn btn-primary" disabled={busy === 'pw'}>{busy === 'pw' ? 'Updating...' : 'Update password'}</button>
          </form>
        </div>
      </div>
    </>
  );
}
