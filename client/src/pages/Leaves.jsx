import { useCallback, useEffect, useState } from 'react';
import api, { errMsg } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import { Empty, Loading, PageHeader, StatusBadge, Tabs, Avatar } from '../components/Common';
import { fmtDate, todayStr } from '../utils';

const TYPES = ['annual', 'sick', 'casual', 'unpaid'];

export default function Leaves() {
  const { user, refresh } = useAuth();
  const toast = useToast();
  const canReview = user.role !== 'employee';
  const [tab, setTab] = useState('mine');
  const [mine, setMine] = useState(null);
  const [manage, setManage] = useState(null);
  const [filter, setFilter] = useState('pending');
  const [applying, setApplying] = useState(false);
  const [form, setForm] = useState({ type: 'annual', startDate: todayStr(), endDate: todayStr(), reason: '' });
  const [deciding, setDeciding] = useState(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const loadMine = useCallback(() => api.get('/leaves/mine').then((r) => setMine(r.data.leaves)), []);
  const loadManage = useCallback(() => {
    if (canReview) api.get('/leaves/manage', { params: { status: filter || undefined } }).then((r) => setManage(r.data.leaves));
  }, [canReview, filter]);

  useEffect(() => { loadMine(); }, [loadMine]);
  useEffect(() => { loadManage(); }, [loadManage]);

  const apply = async (e) => {
    e.preventDefault(); setBusy(true);
    try {
      await api.post('/leaves', form);
      toast.success('Leave request sent');
      setApplying(false); setForm({ ...form, reason: '' }); loadMine();
    } catch (err) { toast.error(errMsg(err)); }
    finally { setBusy(false); }
  };

  const cancel = async (id) => {
    if (!window.confirm('Cancel this leave request?')) return;
    try { await api.delete(`/leaves/${id}`); toast.success('Leave request cancelled'); loadMine(); }
    catch (err) { toast.error(errMsg(err)); }
  };

  const decide = async (status) => {
    setBusy(true);
    try {
      await api.put(`/leaves/${deciding._id}/status`, { status, note });
      toast.success(status === 'approved' ? 'Leave approved' : 'Leave rejected');
      setDeciding(null); setNote(''); loadManage();
    } catch (err) { toast.error(errMsg(err)); }
    finally { setBusy(false); }
  };

  const pendingCount = manage && filter === 'pending' ? manage.length : 0;
  const bal = user.leaveBalance;

  return (
    <>
      <PageHeader title="Leave" subtitle="Weekends are not counted against your balance.">
        <button className="btn btn-primary" onClick={() => setApplying(true)}><i className="bi bi-plus-lg me-1"></i>Apply for leave</button>
      </PageHeader>

      <div className="chips mb-3">
        <span className="chip">Annual: {bal.annual}</span><span className="chip">Sick: {bal.sick}</span><span className="chip">Casual: {bal.casual}</span>
      </div>

      {canReview && <Tabs active={tab} onChange={setTab} tabs={[{ key: 'mine', label: 'My requests' }, { key: 'approvals', label: 'Approvals', count: pendingCount }]} />}

      {tab === 'mine' && (
        <div className="mt-3">
          {!mine ? <Loading /> : mine.length === 0 ? <Empty icon="bi-calendar2-check" title="No leave requests yet" hint="Use Apply for leave to send your first one." /> : (
            <div className="table-wrap"><table className="table align-middle mb-0">
              <thead><tr><th>Type</th><th>Dates</th><th>Days</th><th>Reason</th><th>Status</th><th></th></tr></thead>
              <tbody>{mine.map((l) => (
                <tr key={l._id}>
                  <td className="text-capitalize">{l.type}</td>
                  <td>{fmtDate(l.startDate)}{l.days > 1 || l.startDate !== l.endDate ? ` - ${fmtDate(l.endDate)}` : ''}</td>
                  <td>{l.days}</td>
                  <td style={{ maxWidth: 260 }}>{l.reason}{l.reviewNote && <div className="small text-muted">Note from {l.reviewedBy?.name}: {l.reviewNote}</div>}</td>
                  <td><StatusBadge status={l.status} /></td>
                  <td className="text-end">{l.status === 'pending' && <button className="btn btn-sm btn-outline-secondary" onClick={() => cancel(l._id)}>Cancel</button>}</td>
                </tr>
              ))}</tbody>
            </table></div>
          )}
        </div>
      )}

      {tab === 'approvals' && (
        <div className="mt-3">
          <div className="toolbar">
            <select className="form-select" style={{ maxWidth: 200 }} value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter by status">
              <option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="">All</option>
            </select>
          </div>
          {!manage ? <Loading /> : manage.length === 0 ? <Empty icon="bi-check2-all" title="Nothing here" hint="No leave requests match this filter." /> : (
            <div className="table-wrap"><table className="table align-middle mb-0">
              <thead><tr><th>Employee</th><th>Type</th><th>Dates</th><th>Days</th><th>Reason</th><th>Status</th><th></th></tr></thead>
              <tbody>{manage.map((l) => (
                <tr key={l._id}>
                  <td><div className="d-flex align-items-center gap-2"><Avatar name={l.user?.name} size={30} /><div>{l.user?.name}<div className="small text-muted">{l.user?.department}</div></div></div></td>
                  <td className="text-capitalize">{l.type}</td>
                  <td>{fmtDate(l.startDate)}{l.startDate !== l.endDate ? ` - ${fmtDate(l.endDate)}` : ''}</td>
                  <td>{l.days}</td>
                  <td style={{ maxWidth: 220 }}>{l.reason}</td>
                  <td><StatusBadge status={l.status} /></td>
                  <td className="text-end">{l.status === 'pending' && <button className="btn btn-sm btn-primary" onClick={() => { setDeciding(l); setNote(''); }}>Review</button>}</td>
                </tr>
              ))}</tbody>
            </table></div>
          )}
        </div>
      )}

      {applying && (
        <Modal title="Apply for leave" onClose={() => setApplying(false)}
          footer={<><button className="btn btn-outline-secondary" onClick={() => setApplying(false)}>Cancel</button><button className="btn btn-primary" form="leave-form" disabled={busy}>{busy ? 'Sending...' : 'Send request'}</button></>}>
          <form id="leave-form" onSubmit={apply} className="row g-3">
            <div className="col-12"><label className="form-label">Leave type</label>
              <select className="form-select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {TYPES.map((t) => <option key={t} value={t}>{t[0].toUpperCase() + t.slice(1)}{t !== 'unpaid' ? ` (${bal[t]} left)` : ''}</option>)}
              </select></div>
            <div className="col-6"><label className="form-label">From</label><input type="date" className="form-control" min={todayStr()} value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value, endDate: e.target.value > form.endDate ? e.target.value : form.endDate })} required /></div>
            <div className="col-6"><label className="form-label">To</label><input type="date" className="form-control" min={form.startDate} value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required /></div>
            <div className="col-12"><label className="form-label">Reason</label><textarea className="form-control" rows="3" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} required /></div>
          </form>
        </Modal>
      )}

      {deciding && (
        <Modal title="Review leave request" onClose={() => setDeciding(null)}
          footer={<><button className="btn btn-outline-danger" disabled={busy} onClick={() => decide('rejected')}>Reject</button><button className="btn btn-primary" disabled={busy} onClick={() => decide('approved')}>Approve</button></>}>
          <p className="mb-1"><b>{deciding.user?.name}</b> wants <b className="text-capitalize">{deciding.type}</b> leave</p>
          <p className="text-muted">{fmtDate(deciding.startDate)} to {fmtDate(deciding.endDate)} · {deciding.days} working day(s)</p>
          <p className="p-3 bg-light rounded">{deciding.reason}</p>
          <label className="form-label">Note to employee (optional)</label>
          <textarea className="form-control" rows="2" value={note} onChange={(e) => setNote(e.target.value)} />
        </Modal>
      )}
    </>
  );
}
