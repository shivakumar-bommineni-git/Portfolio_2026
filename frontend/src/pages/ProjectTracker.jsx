import { useState, useEffect, useRef } from 'react';
import { DashSidebar } from './Dashboard';
import { projectAPI } from '../services/api';

const STATUSES = ['planning', 'active', 'on_hold', 'completed', 'cancelled'];
const PAYMENT_STATUSES = ['unpaid', 'partial', 'paid'];
const STATUS_META = {
  planning:  { label: 'Planning',  color: '#8b5cf6', bg: 'rgba(139,92,246,.1)' },
  active:    { label: 'Active',    color: '#3b82f6', bg: 'rgba(59,130,246,.1)' },
  on_hold:   { label: 'On Hold',   color: '#f59e0b', bg: 'rgba(245,158,11,.1)' },
  completed: { label: 'Completed', color: '#10b981', bg: 'rgba(16,185,129,.1)' },
  cancelled: { label: 'Cancelled', color: '#ef4444', bg: 'rgba(239,68,68,.1)'  },
};
const PAY_META = {
  unpaid:  { label: 'Unpaid',  color: '#ef4444' },
  partial: { label: 'Partial', color: '#f59e0b' },
  paid:    { label: 'Paid',    color: '#10b981' },
};
const EMPTY = { name: '', client: '', description: '', status: 'planning', start_date: '', end_date: '', rate: '', rate_type: 'fixed', payment_status: 'unpaid', total_amount: '', tech_stack: '' };

function Modal({ form, setForm, onSave, onClose, saving }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
        <div style={{ fontWeight: 900, fontSize: '1.1rem', marginBottom: '1.5rem' }}>
          {form.id ? 'Edit Project' : 'Add Project'}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.875rem' }}>
          <div className="form-group" style={{ gridColumn: '1/-1', margin: 0 }}>
            <label className="form-label">Project Name *</label>
            <input className="form-input" placeholder="e.g. E-commerce Website" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Client</label>
            <input className="form-input" placeholder="Client name" value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Status</label>
            <select className="filter-select" style={{ width: '100%' }} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {STATUSES.map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ gridColumn: '1/-1', margin: 0 }}>
            <label className="form-label">Description</label>
            <textarea className="form-textarea" rows={2} placeholder="Project details..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ minHeight: 60 }} />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Start Date</label>
            <input className="form-input" type="date" value={form.start_date ? form.start_date.slice(0,10) : ''} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">End Date</label>
            <input className="form-input" type="date" value={form.end_date ? form.end_date.slice(0,10) : ''} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Rate Type</label>
            <select className="filter-select" style={{ width: '100%' }} value={form.rate_type} onChange={(e) => setForm({ ...form, rate_type: e.target.value })}>
              <option value="fixed">Fixed Price</option>
              <option value="hourly">Hourly</option>
            </select>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Rate (₹)</label>
            <input className="form-input" type="number" min="0" placeholder={form.rate_type === 'hourly' ? 'Per hour' : 'Total'} value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Total Amount (₹)</label>
            <input className="form-input" type="number" min="0" placeholder="Final billed amount" value={form.total_amount} onChange={(e) => setForm({ ...form, total_amount: e.target.value })} />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Payment Status</label>
            <select className="filter-select" style={{ width: '100%' }} value={form.payment_status} onChange={(e) => setForm({ ...form, payment_status: e.target.value })}>
              {PAYMENT_STATUSES.map((p) => <option key={p} value={p}>{PAY_META[p].label}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ gridColumn: '1/-1', margin: 0 }}>
            <label className="form-label">Tech Stack (comma separated)</label>
            <input className="form-input" placeholder="React, Node.js, PostgreSQL" value={form.tech_stack} onChange={(e) => setForm({ ...form, tech_stack: e.target.value })} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={onSave} disabled={saving || !form.name.trim()}>
            {saving ? 'Saving…' : form.id ? 'Save Changes' : 'Add Project'}
          </button>
        </div>
      </div>
    </div>
  );
}

