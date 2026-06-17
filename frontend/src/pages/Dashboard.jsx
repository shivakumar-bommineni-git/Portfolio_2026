import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { notesAPI, interviewAPI } from '../services/api';

/* ── Icons ── */
const SunIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
  </svg>
);
const MoonIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
  </svg>
);

const NAV_ITEMS = [
  {
    key: 'home', to: '/dashboard', label: 'Dashboard',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
  },
  {
    key: 'notes', to: '/notes', label: 'Notes',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
  },
  {
    key: 'interview', to: '/interview', label: 'Interview Prep',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
  },
  {
    key: 'resume', to: '/resume', label: 'Resume Builder',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/>
      </svg>
    ),
  },
  {
    key: 'portfolio-editor', to: '/portfolio-editor', label: 'Edit Portfolio',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
      </svg>
    ),
  },
  {
    key: 'learning', to: '/learning', label: 'Learning Tracker',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/>
      </svg>
    ),
  },
  {
    key: 'todos', to: '/todos', label: 'Todo Board',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
      </svg>
    ),
  },
  {
    key: 'bookmarks', to: '/bookmarks', label: 'Bookmarks',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
      </svg>
    ),
  },
  {
    key: 'projects', to: '/projects', label: 'Projects',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
      </svg>
    ),
  },
];

const DEV_LINKS = [
  { label: 'GitHub', url: 'https://github.com/shivakumar-bommineni-git/', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58 0-.29-.01-1.05-.02-2.06-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5 1 .11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 013-.4c1.02.005 2.04.14 3 .4 2.28-1.55 3.29-1.23 3.29-1.23.66 1.66.25 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.48 5.92.43.37.81 1.1.81 2.22 0 1.6-.01 2.9-.01 3.29 0 .32.21.7.82.58C20.56 21.79 24 17.3 24 12c0-6.63-5.37-12-12-12z"/></svg> },
  { label: 'MDN Docs', url: 'https://developer.mozilla.org', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg> },
  { label: 'DevDocs', url: 'https://devdocs.io', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> },
];

export function DashSidebar({ active }) {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const initials = user?.fullName?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'SB';
  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  return (
    <div className="dash-sidebar">
      {/* Identity — single unified header */}
      <div className="dash-profile" style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)' }}>
        <div className="sb-mark" style={{ width: 44, height: 44, borderRadius: 12, fontSize: '.9rem', flexShrink: 0 }}>SB</div>
        <div className="dash-profile-info">
          <div className="dash-profile-name" style={{ fontSize: '.9rem', fontWeight: 900 }}>shivakumar_dev</div>
          <div className="dash-profile-role">
            <span className="dash-profile-dot" />
            Full Stack Developer
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="dash-nav">
        <div className="dash-nav-label">Main Menu</div>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.key}
            className={`dash-nav-item ${active === item.key ? 'active' : ''}`}
            onClick={() => navigate(item.to)}
          >
            <span className="dash-nav-icon">{item.icon}</span>
            <span className="dash-nav-text">{item.label}</span>
            {active === item.key && <span className="dash-nav-pip" />}
          </button>
        ))}

        <div className="dash-nav-label" style={{ marginTop: '.5rem' }}>Quick Links</div>
        {DEV_LINKS.map((r) => (
          <a key={r.label} href={r.url} target="_blank" rel="noreferrer" className="dash-nav-item" style={{ textDecoration: 'none' }}>
            <span className="dash-nav-icon">{r.icon}</span>
            <span className="dash-nav-text">{r.label}</span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginLeft: 'auto', opacity: .4 }}>
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
          </a>
        ))}
      </nav>

      {/* Footer pinned */}
      <div className="dash-sidebar-footer">
        <button className="dash-nav-item" onClick={toggle}>
          <span className="dash-nav-icon">{theme === 'dark' ? <SunIcon /> : <MoonIcon />}</span>
          <span className="dash-nav-text">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
        <Link to="/" className="dash-nav-item" style={{ textDecoration: 'none' }}>
          <span className="dash-nav-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </span>
          <span className="dash-nav-text">View Portfolio</span>
        </Link>
        <button className="dash-nav-item dash-signout" onClick={handleLogout}>
          <span className="dash-nav-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </span>
          <span className="dash-nav-text">Sign Out</span>
        </button>
      </div>
    </div>
  );
}

