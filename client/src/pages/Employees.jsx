import { useCallback, useEffect, useState } from 'react';
import api, { errMsg } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import { Avatar, Empty, Loading, PageHeader, StatusBadge } from '../components/Common';
import { fmtDate, money, roleLabel, toInputDate } from '../utils';

const blank = { name: '', email: '', password: '', role: 'employee', department: '', designation: '', phone: '', salary: '', joinDate: '', manager: '', isActive: true };

export default function Employees() {
  const { user } = useAuth();
  const toast = useToast();
  const isHR = user.role === 'hr';
  const [users, setUsers] = useState(null);
  const [meta, setMeta] = useState({ managers: [], departments: [] });
  const [search, setSearch] = useState('');
  const [dept, setDept] = useState('');
  const [editing, setEditing] = useState(null); // null | form object
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    api.get('/users', { params: { search, department: dept || undefined } }).then((r) => setUsers(r.data.users));
  }, [search, dept]);

  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);
  useEffect(() => { if (isHR) api.get('/users/meta').then((r) => setMeta(r.data)); }, [isHR, users?.length]);

  const openNew = () => setEditing({ ...blank });
  const openEdit = (u) => setEditing({ ...blank, ...u, password: '', manager: u.manager?._id || '', joinDate: toInputDate(u.joinDate), salary: u.salary ?? '' });
  const set = (k) => (e) => setEditing({ ...editing, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { _id, ...payload } = editing;
      if (!payload.password) delete payload.password;
      if (_id) await api.put(`/users/${_id}`, payload); else await api.post('/users', payload);
      toast.success(_id ? 'Employee updated' : 'Employee added');
      setEditing(null); load();
    } catch (err) { toast.error(errMsg(err)); }
    finally { setSaving(false); }
  };

  const remove = async (u) => {
    if (!window.confirm(`Delete ${u.name}? Their leave and attendance records will be removed too.`)) return;
    try { await api.delete(`/users/${u._id}`); toast.success('Employee deleted'); load(); }
    catch (err) { toast.error(errMsg(err)); }
  };

  const title = isHR ? 'Employees' : user.role === 'manager' ? 'My team' : 'Company directory';

  return (
    <>
      <PageHeader title={title} subtitle={isHR ? 'Add people, assign managers and update records.' : 'Find colleagues and their roles.'}>
        {isHR && <button className="btn btn-primary" onClick={openNew}><i className="bi bi-plus-lg me-1"></i>Add employee</button>}
      </PageHeader>

      <div className="toolbar">
        <div className="input-icon"><i className="bi bi-search"></i><input className="form-control" placeholder="Search by name, email or title" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search employees" /></div>
        {isHR && (
          <select className="form-select" style={{ maxWidth: 220 }} value={dept} onChange={(e) => setDept(e.target.value)} aria-label="Filter by department">
            <option value="">All departments</option>
            {meta.departments.map((d) => <option key={d}>{d}</option>)}
          </select>
        )}
      </div>

      {!users ? <Loading /> : users.length === 0 ? (
        <Empty icon="bi-people" title="No people found" hint={isHR ? 'Add an employee to get started.' : 'Nobody matches this search.'} />
      ) : (
        <div className="table-wrap">
          <table className="table align-middle mb-0">
            <thead><tr>
              <th>Name</th><th>Role</th><th>Department</th><th>Title</th>
              {user.role !== 'employee' && <th>Joined</th>}
              {isHR && <><th>Salary</th><th>Status</th><th></th></>}
            </tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td><div className="d-flex align-items-center gap-2"><Avatar name={u.name} /><div><div className="fw-semibold">{u.name}</div><small className="text-muted">{u.email}</small></div></div></td>
                  <td><span className={`role role-${u.role}`}>{roleLabel[u.role]}</span></td>
                  <td>{u.department}</td>
                  <td>{u.designation}</td>
                  {user.role !== 'employee' && <td>{fmtDate(u.joinDate)}</td>}
                  {isHR && <>
                    <td>{money(u.salary)}</td>
                    <td><StatusBadge status={u.isActive ? 'active' : 'inactive'} /></td>
                    <td className="text-end text-nowrap">
                      <button className="icon-btn" title="Edit" aria-label={`Edit ${u.name}`} onClick={() => openEdit(u)}><i className="bi bi-pencil"></i></button>
                      {u._id !== user._id && <button className="icon-btn danger" title="Delete" aria-label={`Delete ${u.name}`} onClick={() => remove(u)}><i className="bi bi-trash"></i></button>}
                    </td>
                  </>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <Modal title={editing._id ? 'Edit employee' : 'Add employee'} size="modal-lg" onClose={() => setEditing(null)}
          footer={<><button className="btn btn-outline-secondary" onClick={() => setEditing(null)}>Cancel</button><button className="btn btn-primary" form="emp-form" disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</button></>}>
          <form id="emp-form" onSubmit={save} className="row g-3">
            <div className="col-md-6"><label className="form-label">Full name</label><input className="form-control" value={editing.name} onChange={set('name')} required /></div>
            <div className="col-md-6"><label className="form-label">Email</label><input type="email" className="form-control" value={editing.email} onChange={set('email')} required /></div>
            <div className="col-md-6"><label className="form-label">{editing._id ? 'New password (leave blank to keep)' : 'Password'}</label><input type="password" className="form-control" value={editing.password} onChange={set('password')} required={!editing._id} minLength={6} autoComplete="new-password" /></div>
            <div className="col-md-6"><label className="form-label">Phone</label><input className="form-control" value={editing.phone || ''} onChange={set('phone')} /></div>
            <div className="col-md-4"><label className="form-label">Role</label>
              <select className="form-select" value={editing.role} onChange={set('role')}>
                <option value="employee">Employee</option><option value="manager">Manager</option><option value="hr">HR</option>
              </select></div>
            <div className="col-md-4"><label className="form-label">Department</label><input className="form-control" list="depts" value={editing.department} onChange={set('department')} /><datalist id="depts">{meta.departments.map((d) => <option key={d} value={d} />)}</datalist></div>
            <div className="col-md-4"><label className="form-label">Job title</label><input className="form-control" value={editing.designation} onChange={set('designation')} /></div>
            <div className="col-md-4"><label className="form-label">Reports to</label>
              <select className="form-select" value={editing.manager} onChange={set('manager')}>
                <option value="">No manager</option>
                {meta.managers.filter((m) => m._id !== editing._id).map((m) => <option key={m._id} value={m._id}>{m.name} ({roleLabel[m.role]})</option>)}
              </select></div>
            <div className="col-md-4"><label className="form-label">Monthly salary (₹)</label><input type="number" min="0" className="form-control" value={editing.salary} onChange={set('salary')} /></div>
            <div className="col-md-4"><label className="form-label">Joining date</label><input type="date" className="form-control" value={editing.joinDate} onChange={set('joinDate')} /></div>
            {editing._id && <div className="col-12"><div className="form-check form-switch"><input className="form-check-input" type="checkbox" id="active" checked={editing.isActive} onChange={set('isActive')} /><label className="form-check-label" htmlFor="active">Account active (inactive people cannot sign in)</label></div></div>}
          </form>
        </Modal>
      )}
    </>
  );
}