function InvoiceModal({ project, onClose }) {
  const printRef = useRef();
  const now = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
  const invoiceNum = `INV-${project.id?.slice(0,6).toUpperCase() || '000001'}-${new Date().getFullYear()}`;

  const handlePrint = () => {
    const content = printRef.current.innerHTML;
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>Invoice - ${project.name}</title>
      <style>
        body{font-family:'Segoe UI',sans-serif;margin:0;padding:0;background:#fff;color:#1e293b;}
        .invoice{max-width:700px;margin:40px auto;padding:0 20px;}
        .header{background:linear-gradient(135deg,#2563eb,#7c3aed);color:#fff;padding:32px 36px;border-radius:12px 12px 0 0;}
        .header h1{margin:0;font-size:1.6rem;font-weight:900;}
        .header p{margin:.4rem 0 0;opacity:.8;font-size:.875rem;}
        .body{background:#fff;border:1px solid #e2e8f0;border-top:0;border-radius:0 0 12px 12px;padding:32px 36px;}
        .meta{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:28px;}
        .meta div{display:flex;flex-direction:column;gap:6px;}
        .meta label{font-size:.7rem;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;}
        .meta span{font-size:.925rem;font-weight:600;}
        table{width:100%;border-collapse:collapse;margin:20px 0;}
        th{background:#f8fafc;padding:10px 14px;font-size:.75rem;font-weight:700;color:#64748b;text-align:left;border-bottom:1px solid #e2e8f0;}
        td{padding:12px 14px;border-bottom:1px solid #f1f5f9;font-size:.9rem;}
        .total-row td{font-weight:800;font-size:1rem;border-top:2px solid #e2e8f0;border-bottom:none;}
        .amount{color:#2563eb;font-size:1.5rem;font-weight:900;margin-top:16px;}
        .footer{margin-top:24px;font-size:.75rem;color:#94a3b8;text-align:center;}
        .tags{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;}
        .tag{background:#eff6ff;color:#2563eb;border-radius:100px;padding:2px 10px;font-size:.72rem;font-weight:700;}
        @media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact;}}
      </style></head>
      <body><div class="invoice">${content}</div></body></html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 400);
  };

  const pm = PAY_META[project.payment_status] || PAY_META.unpaid;
  const sm = STATUS_META[project.status] || STATUS_META.planning;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 680, padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontWeight: 900, fontSize: '1rem' }}>Invoice Preview</div>
          <div style={{ display: 'flex', gap: '.5rem' }}>
            <button className="btn btn-primary btn-sm" onClick={handlePrint}>Print / Save PDF</button>
            <button className="btn btn-ghost btn-sm" onClick={onClose}>Close</button>
          </div>
        </div>
        <div style={{ padding: '1.5rem', maxHeight: '75vh', overflowY: 'auto' }}>
          <div ref={printRef}>
            <div className="header" style={{ background: 'linear-gradient(135deg,#2563eb,#7c3aed)', color: '#fff', padding: '28px 32px', borderRadius: '12px 12px 0 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 900, fontSize: '1.4rem' }}>INVOICE</div>
                  <div style={{ opacity: .8, fontSize: '.8rem', marginTop: '.3rem' }}>{invoiceNum}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 900, fontSize: '1.1rem' }}>Shivakumar Bommineni</div>
                  <div style={{ opacity: .8, fontSize: '.78rem', marginTop: '.2rem' }}>Full Stack Developer</div>
                  <div style={{ opacity: .8, fontSize: '.78rem' }}>xrdashboard.chrp@gmail.com</div>
                </div>
              </div>
            </div>
            <div style={{ border: '1px solid #e2e8f0', borderTop: 0, borderRadius: '0 0 12px 12px', padding: '28px 32px', background: '#fff', color: '#1e293b' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div>
                  <div style={{ fontSize: '.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '.4rem' }}>Bill To</div>
                  <div style={{ fontWeight: 700, fontSize: '.95rem' }}>{project.client || 'Client'}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '.4rem' }}>Invoice Date</div>
                  <div style={{ fontWeight: 600, fontSize: '.9rem' }}>{now}</div>
                  {project.end_date && <div style={{ fontSize: '.8rem', color: '#64748b', marginTop: '.2rem' }}>Due: {new Date(project.end_date).toLocaleDateString('en-IN',{ year:'numeric',month:'long',day:'numeric' })}</div>}
                </div>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    {['Description', 'Type', 'Rate', 'Amount'].map((h) => (
                      <th key={h} style={{ padding: '8px 0', fontSize: '.72rem', fontWeight: 700, color: '#94a3b8', textAlign: h === 'Rate' || h === 'Amount' ? 'right' : 'left' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 0', fontSize: '.9rem' }}>
                      <div style={{ fontWeight: 700 }}>{project.name}</div>
                      {project.description && <div style={{ fontSize: '.75rem', color: '#64748b', marginTop: '.2rem' }}>{project.description}</div>}
                    </td>
                    <td style={{ padding: '12px 0', fontSize: '.85rem', color: '#64748b' }}>{project.rate_type === 'hourly' ? 'Hourly' : 'Fixed'}</td>
                    <td style={{ padding: '12px 0', fontSize: '.85rem', textAlign: 'right' }}>{project.rate ? `₹${Number(project.rate).toLocaleString()}` : '—'}</td>
                    <td style={{ padding: '12px 0', fontSize: '.95rem', fontWeight: 700, textAlign: 'right' }}>{project.total_amount ? `₹${Number(project.total_amount).toLocaleString()}` : '—'}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} style={{ padding: '14px 0', fontWeight: 700, borderTop: '2px solid #e2e8f0', textAlign: 'right', paddingRight: '1rem' }}>Total</td>
                    <td style={{ padding: '14px 0', fontWeight: 900, fontSize: '1.1rem', color: '#2563eb', borderTop: '2px solid #e2e8f0', textAlign: 'right' }}>
                      {project.total_amount ? `₹${Number(project.total_amount).toLocaleString()}` : '—'}
                    </td>
                  </tr>
                </tfoot>
              </table>

              <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  {project.tech_stack?.length > 0 && (
                    <>
                      <div style={{ fontSize: '.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '.4rem' }}>Technologies Used</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.3rem' }}>
                        {project.tech_stack.map((t) => <span key={t} style={{ background: '#eff6ff', color: '#2563eb', borderRadius: 100, padding: '2px 10px', fontSize: '.72rem', fontWeight: 700 }}>{t}</span>)}
                      </div>
                    </>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '.4rem' }}>Payment Status</div>
                  <span style={{ background: pm.color === '#10b981' ? '#dcfce7' : pm.color === '#f59e0b' ? '#fef9c3' : '#fee2e2', color: pm.color, borderRadius: 100, padding: '.25rem .875rem', fontSize: '.8rem', fontWeight: 800 }}>{pm.label}</span>
                </div>
              </div>

              <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9', fontSize: '.72rem', color: '#94a3b8', textAlign: 'center' }}>
                Thank you for your business! · For questions contact xrdashboard.chrp@gmail.com
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProjectTracker() {
  const [projects, setProjects]     = useState([]);
  const [statusFilter, setFilter]   = useState('all');
  const [form, setForm]             = useState(null);
  const [invoice, setInvoice]       = useState(null);
  const [saving, setSaving]         = useState(false);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    projectAPI.getAll()
      .then((r) => setProjects(r.data.projects || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        tech_stack: form.tech_stack ? form.tech_stack.split(',').map((t) => t.trim()).filter(Boolean) : [],
        rate: form.rate ? Number(form.rate) : null,
        total_amount: form.total_amount ? Number(form.total_amount) : null,
      };
      if (form.id) {
        const r = await projectAPI.update(form.id, payload);
        setProjects((prev) => prev.map((x) => x.id === form.id ? r.data.project : x));
      } else {
        const r = await projectAPI.create(payload);
        setProjects((prev) => [r.data.project, ...prev]);
      }
      setForm(null);
    } catch { /* ignore */ } finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!confirm('Delete this project?')) return;
    await projectAPI.delete(id).catch(() => {});
    setProjects((prev) => prev.filter((x) => x.id !== id));
  };

  const filtered = statusFilter === 'all' ? projects : projects.filter((p) => p.status === statusFilter);
  const totalRevenue = projects.filter((p) => p.payment_status === 'paid').reduce((s, p) => s + (Number(p.total_amount) || 0), 0);
  const pending = projects.filter((p) => p.payment_status !== 'paid').reduce((s, p) => s + (Number(p.total_amount) || 0), 0);

  return (
    <div className="dash-layout">
      <DashSidebar active="projects" />
      <div className="dash-main">
        <header className="dash-topbar">
          <div>
            <div className="dash-topbar-title">Project Tracker</div>
            <div style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>Track freelance & client projects</div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setForm({ ...EMPTY })}>+ Add Project</button>
        </header>

        <div className="dash-content">
          {/* Revenue stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            {[
              { label: 'Total Projects', num: projects.length, color: '#3b82f6', prefix: '' },
              { label: 'Active', num: projects.filter((p) => p.status === 'active').length, color: '#8b5cf6', prefix: '' },
              { label: 'Revenue Earned', num: totalRevenue.toLocaleString('en-IN'), color: '#10b981', prefix: '₹' },
              { label: 'Pending Payment', num: pending.toLocaleString('en-IN'), color: '#f59e0b', prefix: '₹' },
            ].map((s) => (
              <div key={s.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.125rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: s.color }}>{s.prefix}{s.num}</div>
                <div style={{ fontSize: '.72rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '.2rem' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Status filter */}
          <div className="filter-bar">
            <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
              {['all', ...STATUSES].map((s) => (
                <button key={s} onClick={() => setFilter(s)} style={{
                  padding: '.4rem .875rem', borderRadius: 100, border: '1.5px solid',
                  borderColor: statusFilter === s ? 'var(--primary)' : 'var(--border)',
                  background: statusFilter === s ? 'var(--primary-lt)' : 'transparent',
                  color: statusFilter === s ? 'var(--primary)' : 'var(--text-muted)',
                  fontWeight: 700, fontSize: '.78rem', cursor: 'pointer', fontFamily: 'inherit',
                }}>
                  {s === 'all' ? 'All' : STATUS_META[s].label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading…</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '.75rem' }}>💼</div>
              <div style={{ fontWeight: 700, marginBottom: '.375rem' }}>No projects found</div>
              <div style={{ fontSize: '.85rem' }}>Start tracking your freelance projects!</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: '1rem' }}>
              {filtered.map((proj) => {
                const sm = STATUS_META[proj.status] || STATUS_META.planning;
                const pm = PAY_META[proj.payment_status] || PAY_META.unpaid;
                return (
                  <div key={proj.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 900, fontSize: '.975rem', marginBottom: '.2rem' }}>{proj.name}</div>
                        {proj.client && <div style={{ fontSize: '.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>👤 {proj.client}</div>}
                      </div>
                      <span style={{ background: sm.bg, color: sm.color, borderRadius: 100, padding: '.2rem .65rem', fontSize: '.68rem', fontWeight: 800, flexShrink: 0, marginLeft: '.5rem' }}>{sm.label}</span>
                    </div>

                    {proj.description && <div style={{ fontSize: '.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{proj.description}</div>}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem' }}>
                      {proj.total_amount && (
                        <div style={{ background: 'var(--surface-alt)', borderRadius: 8, padding: '.5rem .75rem' }}>
                          <div style={{ fontSize: '.65rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '.15rem' }}>AMOUNT</div>
                          <div style={{ fontWeight: 900, color: '#10b981' }}>₹{Number(proj.total_amount).toLocaleString('en-IN')}</div>
                        </div>
                      )}
                      <div style={{ background: 'var(--surface-alt)', borderRadius: 8, padding: '.5rem .75rem' }}>
                        <div style={{ fontSize: '.65rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '.15rem' }}>PAYMENT</div>
                        <div style={{ fontWeight: 800, color: pm.color }}>{pm.label}</div>
                      </div>
                    </div>

                    {(proj.start_date || proj.end_date) && (
                      <div style={{ fontSize: '.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                        📅 {proj.start_date ? new Date(proj.start_date).toLocaleDateString('en-IN',{month:'short',day:'numeric',year:'numeric'}) : '—'}
                        {' → '}
                        {proj.end_date ? new Date(proj.end_date).toLocaleDateString('en-IN',{month:'short',day:'numeric',year:'numeric'}) : 'Ongoing'}
                      </div>
                    )}

                    {proj.tech_stack?.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.3rem' }}>
                        {proj.tech_stack.map((t) => <span key={t} className="note-tag">{t}</span>)}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '.4rem', paddingTop: '.1rem' }}>
                      <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => setInvoice(proj)}>📄 Invoice</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setForm({ ...proj, tech_stack: (proj.tech_stack || []).join(', '), rate: proj.rate || '', total_amount: proj.total_amount || '' })}>Edit</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => remove(proj.id)} style={{ color: 'var(--error)' }}>✕</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      {form && <Modal form={form} setForm={setForm} onSave={save} onClose={() => setForm(null)} saving={saving} />}
      {invoice && <InvoiceModal project={invoice} onClose={() => setInvoice(null)} />}
    </div>
  );
}
