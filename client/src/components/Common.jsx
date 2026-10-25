import { initials } from '../utils';

export const StatusBadge = ({ status }) => <span className={`status status-${String(status).replace(' ', '-')}`}>{status}</span>;

export const Avatar = ({ name, size = 36 }) => (
  <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.38 }}>{initials(name)}</span>
);

export const PageHeader = ({ title, subtitle, children }) => (
  <div className="page-header">
    <div>
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
    </div>
    <div className="d-flex gap-2 flex-wrap">{children}</div>
  </div>
);

export const Loading = () => (
  <div className="d-flex justify-content-center py-5"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading</span></div></div>
);

export const Empty = ({ icon = 'bi-inbox', title, hint }) => (
  <div className="empty">
    <i className={`bi ${icon}`}></i>
    <strong>{title}</strong>
    {hint && <span>{hint}</span>}
  </div>
);

export const Tabs = ({ tabs, active, onChange }) => (
  <div className="tabs" role="tablist">
    {tabs.map((t) => (
      <button key={t.key} role="tab" aria-selected={active === t.key} className={active === t.key ? 'active' : ''} onClick={() => onChange(t.key)}>
        {t.label}{t.count > 0 && <span className="tab-count">{t.count}</span>}
      </button>
    ))}
  </div>
);
