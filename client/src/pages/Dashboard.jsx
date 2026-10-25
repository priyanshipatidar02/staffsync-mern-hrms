import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import PunchCard from '../components/PunchCard';
import { Loading, PageHeader } from '../components/Common';
import { fmtDateTz } from '../utils';

const Stat = ({ icon, label, value, to }) => {
  const body = (
    <div className="stat">
      <i className={`bi ${icon}`}></i>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
  return to ? <Link to={to} className="text-decoration-none">{body}</Link> : body;
};

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);

  const load = useCallback(() => api.get('/dashboard').then((r) => setData(r.data)), []);
  useEffect(() => { load(); }, [load]);

  if (!data) return <Loading />;
  const { stats, leaveBalance } = data;
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <>
      <PageHeader title={`${greet}, ${user.name.split(' ')[0]}`} subtitle={`${user.designation} · ${user.department}`} />
      <PunchCard record={data.today} onChange={load} />

      <div className="row g-3 mt-1">
        {user.role === 'hr' && <>
          <div className="col-6 col-lg-3"><Stat icon="bi-people" label="Active employees" value={stats.totalEmployees} to="/employees" /></div>
          <div className="col-6 col-lg-3"><Stat icon="bi-person-check" label="Checked in today" value={stats.presentToday} to="/attendance" /></div>
          <div className="col-6 col-lg-3"><Stat icon="bi-airplane" label="On leave today" value={stats.onLeaveToday} /></div>
          <div className="col-6 col-lg-3"><Stat icon="bi-hourglass-split" label="Leave awaiting approval" value={stats.pendingApprovals} to="/leaves" /></div>
        </>}
        {user.role === 'manager' && <>
          <div className="col-6 col-lg-4"><Stat icon="bi-people" label="People on your team" value={stats.teamSize} to="/employees" /></div>
          <div className="col-6 col-lg-4"><Stat icon="bi-person-check" label="Team checked in today" value={stats.presentToday} to="/attendance" /></div>
          <div className="col-12 col-lg-4"><Stat icon="bi-hourglass-split" label="Leave awaiting your approval" value={stats.pendingApprovals} to="/leaves" /></div>
        </>}
        {user.role === 'employee' && <>
          <div className="col-6 col-lg-4"><Stat icon="bi-calendar-check" label="Days present this month" value={stats.daysPresent} to="/attendance" /></div>
          <div className="col-6 col-lg-4"><Stat icon="bi-hourglass-split" label="Leave requests pending" value={data.pendingMine} to="/leaves" /></div>
          <div className="col-12 col-lg-4"><Stat icon="bi-mortarboard" label="Trainings you joined" value={stats.upcomingTrainings} to="/training" /></div>
        </>}
      </div>

      <div className="row g-3 mt-1">
        <div className="col-lg-5">
          <div className="panel h-100">
            <h2>Your leave balance</h2>
            {Object.entries(leaveBalance).map(([k, v]) => (
              <div key={k} className="balance-row">
                <span className="text-capitalize">{k}</span>
                <div className="balance-bar"><span style={{ width: `${Math.min(100, (v / { annual: 18, sick: 10, casual: 8 }[k]) * 100)}%` }}></span></div>
                <b>{v} days</b>
              </div>
            ))}
            <Link to="/leaves" className="btn btn-outline-primary btn-sm mt-3">Apply for leave</Link>
          </div>
        </div>
        <div className="col-lg-7">
          <div className="panel h-100">
            <div className="d-flex justify-content-between align-items-center"><h2>Latest announcements</h2><Link to="/announcements">View all</Link></div>
            {data.announcements.length === 0 && <p className="text-muted mb-0">No announcements yet.</p>}
            {data.announcements.map((a) => (
              <div key={a._id} className="mini-post">
                <div className="d-flex justify-content-between gap-2"><strong>{a.title}</strong><small className="text-muted text-nowrap">{fmtDateTz(a.createdAt)}</small></div>
                <p className="mb-0 text-muted">{a.body.length > 120 ? a.body.slice(0, 120) + '...' : a.body}</p>
              </div>
            ))}
          </div>
        </div>
        {user.role === 'hr' && stats.departments?.length > 0 && (
          <div className="col-12">
            <div className="panel">
              <h2>People by department</h2>
              <div className="dept-grid">
                {stats.departments.map((d) => (
                  <div key={d._id} className="dept"><b>{d.count}</b><span>{d._id}</span></div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
