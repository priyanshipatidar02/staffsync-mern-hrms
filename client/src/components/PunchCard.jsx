import { useEffect, useState } from 'react';
import api, { errMsg } from '../api';
import { useToast } from '../context/ToastContext';
import { fmtTime } from '../utils';
import { StatusBadge } from './Common';

// Live clock + check in / check out. Used on the dashboard and attendance page.
export default function PunchCard({ record, onChange }) {
  const toast = useToast();
  const [now, setNow] = useState(new Date());
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const punch = async (kind) => {
    setBusy(true);
    try {
      await api.post(`/attendance/${kind}`);
      toast.success(kind === 'check-in' ? 'Checked in. Have a good day.' : 'Checked out. See you tomorrow.');
      onChange();
    } catch (e) { toast.error(errMsg(e)); }
    finally { setBusy(false); }
  };

  const done = record?.checkOut;
  return (
    <div className="punch">
      <div>
        <div className="punch-time">{now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}</div>
        <div className="punch-date">{now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
        <div className="punch-meta">
          <span>In: <b>{fmtTime(record?.checkIn)}</b></span>
          <span>Out: <b>{fmtTime(record?.checkOut)}</b></span>
          {record && <StatusBadge status={record.status} />}
        </div>
      </div>
      <div className="punch-action">
        {!record && <button className="btn btn-saffron btn-lg" disabled={busy} onClick={() => punch('check-in')}>Check in</button>}
        {record && !done && <button className="btn btn-light btn-lg" disabled={busy} onClick={() => punch('check-out')}>Check out</button>}
        {done && <span className="punch-done"><i className="bi bi-check2-circle"></i> {record.hours} hrs logged today</span>}
      </div>
    </div>
  );
}
