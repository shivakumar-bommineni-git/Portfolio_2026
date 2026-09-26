const fs = require('fs');

let code = fs.readFileSync('src/pages/Dashboard.jsx', 'utf8');

// 1. Add state for popovers
const stateHook = "const [stats, setStats] = useState({ notes: 0, mastered: 0, total_iq: 0, projects: 0 });";
if (!code.includes("showNotif")) {
  code = code.replace(
    stateHook,
    `${stateHook}\n  const [showNotif, setShowNotif] = useState(false);\n  const [showProfile, setShowProfile] = useState(false);`
  );
}

// 2. Fix Bell Icon and add Popovers to the Topbar
const topbarRightStart = code.indexOf('<div className="dash-topbar-right"');
const topbarRightEnd = code.indexOf('</header>');

if (topbarRightStart !== -1 && topbarRightEnd !== -1) {
  const newTopbarRight = `<div className="dash-topbar-right" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', position: 'relative' }}>
            
            {/* Notification Bell */}
            <div style={{ position: 'relative' }}>
              <div 
                onClick={() => { setShowNotif(!showNotif); setShowProfile(false); }}
                style={{ position: 'relative', cursor: 'pointer', color: showNotif ? 'var(--primary)' : 'var(--text-sec)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '.25rem' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                <div style={{
                  position: 'absolute', top: -2, right: -4, background: '#f59e0b',
                  color: '#fff', fontSize: '9px', fontWeight: 800, padding: '1.5px 4.5px',
                  borderRadius: '100px', lineHeight: 1, border: '2px solid var(--surface)'
                }}>99+</div>
              </div>

              {/* Notifications Popover */}
              {showNotif && (
                <div style={{
                  position: 'absolute', top: '100%', right: -10, marginTop: '1rem',
                  width: 380, background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 16, boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
                  zIndex: 100, overflow: 'hidden', display: 'flex', flexDirection: 'column'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                      <span style={{ fontWeight: 800, color: 'var(--text)', fontSize: '1.05rem' }}>Notifications</span>
                      <span style={{ background: '#fef3c7', color: '#d97706', fontSize: '.75rem', fontWeight: 800, padding: '.2rem .6rem', borderRadius: 100 }}>99+ new</span>
                    </div>
                    <span style={{ fontSize: '.8rem', color: '#d97706', fontWeight: 600, cursor: 'pointer' }}>Mark all read</span>
                  </div>
                  
                  <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', gap: '1rem', cursor: 'pointer' }} onMouseOver={e => e.currentTarget.style.background='var(--surface-alt)'} onMouseOut={e => e.currentTarget.style.background='transparent'}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6', marginTop: '.4rem', flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.25rem' }}>
                            <div style={{ fontWeight: 700, fontSize: '.9rem', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200 }}>
                              Deepak Shetty (Manager) has l...
                            </div>
                            <div style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>{i === 1 ? 'Just now' : \`\${i*5 + 12}h ago\`}</div>
                          </div>
                          <div style={{ fontSize: '.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 260 }}>
                            Manager Deepak Shetty is now activ...
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div style={{ padding: '1rem', textAlign: 'center', borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
                    <span style={{ color: '#d97706', fontWeight: 700, fontSize: '.85rem', cursor: 'pointer' }}>View all notifications</span>
                  </div>
                </div>
              )}
            </div>

            {/* Theme Toggle */}
            <div onClick={toggle} style={{ cursor: 'pointer', color: 'var(--text-sec)', padding: '.25rem' }}>
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </div>

            {/* User Pill */}
            <div style={{ position: 'relative' }}>
              <div 
                onClick={() => { setShowProfile(!showProfile); setShowNotif(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '.625rem',
                  background: showProfile ? 'var(--surface-alt)' : 'transparent', 
                  border: showProfile ? '1px solid var(--primary)' : '1px solid var(--border)',
                  borderRadius: 100, padding: '.25rem .875rem .25rem .25rem',
                  cursor: 'pointer', marginLeft: '.25rem',
                  backgroundColor: 'var(--surface)', transition: 'all .2s'
                }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', background: '#d97706',
                  color: '#fff', fontSize: '.8rem', fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  DS
                </div>
                <span style={{ fontSize: '.85rem', fontWeight: 700, color: 'var(--text)' }}>Admin</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5" style={{ transform: showProfile ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}><polyline points="6 9 12 15 18 9"/></svg>
              </div>

              {/* Profile Popover */}
              {showProfile && (
                <div style={{
                  position: 'absolute', top: '100%', right: 0, marginTop: '1rem',
                  width: 320, background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 16, boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
                  zIndex: 100, padding: '1.25rem'
                }}>
                  {/* User Info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#d97706', color: '#fff', fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      DS
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, color: 'var(--text)', fontSize: '1.05rem', marginBottom: '.15rem' }}>Deepak Shetty</div>
                      <div style={{ fontSize: '.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '.35rem' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        deepak.s@jcb.com
                      </div>
                    </div>
                  </div>

                  <div style={{ height: 1, background: 'var(--border)', margin: '0 -1.25rem 1rem' }} />

                  {/* Switch Role */}
                  <div style={{ fontSize: '.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '.75rem' }}>Switch Role</div>
                  <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1.25rem' }}>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.4rem', background: '#4f46e5', color: '#fff', padding: '.6rem 0', borderRadius: 100, fontSize: '.8rem', fontWeight: 700, cursor: 'pointer' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                      Admin
                    </div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.4rem', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-sec)', padding: '.6rem 0', borderRadius: 100, fontSize: '.8rem', fontWeight: 600, cursor: 'pointer' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                      Manager
                    </div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.4rem', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-sec)', padding: '.6rem 0', borderRadius: 100, fontSize: '.8rem', fontWeight: 600, cursor: 'pointer' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
                      Trainer
                    </div>
                  </div>

                  <div style={{ height: 1, background: 'var(--border)', margin: '0 -1.25rem 1rem' }} />

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '.75rem' }}>
                    <button style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem', padding: '.75rem', background: 'transparent', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--text-sec)', fontSize: '.9rem', fontWeight: 600, cursor: 'pointer' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                      Settings
                    </button>
                    <button style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem', padding: '.75rem', background: '#ef4444', border: 'none', borderRadius: 12, color: '#fff', fontSize: '.9rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>`;
  
  code = code.slice(0, topbarRightStart) + newTopbarRight + '\n        ' + code.slice(topbarRightEnd);
}

fs.writeFileSync('src/pages/Dashboard.jsx', code, 'utf8');
