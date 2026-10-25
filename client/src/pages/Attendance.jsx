import { useCallback, useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import PunchCard from '../components/PunchCard';
import { Empty, Loading, PageHeader, StatusBadge, Tabs, Avatar } from '../components/Common';
import { fmtTime, todayStr } from '../utils';

const fmtDay = (s) => new Date(s + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' });

export default function Attendance() {
  const { user } = useAuth();
  const canManage = user.role !== 'employee';
  const [tab, setTab] = useState('mine');
  const [month, setMonth] = useState(todayStr().slice(0, 7));
  const [records, setRecords] = useState(null);
  const [today, setToday] = useState(null);
  const [date, setDate] = useState(todayStr());
  const [team, setTeam] = useState(null);

  const loadMine = useCallback(async () => {
    const { data } = await api.get('/attendance/mine', { params: { month } });
    setRecords(data.records);
    if (month === todayStr().slice(0, 7)) setToday(data.records.find((r) => r.date === todayStr()) || null);
  }, [month]);

  const loadToday = useCallback(async () => {
    const { data } = await api.get('/attendance/mine', { params: { month: todayStr().slice(0, 7) } });
    setToday(data.records.find((r) => r.date === todayStr()) || null);
  }, []);

  useEffect(() => { loadMine(); }, [loadMine]);
  useEffect(() => { loadToday(); }, [loadToday]);
  useEffect(() => {
    if (canManage && tab === 'team') api.get('/attendance/team', { params: { date } }).then((r) => setTeam(r.data.rows));
  }, [canManage, tab, date]);

  const onPunch = () => { loadMine(); loadToday(); };
  const present = records?.filter((r) => r.status === 'present').length || 0;
  const late = records?.filter((r) => r.status === 'late').length || 0;
  const totalHours = (records || []).reduce((s, r) => s + (r.hours || 0), 0);

  return (
    <>
      <PageHeader title="Attendance" subtitle="Check in when you start and check out when you finish. Check-ins after 9:30 AM are marked late." />
      <PunchCard record={today} onChange={onPunch} />

      {canManage && <div className="mt-4"><Tabs active={tab} onChange={setTab} tabs={[{ key: 'mine', label: 'My records' }, { key: 'team', label: user.role === 'hr' ? 'Everyone' : 'My team' }]} /></div>}

      {tab === 'mine' && (
        <div className="mt-3">
          <div className="toolbar">
            <input type="month" className="form-control" style={{ maxWidth: 200 }} value={month} max={todayStr().slice(0, 7)} onChange={(e) => setMonth(e.target.value)} aria-label="Month" />
            <div className="chips"><span className="chip">{present} on time</span><span className="chip warn">{late} late</span><span className="chip">{totalHours.toFixed(1)} hrs</span></div>
          </div>
          {!records ? <Loading /> : records.length === 0 ? <Empty icon="bi-clock-history" title="No records this month" hint="Your check-ins will appear here." /> : (
            <div className="table-wrap"><table className="table mb-0">
              <thead><tr><th>Date</th><th>Check in</th><th>Check out</th><th>Hours</th><th>Status</th></tr></thead>
              <tbody>{records.map((r) => (
                <tr key={r._id}><td>{fmtDay(r.date)}</td><td>{fmtTime(r.checkIn)}</td><td>{fmtTime(r.checkOut)}</td><td>{r.hours || '-'}</td><td><StatusBadge status={r.status} /></td></tr>
              ))}</tbody>
            </table></div>
          )}
        </div>
      )}

      {tab === 'team' && (
        <div className="mt-3">
          <div className="toolbar"><input type="date" className="form-control" style={{ maxWidth: 200 }} value={date} max={todayStr()} onChange={(e) => setDate(e.target.value)} aria-label="Date" /></div>
          {!team ? <Loading /> : team.length === 0 ? <Empty icon="bi-people" title="Nobody to show" hint="People assigned to you will appear here." /> : (
            <div className="table-wrap"><table className="table align-middle mb-0">
              <thead><tr><th>Name</th><th>Department</th><th>Check in</th><th>Check out</th><th>Hours</th><th>Status</th></tr></thead>
              <tbody>{team.map((r) => (
                <tr key={r.user._id}>
                  <td><div className="d-flex align-items-center gap-2"><Avatar name={r.user.name} size={30} />{r.user.name}</div></td>
                  <td>{r.user.department}</td><td>{fmtTime(r.checkIn)}</td><td>{fmtTime(r.checkOut)}</td><td>{r.hours || '-'}</td><td><StatusBadge status={r.status} /></td>
                </tr>
              ))}</tbody>
            </table></div>
          )}
        </div>
      )}
    </>
  );
}
