import { useState, useEffect } from 'react';
import { DashSidebar } from './Dashboard';
import { notesAPI } from '../services/api';

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
    <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
  </svg>
);
const XIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const EMPTY = { title: '', content: '', tags: '' };

function NoteModal({ note, onClose, onSave }) {
  const [form, setForm] = useState(note ? { title: note.title, content: note.content || '', tags: (note.tags || []).join(', ') } : EMPTY);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSave = async () => {
    if (!form.title.trim()) { setErr('Title is required'); return; }
    setSaving(true); setErr('');
    try {
      const payload = {
        title: form.title.trim(),
        content: form.content.trim(),
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      };
      if (note) {
        await notesAPI.update(note.id, payload);
      } else {
        await notesAPI.create(payload);
      }
      onSave();
    } catch {
      setErr('Failed to save note. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div className="modal-title" style={{ margin: 0 }}>{note ? 'Edit Note' : 'New Note'}</div>
          <button className="btn-ghost btn-sm" onClick={onClose}><XIcon /></button>
        </div>

        {err && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{err}</div>}

        <div className="form-group">
          <label className="form-label">Title *</label>
          <input className="form-input" value={form.title} onChange={set('title')} placeholder="Note title..." autoFocus />
        </div>
        <div className="form-group">
          <label className="form-label">Content</label>
          <textarea className="form-textarea" value={form.content} onChange={set('content')}
            placeholder="Write your note here... (supports multi-line text, code snippets, etc.)"
            style={{ minHeight: 200 }} />
        </div>
        <div className="form-group">
          <label className="form-label">Tags (comma-separated)</label>
          <input className="form-input" value={form.tags} onChange={set('tags')} placeholder="react, node, api, tips..." />
        </div>

        <div className="modal-footer">
          <button className="btn btn-outline btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
            {saving ? <><div className="spinner" style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,.4)', borderTopColor: '#fff' }} /> Saving…</> : (note ? 'Save Changes' : 'Create Note')}
          </button>
        </div>
      </div>
    </div>
  );
}

function ViewModal({ note, onClose, onEdit, onDelete }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm('Delete this note? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await notesAPI.delete(note.id);
      onDelete();
    } catch {
      setDeleting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 640 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{note.title}</h2>
          <button className="btn-ghost btn-sm" onClick={onClose}><XIcon /></button>
        </div>

        {note.tags?.length > 0 && (
          <div className="note-tags" style={{ marginBottom: '1rem' }}>
            {note.tags.map((t) => <span key={t} className="note-tag">{t}</span>)}
          </div>
        )}

        <div style={{
          background: 'var(--bg-alt)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)', padding: '1rem',
          fontSize: '.875rem', color: 'var(--text-sec)', lineHeight: 1.8,
          whiteSpace: 'pre-wrap', minHeight: 120,
          fontFamily: note.content?.startsWith('```') ? 'monospace' : 'inherit',
        }}>
          {note.content || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No content.</span>}
        </div>

        <div style={{ fontSize: '.73rem', color: 'var(--text-muted)', marginTop: '.875rem' }}>
          Created {new Date(note.created_at).toLocaleString('en-IN')}
          {note.updated_at !== note.created_at && ` · Updated ${new Date(note.updated_at).toLocaleString('en-IN')}`}
        </div>

        <div className="modal-footer">
          <button className="btn btn-danger btn-sm" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting…' : <><TrashIcon /> Delete</>}
          </button>
          <button className="btn btn-outline btn-sm" onClick={onClose}>Close</button>
          <button className="btn btn-primary btn-sm" onClick={onEdit}>
            <EditIcon /> Edit
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Notes() {
  const [notes, setNotes] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await notesAPI.getAll({ search });
      setNotes(res.data.notes || []);
    } catch { /* fail */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, [search]);

  const filtered = notes.filter((n) =>
    !search || n.title.toLowerCase().includes(search.toLowerCase()) || (n.tags || []).some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="dash-layout">
      <DashSidebar active="notes" />
      <div className="dash-main">
        <header className="dash-topbar">
          <div className="dash-topbar-title">📝 Notes</div>
          <div className="dash-topbar-right">
            <button className="btn btn-primary btn-sm" onClick={() => setShowNew(true)}>
              <PlusIcon /> New Note
            </button>
          </div>
        </header>

        <div className="dash-content">
          <div className="filter-bar">
            <input className="form-input" placeholder="Search notes or tags…"
              value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 300 }} />
            <span style={{ fontSize: '.82rem', color: 'var(--text-muted)' }}>
              {filtered.length} note{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Loading…</div>
          ) : filtered.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '4rem', color: 'var(--text-muted)',
              border: '2px dashed var(--border)', borderRadius: 'var(--radius-lg)',
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📝</div>
              <div style={{ fontWeight: 700, marginBottom: '.5rem' }}>
                {search ? 'No notes match your search' : 'No notes yet'}
              </div>
              <div style={{ fontSize: '.85rem', marginBottom: '1.5rem' }}>
                {search ? 'Try a different keyword.' : 'Create your first note to get started.'}
              </div>
              {!search && (
                <button className="btn btn-primary btn-sm" onClick={() => setShowNew(true)}>
                  <PlusIcon /> Create Note
                </button>
              )}
            </div>
          ) : (
            <div className="notes-grid">
              {filtered.map((note) => (
                <div key={note.id} className="note-card" onClick={() => setViewing(note)}>
                  <div className="note-title">{note.title}</div>
                  {note.content && (
                    <div className="note-preview">{note.content.slice(0, 120)}{note.content.length > 120 ? '…' : ''}</div>
                  )}
                  {note.tags?.length > 0 && (
                    <div className="note-tags">
                      {note.tags.map((t) => <span key={t} className="note-tag">{t}</span>)}
                    </div>
                  )}
                  <div className="note-date">{new Date(note.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showNew && (
        <NoteModal onClose={() => setShowNew(false)} onSave={() => { setShowNew(false); load(); }} />
      )}
      {viewing && !editing && (
        <ViewModal
          note={viewing}
          onClose={() => setViewing(null)}
          onEdit={() => { setEditing(viewing); setViewing(null); }}
          onDelete={() => { setViewing(null); load(); }}
        />
      )}
      {editing && (
        <NoteModal
          note={editing}
          onClose={() => setEditing(null)}
          onSave={() => { setEditing(null); load(); }}
        />
      )}
    </div>
  );
}
