import { useEffect, useState } from 'react';
import api, { errMsg } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import { Empty, Loading, PageHeader } from '../components/Common';
import { fmtDate, todayStr } from '../utils';

export default function Training() {
  const { user } = useAuth();
  const toast = useToast();
  const canCreate = user.role !== 'employee';
  const [items, setItems] = useState(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', mode: 'online', startDate: todayStr(), endDate: todayStr() });
  const [busy, setBusy] = useState(false);

  const load = () => api.get('/trainings').then((r) => setItems(r.data.trainings));
  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault(); setBusy(true);
    try { await api.post('/trainings', form); toast.success('Training program created'); setOpen(false); load(); }
    catch (err) { toast.error(errMsg(err)); }
    finally { setBusy(false); }
  };

  const toggle = async (t) => {
    try {
      const { data } = await api.post(`/trainings/${t._id}/enroll`);
      setItems(items.map((x) => (x._id === t._id ? data.training : x)));
      toast.success(data.training.isEnrolled ? 'You are enrolled' : 'You have left this program');
    } catch (err) { toast.error(errMsg(err)); }
  };

  const remove = async (t) => {
    if (!window.confirm(`Delete "${t.title}"?`)) return;
    try { await api.delete(`/trainings/${t._id}`); toast.success('Training deleted'); load(); }
    catch (err) { toast.error(errMsg(err)); }
  };

  const ended = (t) => new Date(t.endDate) < new Date(todayStr());

  return (
    <>
      <PageHeader title="Training and development" subtitle="Join programs to grow your skills.">
        {canCreate && <button className="btn btn-primary" onClick={() => setOpen(true)}><i className="bi bi-plus-lg me-1"></i>New program</button>}
      </PageHeader>
      {!items ? <Loading /> : items.length === 0 ? <Empty icon="bi-mortarboard" title="No programs yet" hint={canCreate ? 'Create a program for your team.' : 'New programs will show up here.'} /> : (
        <div className="row g-3">
          {items.map((t) => (
            <div className="col-md-6 col-xl-4" key={t._id}>
              <div className="panel h-100 d-flex flex-column">
                <div className="d-flex justify-content-between align-items-start">
                  <span className={`cat ${t.mode === 'online' ? 'cat-event' : 'cat-policy'}`}>{t.mode}</span>
                  {canCreate && (user.role === 'hr' || t.createdBy?._id === user._id) && <button className="icon-btn danger" aria-label={`Delete ${t.title}`} onClick={() => remove(t)}><i className="bi bi-trash"></i></button>}
                </div>
                <h2 className="mt-2">{t.title}</h2>
                <p className="text-muted flex-grow-1">{t.description || 'No description provided.'}</p>
                <div className="small text-muted mb-3"><i className="bi bi-calendar3 me-1"></i>{fmtDate(t.startDate)}{t.startDate !== t.endDate && ` - ${fmtDate(t.endDate)}`}<br /><i className="bi bi-people me-1"></i>{t.enrolledCount} enrolled · by {t.createdBy?.name}</div>
                {ended(t) ? <button className="btn btn-outline-secondary" disabled>Program ended</button>
                  : <button className={`btn ${t.isEnrolled ? 'btn-outline-primary' : 'btn-primary'}`} onClick={() => toggle(t)}>{t.isEnrolled ? 'Leave program' : 'Enroll'}</button>}
              </div>
            </div>
          ))}
        </div>
      )}
      {open && (
        <Modal title="New training program" onClose={() => setOpen(false)}
          footer={<><button className="btn btn-outline-secondary" onClick={() => setOpen(false)}>Cancel</button><button className="btn btn-primary" form="train-form" disabled={busy}>{busy ? 'Creating...' : 'Create program'}</button></>}>
          <form id="train-form" onSubmit={create} className="row g-3">
            <div className="col-12"><label className="form-label">Title</label><input className="form-control" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
            <div className="col-12"><label className="form-label">Description</label><textarea className="form-control" rows="3" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="col-12"><label className="form-label">Format</label><select className="form-select" value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })}><option value="online">Online</option><option value="in-person">In person</option></select></div>
            <div className="col-6"><label className="form-label">Starts</label><input type="date" className="form-control" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value, endDate: e.target.value > form.endDate ? e.target.value : form.endDate })} required /></div>
            <div className="col-6"><label className="form-label">Ends</label><input type="date" className="form-control" min={form.startDate} value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required /></div>
          </form>
        </Modal>
      )}
    </>
  );
}