/* ── Quick Action Card ── */
function ActionCard({ icon, gradient, title, desc, to, onClick }) {
  const navigate = useNavigate();
  return (
    <div className="action-card" onClick={() => onClick ? onClick() : navigate(to)}>
      <div className="action-card-icon" style={{ background: gradient }}>{icon}</div>
      <div className="action-card-body">
        <div className="action-card-title">{title}</div>
        <div className="action-card-desc">{desc}</div>
      </div>
      <div className="action-card-arrow">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </div>
    </div>
  );
}

/* ── Stat Card ── */
function StatCard({ num, label, sub, gradient, icon, onClick }) {
  return (
    <div className="stat-card-v2" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <div className="stat-card-icon" style={{ background: gradient }}>{icon}</div>
      <div className="stat-card-num">{num}</div>
      <div className="stat-card-label">{label}</div>
      {sub && <div className="stat-card-sub">{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ notes: 0, mastered: 0, total_iq: 0 });

  useEffect(() => {
    const load = async () => {
      try {
        const [nr, ir] = await Promise.all([notesAPI.getAll(), interviewAPI.getAll()]);
        const notes = nr.data.notes || [];
        const iq = ir.data.questions || [];
        setStats({ notes: notes.length, total_iq: iq.length, mastered: iq.filter((q) => q.is_mastered).length });
      } catch { /* silently fail */ }
    };
    load();
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.fullName?.split(' ')[0] || 'Shivakumar';
  const masteredPct = stats.total_iq > 0 ? Math.round((stats.mastered / stats.total_iq) * 100) : 0;

  const techStack = [
    { label: 'React', color: '#61dafb', bg: 'rgba(97,218,251,.12)' },
    { label: 'Node.js', color: '#68a063', bg: 'rgba(104,160,99,.12)' },
    { label: 'Next.js', color: 'var(--text)', bg: 'var(--surface-alt)' },
    { label: 'PostgreSQL', color: '#336791', bg: 'rgba(51,103,145,.12)' },
    { label: 'TypeScript', color: '#3178c6', bg: 'rgba(49,120,198,.12)' },
    { label: 'Express', color: 'var(--text-sec)', bg: 'var(--surface-alt)' },
    { label: 'Docker', color: '#2496ed', bg: 'rgba(36,150,237,.12)' },
    { label: 'Tailwind', color: '#38bdf8', bg: 'rgba(56,189,248,.12)' },
  ];

  const devResources = [
    { label: 'React Docs', url: 'https://react.dev', icon: '⚛️', color: '#61dafb' },
    { label: 'Node.js Docs', url: 'https://nodejs.org/docs', icon: '🟢', color: '#68a063' },
    { label: 'Next.js Docs', url: 'https://nextjs.org/docs', icon: '▲', color: '#888' },
    { label: 'PostgreSQL', url: 'https://www.postgresql.org/docs', icon: '🐘', color: '#336791' },
    { label: 'MDN Web Docs', url: 'https://developer.mozilla.org', icon: '📚', color: '#ff6900' },
    { label: 'DevDocs.io', url: 'https://devdocs.io', icon: '🔍', color: '#3d9dff' },
  ];

  return (
    <div className="dash-layout">
      <DashSidebar active="home" />
      <div className="dash-main">
        {/* Top bar */}
        <header className="dash-topbar">
          <div>
            <div className="dash-topbar-title">Dashboard</div>
            <div style={{ fontSize: '.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
          <div className="dash-topbar-right">
            <div style={{
              display: 'flex', alignItems: 'center', gap: '.5rem',
              background: 'var(--surface-alt)', border: '1px solid var(--border)',
              borderRadius: 100, padding: '.35rem .875rem',
            }}>
              <span style={{ fontSize: '.68rem', color: 'var(--success)', fontWeight: 700 }}>● LIVE</span>
              <span style={{ fontSize: '.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>Portfolio public</span>
            </div>
          </div>
        </header>

        <div className="dash-content">

          {/* Welcome Banner */}
          <div className="dash-welcome-banner">
            <div className="dash-welcome-bg" />
            <div className="dash-welcome-content">
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '.8rem', fontWeight: 600, opacity: .7, marginBottom: '.375rem' }}>
                  {greeting} 👋
                </div>
                <div style={{ fontSize: '1.7rem', fontWeight: 900, letterSpacing: '-.5px', lineHeight: 1.2, marginBottom: '.5rem' }}>
                  Welcome back, <br />{firstName}!
                </div>
                <div style={{ fontSize: '.875rem', opacity: .75, maxWidth: 360, lineHeight: 1.6 }}>
                  Your personal developer workspace — notes, prep, portfolio, all in one place.
                </div>
              </div>
              <div className="dash-welcome-avatar">{
                user?.fullName?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'SB'
              }</div>
            </div>
          </div>

          {/* Stats */}
          <div className="stats-row-v2">
            <StatCard
              num={stats.notes}
              label="Personal Notes"
              sub="Saved ideas & snippets"
              gradient="linear-gradient(135deg, #3b82f6, #2563eb)"
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>}
              onClick={() => navigate('/notes')}
            />
            <StatCard
              num={stats.total_iq}
              label="Interview Q&A"
              sub="Questions in your bank"
              gradient="linear-gradient(135deg, #8b5cf6, #7c3aed)"
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>}
              onClick={() => navigate('/interview')}
            />
            <StatCard
              num={stats.mastered}
              label="Mastered"
              sub={`${masteredPct}% completion rate`}
              gradient="linear-gradient(135deg, #10b981, #059669)"
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>}
              onClick={() => navigate('/interview')}
            />
          </div>

          {/* Mastered progress bar */}
          {stats.total_iq > 0 && (
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', padding: '1rem 1.25rem', marginBottom: '1.75rem',
              display: 'flex', alignItems: 'center', gap: '1rem',
            }}>
              <div style={{ fontSize: '.8rem', fontWeight: 700, color: 'var(--text-sec)', minWidth: 120 }}>
                Interview Progress
              </div>
              <div style={{ flex: 1, height: 8, background: 'var(--surface-alt)', borderRadius: 100, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${masteredPct}%`, background: 'linear-gradient(90deg,#10b981,#34d399)', borderRadius: 100, transition: 'width .6s ease' }} />
              </div>
              <div style={{ fontSize: '.82rem', fontWeight: 800, color: 'var(--success)', minWidth: 40, textAlign: 'right' }}>
                {masteredPct}%
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div style={{ marginBottom: '1.125rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontWeight: 800, fontSize: '.875rem' }}>Quick Actions</div>
            <span style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>Your workspace tools</span>
          </div>
          <div className="actions-grid">
            <ActionCard
              gradient="linear-gradient(135deg,#3b82f6,#2563eb)"
              icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>}
              title="Write a Note"
              desc="Capture ideas, code snippets, and thoughts"
              to="/notes"
            />
            <ActionCard
              gradient="linear-gradient(135deg,#8b5cf6,#7c3aed)"
              icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>}
              title="Interview Prep"
              desc="Practice Q&A by category and difficulty"
              to="/interview"
            />
            <ActionCard
              gradient="linear-gradient(135deg,#f59e0b,#d97706)"
              icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>}
              title="Build Resume"
              desc="Create and print your professional resume"
              to="/resume"
            />
            <ActionCard
              gradient="linear-gradient(135deg,#10b981,#059669)"
              icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>}
              title="Edit Portfolio"
              desc="Update your public portfolio content & colors"
              to="/portfolio-editor"
            />
          </div>

          {/* Tech Stack */}
          <div style={{ marginTop: '2rem', marginBottom: '1.125rem', fontWeight: 800, fontSize: '.875rem' }}>Tech Stack</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.625rem', marginBottom: '2rem' }}>
            {techStack.map((t) => (
              <div key={t.label} style={{
                display: 'flex', alignItems: 'center', gap: '.4rem',
                padding: '.35rem .875rem', borderRadius: 100,
                background: t.bg, border: `1px solid ${t.color}30`,
                fontSize: '.8rem', fontWeight: 700, color: t.color,
              }}>
                {t.label}
              </div>
            ))}
          </div>

          {/* Dev Resources */}
          <div style={{ marginBottom: '1.125rem', fontWeight: 800, fontSize: '.875rem' }}>Developer Resources</div>
          <div className="dev-resources-grid">
            {devResources.map((r) => (
              <a key={r.label} href={r.url} target="_blank" rel="noreferrer" className="dev-resource-card">
                <div className="dev-resource-icon">{r.icon}</div>
                <span className="dev-resource-label">{r.label}</span>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="dev-resource-arrow">
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
              </a>
            ))}
          </div>

          {/* Footer note */}
          <div style={{
            marginTop: '2.5rem', padding: '1rem 1.5rem',
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', gap: '1rem',
          }}>
            <div className="badge-dot" style={{ width: 8, height: 8 }} />
            <span style={{ fontSize: '.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              Portfolio is live and publicly accessible · All tools are private and secure
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
