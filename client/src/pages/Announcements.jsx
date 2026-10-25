import { useEffect, useState } from 'react';
import api, { errMsg } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import { Empty, Loading, PageHeader } from '../components/Common';
import { fmtDateTz } from '../utils';

const CATS = ['general', 'policy', 'event', 'urgent'];

export default function Announcements() {
  const { user } = useAuth();
  const toast = useToast();
  const [items, setItems] = useState(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', body: '', category: 'general' });
  const [busy, setBusy] = useState(false);

  const load = () => api.get('/announcements').then((r) => setItems(r.data.announcements));
  useEffect(() => { load(); }, []);

  const post = async (e) => {
    e.preventDefault(); setBusy(true);
    try { await api.post('/announcements', form); toast.success('Announcement posted'); setOpen(false); setForm({ title: '', body: '', category: 'general' }); load(); }
    catch (err) { toast.error(errMsg(err)); }
    finally { setBusy(false); }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    try { await api.delete(`/announcements/${id}`); toast.success('Announcement deleted'); load(); }
    catch (err) { toast.error(errMsg(err)); }
  };

  return (
    <>
      <PageHeader title="Announcements" subtitle="News and policy updates from HR.">
        {user.role === 'hr' && <button className="btn btn-primary" onClick={() => setOpen(true)}><i className="bi bi-plus-lg me-1"></i>New announcement</button>}
      </PageHeader>
      {!items ? <Loading /> : items.length === 0 ? <Empty icon="bi-megaphone" title="No announcements yet" hint={user.role === 'hr' ? 'Post the first one for your team.' : 'Check back soon.'} /> : (
        <div className="d-flex flex-column gap-3">
          {items.map((a) => (
            <article key={a._id} className={`post post-${a.category}`}>
              <div className="d-flex justify-content-between align-items-start gap-3">
                <div>
                  <span className={`cat cat-${a.category}`}>{a.category}</span>
                  <h2>{a.title}</h2>
                </div>
                {user.role === 'hr' && <button className="icon-btn danger" aria-label={`Delete ${a.title}`} onClick={() => remove(a._id)}><i className="bi bi-trash"></i></button>}
              </div>
              <p>{a.body}</p>
              <small className="text-muted">Posted by {a.author?.name} on {fmtDateTz(a.createdAt)}</small>
            </article>
          ))}
        </div>
      )}
      {open && (
        <Modal title="New announcement" onClose={() => setOpen(false)}
          footer={<><button className="btn btn-outline-secondary" onClick={() => setOpen(false)}>Cancel</button><button className="btn btn-primary" form="post-form" disabled={busy}>{busy ? 'Posting...' : 'Post announcement'}</button></>}>
          <form id="post-form" onSubmit={post} className="row g-3">
            <div className="col-12"><label className="form-label">Title</label><input className="form-control" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
            <div className="col-12"><label className="form-label">Category</label><select className="form-select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{CATS.map((c) => <option key={c} value={c}>{c[0].toUpperCase() + c.slice(1)}</option>)}</select></div>
            <div className="col-12"><label className="form-label">Message</label><textarea className="form-control" rows="5" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} required /></div>
          </form>
        </Modal>
      )}
    </>
  );
}
