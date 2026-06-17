import { useState, useEffect } from 'react';
import { DashSidebar } from './Dashboard';
import { learningAPI } from '../services/api';

const TYPES = ['course', 'book', 'video', 'playlist', 'article', 'other'];
const STATUSES = ['active', 'completed', 'paused'];
const STATUS_META = {
  active:    { label: 'Active',    color: '#3b82f6', bg: 'rgba(59,130,246,.12)' },
  completed: { label: 'Completed', color: '#10b981', bg: 'rgba(16,185,129,.12)' },
  paused:    { label: 'Paused',    color: '#f59e0b', bg: 'rgba(245,158,11,.12)' },
};
const TYPE_ICON = { course: '🎓', book: '📚', video: '🎥', playlist: '▶️', article: '📄', other: '🔗' };

const EMPTY = { name: '', type: 'course', url: '', total_units: '', completed_units: '', status: 'active', notes: '', tags: '' };

function Modal({ form, setForm, onSave, onClose, saving }) {
  const pct = form.total_units > 0 ? Math.min(100, Math.round((form.completed_units / form.total_units) * 100)) : 0;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
        <div style={{ fontWeight: 900, fontSize: '1.1rem', marginBottom: '1.5rem' }}>
          {form.id ? 'Edit Resource' : 'Add Learning Resource'}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.875rem' }}>
          <div className="form-group" style={{ gridColumn: '1/-1', margin: 0 }}>
            <label className="form-label">Resource Name *</label>
            <input className="form-input" placeholder="e.g. React Complete Guide" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Type</label>
            <select className="filter-select" style={{ width: '100%' }} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {TYPES.map((t) => <option key={t} value={t}>{TYPE_ICON[t]} {t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Status</label>
            <select className="filter-select" style={{ width: '100%' }} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {STATUSES.map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ gridColumn: '1/-1', margin: 0 }}>
            <label className="form-label">URL</label>
            <input className="form-input" placeholder="https://..." value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Total Lessons / Pages</label>
            <input className="form-input" type="number" min="0" placeholder="e.g. 40" value={form.total_units} onChange={(e) => setForm({ ...form, total_units: e.target.value })} />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Completed</label>
            <input className="form-input" type="number" min="0" placeholder="e.g. 14" value={form.completed_units} onChange={(e) => setForm({ ...form, completed_units: e.target.value })} />
          </div>

          {form.total_units > 0 && (
            <div style={{ gridColumn: '1/-1' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.75rem', fontWeight: 700, marginBottom: '.3rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Progress preview</span>
                <span style={{ color: 'var(--primary)' }}>{pct}%</span>
              </div>
              <div style={{ height: 6, background: 'var(--surface-alt)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,#3b82f6,#8b5cf6)', borderRadius: 3 }} />
              </div>
            </div>
          )}

          <div className="form-group" style={{ gridColumn: '1/-1', margin: 0 }}>
            <label className="form-label">Notes</label>
            <textarea className="form-textarea" rows={3} placeholder="Any notes about this resource..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} style={{ minHeight: 70 }} />
          </div>
          <div className="form-group" style={{ gridColumn: '1/-1', margin: 0 }}>
            <label className="form-label">Tags (comma separated)</label>
            <input className="form-input" placeholder="React, Frontend, Udemy" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={onSave} disabled={saving || !form.name.trim()}>
            {saving ? 'Saving…' : form.id ? 'Save Changes' : 'Add Resource'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LearningTracker() {
  const [resources, setResources] = useState([]);
  const [filter, setFilter]       = useState('all');
  const [search, setSearch]       = useState('');
  const [form, setForm]           = useState(null);
  const [saving, setSaving]       = useState(false);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    learningAPI.getAll()
      .then((r) => setResources(r.data.resources || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const payload = { ...form, tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [], total_units: Number(form.total_units) || 0, completed_units: Number(form.completed_units) || 0 };
      if (form.id) {
        const r = await learningAPI.update(form.id, payload);
        setResources((prev) => prev.map((x) => x.id === form.id ? r.data.resource : x));
      } else {
        const r = await learningAPI.create(payload);
        setResources((prev) => [r.data.resource, ...prev]);
      }
      setForm(null);
    } catch { /* ignore */ } finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!confirm('Delete this resource?')) return;
    await learningAPI.delete(id).catch(() => {});
    setResources((prev) => prev.filter((x) => x.id !== id));
  };

  const quickProgress = async (res, delta) => {
    const newCompleted = Math.max(0, Math.min(res.total_units || 999, (res.completed_units || 0) + delta));
    const r = await learningAPI.update(res.id, { ...res, completed_units: newCompleted }).catch(() => null);
    if (r) setResources((prev) => prev.map((x) => x.id === res.id ? r.data.resource : x));
  };

  const filtered = resources.filter((r) => {
    if (filter !== 'all' && r.status !== filter) return false;
    if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const stats = {
    total: resources.length,
    active: resources.filter((r) => r.status === 'active').length,
    completed: resources.filter((r) => r.status === 'completed').length,
    paused: resources.filter((r) => r.status === 'paused').length,
  };

  return (
    <div className="dash-layout">
      <DashSidebar active="learning" />
      <div className="dash-main">
        <header className="dash-topbar">
          <div>
            <div className="dash-topbar-title">Learning Tracker</div>
            <div style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>Track your courses, books, and playlists</div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setForm({ ...EMPTY })}>+ Add Resource</button>
        </header>

        <div className="dash-content">
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            {[
              { label: 'Total', num: stats.total, color: '#3b82f6' },
              { label: 'Active', num: stats.active, color: '#3b82f6' },
              { label: 'Completed', num: stats.completed, color: '#10b981' },
              { label: 'Paused', num: stats.paused, color: '#f59e0b' },
            ].map((s) => (
              <div key={s.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.125rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.75rem', fontWeight: 900, color: s.color }}>{s.num}</div>
                <div style={{ fontSize: '.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="filter-bar">
            <input className="form-input" placeholder="Search resources..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 280 }} />
            <div style={{ display: 'flex', gap: '.4rem' }}>
              {['all', ...STATUSES].map((s) => (
                <button key={s} onClick={() => setFilter(s)} style={{
                  padding: '.4rem .875rem', borderRadius: 100, border: '1.5px solid',
                  borderColor: filter === s ? 'var(--primary)' : 'var(--border)',
                  background: filter === s ? 'var(--primary-lt)' : 'transparent',
                  color: filter === s ? 'var(--primary)' : 'var(--text-muted)',
                  fontWeight: 700, fontSize: '.78rem', cursor: 'pointer', fontFamily: 'inherit',
                }}>
                  {s === 'all' ? 'All' : STATUS_META[s].label}
                </button>
              ))}
            </div>
          </div>

          {/* Grid */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading…</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '.75rem' }}>📚</div>
              <div style={{ fontWeight: 700, marginBottom: '.375rem' }}>No resources found</div>
              <div style={{ fontSize: '.85rem' }}>Add your first course, book, or playlist!</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '1rem' }}>
              {filtered.map((res) => {
                const pct = res.total_units > 0 ? Math.min(100, Math.round((res.completed_units / res.total_units) * 100)) : 0;
                const sm = STATUS_META[res.status] || STATUS_META.active;
                return (
                  <div key={res.id} style={{
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)', padding: '1.25rem',
                    display: 'flex', flexDirection: 'column', gap: '.75rem',
                    transition: 'all .15s',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', gap: '.5rem', alignItems: 'flex-start', flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>{TYPE_ICON[res.type] || '🔗'}</span>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 800, fontSize: '.925rem', marginBottom: '.15rem', wordBreak: 'break-word' }}>{res.name}</div>
                          <div style={{ fontSize: '.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'capitalize' }}>{res.type}</div>
                        </div>
                      </div>
                      <span style={{ background: sm.bg, color: sm.color, borderRadius: 100, padding: '.2rem .6rem', fontSize: '.68rem', fontWeight: 800, flexShrink: 0, marginLeft: '.5rem' }}>
                        {sm.label}
                      </span>
                    </div>

                    {/* Progress */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.72rem', fontWeight: 700, marginBottom: '.3rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>{res.completed_units} / {res.total_units || '?'} {res.type === 'book' ? 'pages' : 'lessons'}</span>
                        <span style={{ color: sm.color }}>{res.total_units > 0 ? `${pct}%` : '—'}</span>
                      </div>
                      <div style={{ height: 6, background: 'var(--surface-alt)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg,${sm.color},${sm.color}aa)`, borderRadius: 3, transition: 'width .3s' }} />
                      </div>
                    </div>

                    {/* Quick +/- */}
                    <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
                      <button onClick={() => quickProgress(res, -1)} style={{ width: 28, height: 28, borderRadius: 7, border: '1.5px solid var(--border)', background: 'var(--surface-alt)', cursor: 'pointer', fontSize: '.9rem', fontWeight: 700, color: 'var(--text-sec)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                      <span style={{ fontSize: '.75rem', color: 'var(--text-muted)', flex: 1, textAlign: 'center' }}>Progress</span>
                      <button onClick={() => quickProgress(res, 1)} style={{ width: 28, height: 28, borderRadius: 7, border: '1.5px solid var(--border)', background: 'var(--primary-lt)', cursor: 'pointer', fontSize: '.9rem', fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                    </div>

                    {res.notes && <div style={{ fontSize: '.78rem', color: 'var(--text-muted)', lineHeight: 1.5, background: 'var(--surface-alt)', borderRadius: 8, padding: '.5rem .75rem' }}>{res.notes}</div>}

                    {res.tags?.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.3rem' }}>
                        {res.tags.map((t) => <span key={t} className="note-tag">{t}</span>)}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '.5rem', paddingTop: '.25rem' }}>
                      {res.url && <a href={res.url} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" style={{ flex: 1, textAlign: 'center' }}>Open ↗</a>}
                      <button className="btn btn-ghost btn-sm" onClick={() => setForm({ ...res, tags: (res.tags || []).join(', ') })}>Edit</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => remove(res.id)} style={{ color: 'var(--error)' }}>Delete</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {form && <Modal form={form} setForm={setForm} onSave={save} onClose={() => setForm(null)} saving={saving} />}
    </div>
  );
}
