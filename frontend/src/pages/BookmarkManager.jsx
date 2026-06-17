import { useState, useEffect } from 'react';
import { DashSidebar } from './Dashboard';
import { bookmarkAPI } from '../services/api';

const EMPTY = { url: '', title: '', description: '', tags: '' };

function Modal({ form, setForm, onSave, onClose, saving }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div style={{ fontWeight: 900, fontSize: '1.1rem', marginBottom: '1.5rem' }}>
          {form.id ? 'Edit Bookmark' : 'Add Bookmark'}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.875rem' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">URL *</label>
            <input className="form-input" placeholder="https://..." value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
            {!form.id && <div style={{ fontSize: '.7rem', color: 'var(--text-muted)', marginTop: '.25rem' }}>Title will be fetched automatically</div>}
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">{form.id ? 'Title' : 'Title (optional override)'}</label>
            <input className="form-input" placeholder="Auto-fetched from URL" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Description</label>
            <textarea className="form-textarea" rows={2} placeholder="What's this link about?" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ minHeight: 60 }} />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Tags (comma separated)</label>
            <input className="form-input" placeholder="React, Docs, Tutorial" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={onSave} disabled={saving || !form.url.trim()}>
            {saving ? (form.id ? 'Saving…' : 'Fetching & Saving…') : form.id ? 'Save Changes' : 'Add Bookmark'}
          </button>
        </div>
      </div>
    </div>
  );
}

function BookmarkCard({ bm, onEdit, onDelete }) {
  const favicon = bm.favicon_url || `https://www.google.com/s2/favicons?domain=${new URL(bm.url).hostname}&sz=32`;
  const domain = new URL(bm.url).hostname.replace('www.', '');
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
      padding: '1rem 1.125rem', display: 'flex', flexDirection: 'column', gap: '.625rem',
      transition: 'border-color .15s',
    }}>
      <div style={{ display: 'flex', gap: '.625rem', alignItems: 'flex-start' }}>
        <img src={favicon} alt="" width={20} height={20} style={{ borderRadius: 4, flexShrink: 0, marginTop: 2, objectFit: 'contain' }} onError={(e) => { e.target.style.display = 'none'; }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <a href={bm.url} target="_blank" rel="noreferrer" style={{ fontWeight: 800, fontSize: '.9rem', color: 'var(--text)', textDecoration: 'none', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {bm.title || bm.url}
          </a>
          <div style={{ fontSize: '.72rem', color: 'var(--primary)', fontWeight: 600, marginTop: '.1rem' }}>{domain}</div>
        </div>
      </div>
      {bm.description && <div style={{ fontSize: '.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{bm.description}</div>}
      {bm.tags?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.25rem' }}>
          {bm.tags.map((t) => <span key={t} className="note-tag">{t}</span>)}
        </div>
      )}
      <div style={{ display: 'flex', gap: '.4rem', paddingTop: '.1rem' }}>
        <a href={bm.url} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" style={{ flex: 1, textAlign: 'center' }}>Open ↗</a>
        <button className="btn btn-ghost btn-sm" onClick={() => onEdit(bm)}>Edit</button>
        <button className="btn btn-ghost btn-sm" onClick={() => onDelete(bm.id)} style={{ color: 'var(--error)' }}>✕</button>
      </div>
    </div>
  );
}

export default function BookmarkManager() {
  const [bookmarks, setBookmarks] = useState([]);
  const [search, setSearch]       = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [form, setForm]           = useState(null);
  const [saving, setSaving]       = useState(false);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    bookmarkAPI.getAll()
      .then((r) => setBookmarks(r.data.bookmarks || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const allTags = [...new Set(bookmarks.flatMap((b) => b.tags || []))].sort();

  const save = async () => {
    if (!form.url.trim()) return;
    setSaving(true);
    try {
      const payload = { ...form, tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [] };
      if (form.id) {
        const r = await bookmarkAPI.update(form.id, payload);
        setBookmarks((prev) => prev.map((x) => x.id === form.id ? r.data.bookmark : x));
      } else {
        const r = await bookmarkAPI.create(payload);
        setBookmarks((prev) => [r.data.bookmark, ...prev]);
      }
      setForm(null);
    } catch { /* ignore */ } finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!confirm('Delete this bookmark?')) return;
    await bookmarkAPI.delete(id).catch(() => {});
    setBookmarks((prev) => prev.filter((x) => x.id !== id));
  };

  const filtered = bookmarks.filter((b) => {
    const q = search.toLowerCase();
    if (q && !b.title?.toLowerCase().includes(q) && !b.url?.toLowerCase().includes(q) && !b.description?.toLowerCase().includes(q)) return false;
    if (tagFilter && !(b.tags || []).includes(tagFilter)) return false;
    return true;
  });

  return (
    <div className="dash-layout">
      <DashSidebar active="bookmarks" />
      <div className="dash-main">
        <header className="dash-topbar">
          <div>
            <div className="dash-topbar-title">Bookmark Manager</div>
            <div style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>{bookmarks.length} bookmarks saved</div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setForm({ ...EMPTY })}>+ Add Bookmark</button>
        </header>

        <div className="dash-content">
          {/* Filters */}
          <div className="filter-bar" style={{ flexWrap: 'wrap' }}>
            <input className="form-input" placeholder="Search bookmarks..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 280 }} />
            {allTags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.4rem' }}>
                <button onClick={() => setTagFilter('')} style={{
                  padding: '.35rem .75rem', borderRadius: 100, border: '1.5px solid',
                  borderColor: !tagFilter ? 'var(--primary)' : 'var(--border)',
                  background: !tagFilter ? 'var(--primary-lt)' : 'transparent',
                  color: !tagFilter ? 'var(--primary)' : 'var(--text-muted)',
                  fontWeight: 700, fontSize: '.75rem', cursor: 'pointer', fontFamily: 'inherit',
                }}>All</button>
                {allTags.map((t) => (
                  <button key={t} onClick={() => setTagFilter(tagFilter === t ? '' : t)} style={{
                    padding: '.35rem .75rem', borderRadius: 100, border: '1.5px solid',
                    borderColor: tagFilter === t ? 'var(--primary)' : 'var(--border)',
                    background: tagFilter === t ? 'var(--primary-lt)' : 'transparent',
                    color: tagFilter === t ? 'var(--primary)' : 'var(--text-muted)',
                    fontWeight: 700, fontSize: '.75rem', cursor: 'pointer', fontFamily: 'inherit',
                  }}>{t}</button>
                ))}
              </div>
            )}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading…</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '.75rem' }}>🔖</div>
              <div style={{ fontWeight: 700, marginBottom: '.375rem' }}>{search || tagFilter ? 'No bookmarks match' : 'No bookmarks yet'}</div>
              <div style={{ fontSize: '.85rem' }}>{search || tagFilter ? 'Try a different search or tag' : 'Add your first bookmark!'}</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '1rem' }}>
              {filtered.map((bm) => {
                try { return <BookmarkCard key={bm.id} bm={bm} onEdit={(b) => setForm({ ...b, tags: (b.tags || []).join(', ') })} onDelete={remove} />; }
                catch { return null; }
              })}
            </div>
          )}
        </div>
      </div>
      {form && <Modal form={form} setForm={setForm} onSave={save} onClose={() => setForm(null)} saving={saving} />}
    </div>
  );
}
