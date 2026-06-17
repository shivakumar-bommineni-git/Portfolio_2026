import { useState, useEffect } from 'react';
import { DashSidebar } from './Dashboard';
import { interviewAPI } from '../services/api';

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const XIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const ChevronIcon = ({ down }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    style={{ transform: down ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);
const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
    <path d="M10 11v6"/><path d="M14 11v6"/>
  </svg>
);

const CATEGORIES = ['All', 'JavaScript', 'React', 'Node.js', 'Next.js', 'PostgreSQL', 'DSA', 'System Design', 'CSS', 'TypeScript', 'General'];
const DIFFICULTIES = ['All', 'easy', 'medium', 'hard'];

const diffBadge = { easy: 'badge-green', medium: 'badge-yellow', hard: 'badge-red' };

function IQModal({ q, onClose, onSave }) {
  const [form, setForm] = useState(q
    ? { question: q.question, answer: q.answer || '', category: q.category || 'General', difficulty: q.difficulty || 'medium' }
    : { question: '', answer: '', category: 'General', difficulty: 'medium' });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSave = async () => {
    if (!form.question.trim()) { setErr('Question is required'); return; }
    setSaving(true); setErr('');
    try {
      if (q) {
        await interviewAPI.update(q.id, form);
      } else {
        await interviewAPI.create(form);
      }
      onSave();
    } catch {
      setErr('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div className="modal-title" style={{ margin: 0 }}>{q ? 'Edit Question' : 'Add Interview Question'}</div>
          <button className="btn-ghost btn-sm" onClick={onClose}><XIcon /></button>
        </div>

        {err && <div className="alert alert-error">{err}</div>}

        <div className="form-group">
          <label className="form-label">Question *</label>
          <textarea className="form-textarea" value={form.question} onChange={set('question')}
            placeholder="Enter the interview question..." style={{ minHeight: 90 }} autoFocus />
        </div>
        <div className="form-group">
          <label className="form-label">Answer / Notes</label>
          <textarea className="form-textarea" value={form.answer} onChange={set('answer')}
            placeholder="Write your answer, key points, or explanation..." style={{ minHeight: 160 }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Category</label>
            <select className="filter-select" style={{ width: '100%' }} value={form.category} onChange={set('category')}>
              {CATEGORIES.slice(1).map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Difficulty</label>
            <select className="filter-select" style={{ width: '100%' }} value={form.difficulty} onChange={set('difficulty')}>
              {DIFFICULTIES.slice(1).map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-outline btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : q ? 'Save Changes' : 'Add Question'}
          </button>
        </div>
      </div>
    </div>
  );
}

function IQCard({ q, onToggle, onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const [toggling, setToggling] = useState(false);

  const handleToggle = async (e) => {
    e.stopPropagation();
    setToggling(true);
    await onToggle(q);
    setToggling(false);
  };

  return (
    <div className={`iq-card ${q.is_mastered ? 'mastered' : ''}`}>
      <div className="iq-header" onClick={() => setOpen((o) => !o)}>
        <div style={{ flexShrink: 0 }}>
          <button
            className={`badge ${q.is_mastered ? 'badge-green' : 'badge-gray'}`}
            style={{ cursor: 'pointer', border: 'none' }}
            onClick={handleToggle} disabled={toggling} title={q.is_mastered ? 'Mark as not mastered' : 'Mark as mastered'}>
            {q.is_mastered ? <CheckIcon /> : '○'}
          </button>
        </div>
        <div style={{ flex: 1 }}>
          <div className="iq-q">{q.question}</div>
          <div style={{ display: 'flex', gap: '.4rem', marginTop: '.4rem', flexWrap: 'wrap' }}>
            <span className={`badge ${diffBadge[q.difficulty] || 'badge-gray'}`}>{q.difficulty}</span>
            <span className="badge badge-blue">{q.category}</span>
            {q.is_mastered && <span className="badge badge-green">Mastered ✓</span>}
          </div>
        </div>
        <ChevronIcon down={open} />
      </div>

      {open && (
        <div className="iq-body">
          {q.answer ? (
            <div className="iq-answer">{q.answer}</div>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '.85rem', paddingTop: '1rem' }}>
              No answer added yet. Click Edit to add one.
            </div>
          )}
          <div style={{ display: 'flex', gap: '.5rem', marginTop: '1rem' }}>
            <button className="btn btn-outline btn-sm" onClick={() => onEdit(q)}>Edit</button>
            <button className="btn btn-danger btn-sm" onClick={() => onDelete(q)}>
              <TrashIcon />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function InterviewPrep() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [difficulty, setDifficulty] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await interviewAPI.getAll();
      setQuestions(res.data.questions || []);
    } catch { /* fail */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = questions.filter((q) => {
    const matchSearch = !search || q.question.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'All' || q.category === category;
    const matchDiff = difficulty === 'All' || q.difficulty === difficulty;
    return matchSearch && matchCat && matchDiff;
  });

  const handleToggle = async (q) => {
    await interviewAPI.update(q.id, { is_mastered: !q.is_mastered });
    setQuestions((qs) => qs.map((x) => x.id === q.id ? { ...x, is_mastered: !x.is_mastered } : x));
  };

  const handleDelete = async (q) => {
    if (!window.confirm('Delete this question?')) return;
    await interviewAPI.delete(q.id);
    setQuestions((qs) => qs.filter((x) => x.id !== q.id));
  };

  const mastered = questions.filter((q) => q.is_mastered).length;

  return (
    <div className="dash-layout">
      <DashSidebar active="interview" />
      <div className="dash-main">
        <header className="dash-topbar">
          <div className="dash-topbar-title">💡 Interview Prep</div>
          <div className="dash-topbar-right">
            <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
              <PlusIcon /> Add Question
            </button>
          </div>
        </header>

        <div className="dash-content">
          {/* stats strip */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            {[
              { label: 'Total Questions', val: questions.length, color: 'var(--primary)' },
              { label: 'Mastered', val: mastered, color: 'var(--success)' },
              { label: 'Remaining', val: questions.length - mastered, color: 'var(--warn)' },
            ].map((s) => (
              <div key={s.label} style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)', padding: '.75rem 1.25rem',
                display: 'flex', alignItems: 'center', gap: '.75rem',
              }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 900, color: s.color }}>{s.val}</span>
                <span style={{ fontSize: '.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>{s.label}</span>
              </div>
            ))}
          </div>

          <div className="filter-bar">
            <input className="form-input" placeholder="Search questions…"
              value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 260 }} />
            <select className="filter-select" value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
            <select className="filter-select" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
              {DIFFICULTIES.map((d) => <option key={d}>{d}</option>)}
            </select>
            <span style={{ fontSize: '.8rem', color: 'var(--text-muted)' }}>{filtered.length} question{filtered.length !== 1 ? 's' : ''}</span>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Loading…</div>
          ) : filtered.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '4rem', color: 'var(--text-muted)',
              border: '2px dashed var(--border)', borderRadius: 'var(--radius-lg)',
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>💡</div>
              <div style={{ fontWeight: 700, marginBottom: '.5rem' }}>
                {search || category !== 'All' || difficulty !== 'All' ? 'No questions match your filters' : 'No questions yet'}
              </div>
              <div style={{ fontSize: '.85rem', marginBottom: '1.5rem' }}>
                {questions.length === 0 ? 'Start adding interview questions to prepare for your next role.' : 'Try adjusting your filters.'}
              </div>
              {questions.length === 0 && (
                <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
                  <PlusIcon /> Add First Question
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
              {filtered.map((q) => (
                <IQCard key={q.id} q={q}
                  onToggle={handleToggle}
                  onEdit={(item) => setEditing(item)}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {(showModal || editing) && (
        <IQModal
          q={editing}
          onClose={() => { setShowModal(false); setEditing(null); }}
          onSave={() => { setShowModal(false); setEditing(null); load(); }}
        />
      )}
    </div>
  );
}
