import { useState, useEffect } from 'react';
import { DashSidebar } from './Dashboard';
import { todoAPI } from '../services/api';

const PRIORITIES = ['high', 'medium', 'low'];
const STATUSES   = ['todo', 'in_progress', 'done'];
const STATUS_META = {
  todo:        { label: 'To Do',       color: '#64748b', bg: 'rgba(100,116,139,.1)',  icon: '○' },
  in_progress: { label: 'In Progress', color: '#3b82f6', bg: 'rgba(59,130,246,.1)',   icon: '◑' },
  done:        { label: 'Done',        color: '#10b981', bg: 'rgba(16,185,129,.1)',   icon: '●' },
};
const PRIORITY_META = {
  high:   { label: 'High',   color: '#ef4444', bg: 'rgba(239,68,68,.1)'   },
  medium: { label: 'Medium', color: '#f59e0b', bg: 'rgba(245,158,11,.1)'  },
  low:    { label: 'Low',    color: '#10b981', bg: 'rgba(16,185,129,.1)'  },
};
const EMPTY = { title: '', description: '', priority: 'medium', status: 'todo', due_date: '', tags: '' };

function TaskModal({ form, setForm, onSave, onClose, saving }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
        <div style={{ fontWeight: 900, fontSize: '1.1rem', marginBottom: '1.5rem' }}>
          {form.id ? 'Edit Task' : 'Add Task'}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.875rem' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Title *</label>
            <input className="form-input" placeholder="Task title..." value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Description</label>
            <textarea className="form-textarea" rows={3} placeholder="Details..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ minHeight: 70 }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.875rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Priority</label>
              <select className="filter-select" style={{ width: '100%' }} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                {PRIORITIES.map((p) => <option key={p} value={p}>{PRIORITY_META[p].label}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Status</label>
              <select className="filter-select" style={{ width: '100%' }} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {STATUSES.map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Due Date</label>
            <input className="form-input" type="date" value={form.due_date ? form.due_date.slice(0, 10) : ''} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Tags (comma separated)</label>
            <input className="form-input" placeholder="Bug, Feature, Design" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={onSave} disabled={saving || !form.title.trim()}>
            {saving ? 'Saving…' : form.id ? 'Save Changes' : 'Add Task'}
          </button>
        </div>
      </div>
    </div>
  );
}

function TaskCard({ task, onEdit, onDelete, onStatusChange }) {
  const sm = STATUS_META[task.status];
  const pm = PRIORITY_META[task.priority];
  const overdue = task.due_date && task.status !== 'done' && new Date(task.due_date) < new Date();
  const nextStatus = task.status === 'todo' ? 'in_progress' : task.status === 'in_progress' ? 'done' : null;

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
      padding: '1rem', display: 'flex', flexDirection: 'column', gap: '.625rem',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '.5rem' }}>
        <div style={{ fontWeight: 800, fontSize: '.9rem', flex: 1, lineHeight: 1.4 }}>{task.title}</div>
        <span style={{ background: pm.bg, color: pm.color, borderRadius: 100, padding: '.18rem .55rem', fontSize: '.65rem', fontWeight: 800, flexShrink: 0 }}>{pm.label}</span>
      </div>
      {task.description && <div style={{ fontSize: '.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{task.description}</div>}
      {task.due_date && (
        <div style={{ fontSize: '.72rem', fontWeight: 700, color: overdue ? '#ef4444' : 'var(--text-muted)' }}>
          {overdue ? '⚠️ Overdue · ' : '📅 '}
          {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
      )}
      {task.tags?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.25rem' }}>
          {task.tags.map((t) => <span key={t} className="note-tag">{t}</span>)}
        </div>
      )}
      <div style={{ display: 'flex', gap: '.4rem', paddingTop: '.1rem' }}>
        {nextStatus && (
          <button onClick={() => onStatusChange(task, nextStatus)} style={{
            flex: 1, padding: '.35rem .5rem', borderRadius: 7, border: '1.5px solid var(--primary)',
            background: 'var(--primary-lt)', color: 'var(--primary)', fontSize: '.72rem',
            fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
          }}>
            → {STATUS_META[nextStatus].label}
          </button>
        )}
        <button className="btn btn-ghost btn-sm" onClick={() => onEdit(task)}>Edit</button>
        <button className="btn btn-ghost btn-sm" onClick={() => onDelete(task.id)} style={{ color: 'var(--error)' }}>✕</button>
      </div>
    </div>
  );
}

export default function TodoBoard() {
  const [tasks, setTasks]     = useState([]);
  const [form, setForm]       = useState(null);
  const [saving, setSaving]   = useState(false);
  const [loading, setLoading] = useState(true);
  const [view, setView]       = useState('kanban');

  useEffect(() => {
    todoAPI.getAll()
      .then((r) => setTasks(r.data.todos || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const payload = { ...form, tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [] };
      if (form.id) {
        const r = await todoAPI.update(form.id, payload);
        setTasks((prev) => prev.map((x) => x.id === form.id ? r.data.todo : x));
      } else {
        const r = await todoAPI.create(payload);
        setTasks((prev) => [r.data.todo, ...prev]);
      }
      setForm(null);
    } catch { /* ignore */ } finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!confirm('Delete this task?')) return;
    await todoAPI.delete(id).catch(() => {});
    setTasks((prev) => prev.filter((x) => x.id !== id));
  };

  const statusChange = async (task, newStatus) => {
    const r = await todoAPI.update(task.id, { ...task, status: newStatus }).catch(() => null);
    if (r) setTasks((prev) => prev.map((x) => x.id === task.id ? r.data.todo : x));
  };

  const cols = {
    todo:        tasks.filter((t) => t.status === 'todo'),
    in_progress: tasks.filter((t) => t.status === 'in_progress'),
    done:        tasks.filter((t) => t.status === 'done'),
  };

  return (
    <div className="dash-layout">
      <DashSidebar active="todos" />
      <div className="dash-main">
        <header className="dash-topbar">
          <div>
            <div className="dash-topbar-title">Todo Board</div>
            <div style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>Manage your tasks and track progress</div>
          </div>
          <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', background: 'var(--surface-alt)', borderRadius: 8, padding: '2px', border: '1px solid var(--border)' }}>
              {[['kanban', '⊞'], ['list', '≡']].map(([v, icon]) => (
                <button key={v} onClick={() => setView(v)} style={{
                  padding: '.3rem .6rem', borderRadius: 6, border: 'none',
                  background: view === v ? 'var(--surface)' : 'transparent',
                  color: view === v ? 'var(--text)' : 'var(--text-muted)',
                  cursor: 'pointer', fontSize: '.875rem', fontWeight: 700,
                }}>{icon}</button>
              ))}
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setForm({ ...EMPTY })}>+ Add Task</button>
          </div>
        </header>

        <div className="dash-content">
          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            {STATUSES.map((s) => {
              const sm = STATUS_META[s];
              return (
                <div key={s} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                  <span style={{ fontSize: '1.3rem', color: sm.color }}>{sm.icon}</span>
                  <div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 900, color: sm.color }}>{cols[s].length}</div>
                    <div style={{ fontSize: '.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>{sm.label}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading…</div>
          ) : view === 'kanban' ? (
            /* Kanban */
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem', alignItems: 'start' }}>
              {STATUSES.map((s) => {
                const sm = STATUS_META[s];
                return (
                  <div key={s} style={{ background: 'var(--surface-alt)', borderRadius: 'var(--radius-lg)', padding: '.875rem', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.875rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '.45rem' }}>
                        <span style={{ color: sm.color, fontWeight: 900 }}>{sm.icon}</span>
                        <span style={{ fontWeight: 800, fontSize: '.875rem' }}>{sm.label}</span>
                      </div>
                      <span style={{ background: sm.bg, color: sm.color, borderRadius: 100, padding: '.15rem .55rem', fontSize: '.72rem', fontWeight: 800 }}>{cols[s].length}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '.625rem', minHeight: 80 }}>
                      {cols[s].length === 0 && (
                        <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '.78rem' }}>No tasks</div>
                      )}
                      {cols[s].map((t) => <TaskCard key={t.id} task={t} onEdit={(task) => setForm({ ...task, tags: (task.tags || []).join(', ') })} onDelete={remove} onStatusChange={statusChange} />)}
                    </div>
                    {s === 'todo' && (
                      <button onClick={() => setForm({ ...EMPTY })} style={{ marginTop: '.625rem', width: '100%', padding: '.5rem', borderRadius: 8, border: '1.5px dashed var(--border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '.8rem', fontWeight: 600, fontFamily: 'inherit' }}>
                        + Add task
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* List view */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
              {tasks.length === 0 && (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '.75rem' }}>✅</div>
                  <div style={{ fontWeight: 700 }}>No tasks yet</div>
                  <div style={{ fontSize: '.85rem' }}>Add your first task to get started!</div>
                </div>
              )}
              {STATUSES.flatMap((s) => cols[s]).map((t) => {
                const sm = STATUS_META[t.status];
                const pm = PRIORITY_META[t.priority];
                const overdue = t.due_date && t.status !== 'done' && new Date(t.due_date) < new Date();
                return (
                  <div key={t.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '.875rem 1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={() => { if (t.status !== 'done') statusChange(t, t.status === 'todo' ? 'in_progress' : 'done'); }} style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${sm.color}`, background: t.status === 'done' ? sm.color : 'transparent', cursor: t.status !== 'done' ? 'pointer' : 'default', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '.9rem', textDecoration: t.status === 'done' ? 'line-through' : 'none', color: t.status === 'done' ? 'var(--text-muted)' : 'var(--text)' }}>{t.title}</div>
                      {t.description && <div style={{ fontSize: '.75rem', color: 'var(--text-muted)', marginTop: '.15rem' }}>{t.description}</div>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexShrink: 0 }}>
                      {t.due_date && <span style={{ fontSize: '.7rem', color: overdue ? '#ef4444' : 'var(--text-muted)', fontWeight: 700 }}>{new Date(t.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
                      <span style={{ background: pm.bg, color: pm.color, borderRadius: 100, padding: '.15rem .5rem', fontSize: '.65rem', fontWeight: 800 }}>{pm.label}</span>
                      <span style={{ background: sm.bg, color: sm.color, borderRadius: 100, padding: '.15rem .5rem', fontSize: '.65rem', fontWeight: 800 }}>{sm.label}</span>
                      <button className="btn btn-ghost btn-sm" onClick={() => setForm({ ...t, tags: (t.tags || []).join(', ') })}>Edit</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => remove(t.id)} style={{ color: 'var(--error)' }}>✕</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      {form && <TaskModal form={form} setForm={setForm} onSave={save} onClose={() => setForm(null)} saving={saving} />}
    </div>
  );
}
