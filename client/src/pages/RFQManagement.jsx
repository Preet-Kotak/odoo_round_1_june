import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

/* ─────────────────────────────────────────────────────────────
   Design tokens (Stitch / tailwind.config.js)
   Ivory bg       : #F9F7F3
   Card bg        : #FFFFFF
   Card border    : #E5E1D8
   Charcoal       : #1C1C1C
   Muted text     : #858484
   Gold           : #C6A664
   Tab underline  : #1C1C1C
   Pill bg        : #EEECE8   (category / filter chips)
   Response pill  : #EEECE8 / gold fill when has responses
   Red urgent     : #D94F3D
   Amber mid      : #B87333
───────────────────────────────────────────────────────────── */

// ── helpers ────────────────────────────────────────────────

const daysLeft = (d) =>
  Math.ceil((new Date(d) - new Date()) / 86_400_000);

const fmtDeadline = (d) =>
  new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

// deterministic avatar palette
const AVATAR_COLORS = [
  ['#1F3A5F', '#FFFFFF'],   // deep navy  / white text
  ['#2E4D3A', '#FFFFFF'],   // forest     / white
  ['#5C2D2D', '#FFFFFF'],   // burgundy   / white
  ['#3B2E5A', '#FFFFFF'],   // plum       / white
  ['#1C3C4A', '#FFFFFF'],   // teal-dark  / white
  ['#4A3520', '#FFFFFF'],   // mocha      / white
];
const avatarColor = (name = '') => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[h];
};
const initials = (name = '') =>
  name.split(' ').slice(0, 2).map((w) => w[0] ?? '').join('').toUpperCase();

// ── micro components ───────────────────────────────────────

/* Stacked vendor avatars — exactly like Stitch */
const VendorStack = ({ vendors = [] }) => {
  const show = vendors.slice(0, 3);
  const extra = vendors.length - 3;
  if (!vendors.length)
    return <span className="text-[12px] text-[#858484]">—</span>;
  return (
    <div className="flex items-center" style={{ gap: 0 }}>
      {show.map((v, i) => {
        const [bg, fg] = avatarColor(v.companyName || '');
        return (
          <div
            key={i}
            title={v.companyName}
            style={{
              width: 26, height: 26, borderRadius: '50%',
              background: bg, color: fg,
              border: '2px solid #fff',
              marginLeft: i === 0 ? 0 : -8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 9, fontWeight: 700, fontFamily: "'IBM Plex Sans', sans-serif",
              zIndex: show.length - i,
              position: 'relative',
            }}
          >
            {initials(v.companyName)}
          </div>
        );
      })}
      {extra > 0 && (
        <div
          style={{
            width: 26, height: 26, borderRadius: '50%',
            background: '#EEECE8', color: '#858484',
            border: '2px solid #fff',
            marginLeft: -8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 9, fontWeight: 700,
          }}
        >
          +{extra}
        </div>
      )}
    </div>
  );
};

/* Response pill — "8 / 12" */
const ResponsePill = ({ count, total }) => (
  <span
    className="inline-flex items-center justify-center rounded-full text-[12px] font-semibold tabular-nums px-3 py-[3px]"
    style={{
      background: count > 0 ? '#FFF3D6' : '#EEECE8',
      color:      count > 0 ? '#795f24' : '#858484',
      border:     count > 0 ? '1px solid #C6A66466' : '1px solid #E5E1D8',
    }}
  >
    {count} / {total || 0}
  </span>
);

/* Deadline countdown badge */
const DeadlineBadge = ({ deadline, status }) => {
  if (status !== 'open') return null;
  const d = daysLeft(deadline);
  if (d < 0)
    return (
      <span className="flex items-center gap-1 text-[11.5px] font-semibold text-[#D94F3D]">
        <span className="material-symbols-outlined text-[14px]">error</span>
        Overdue
      </span>
    );
  if (d <= 5)
    return (
      <span className="flex items-center gap-1 text-[11.5px] font-semibold text-[#D94F3D]">
        <span className="material-symbols-outlined text-[14px]">timer</span>
        {d} Days Left
      </span>
    );
  if (d <= 14)
    return (
      <span className="flex items-center gap-1 text-[11.5px] font-semibold text-[#B87333]">
        <span className="material-symbols-outlined text-[14px]">event</span>
        {d} Days Left
      </span>
    );
  return (
    <span className="flex items-center gap-1 text-[11.5px] text-[#858484]">
      <span className="material-symbols-outlined text-[14px]">calendar_today</span>
      {d} Days Left
    </span>
  );
};

/* Priority badge */
const PRIORITY_STYLE = {
  high:   { bg: '#FEE2E2', color: '#B91C1C' },
  medium: { bg: '#FEF3C7', color: '#92400E' },
  low:    { bg: '#DCFCE7', color: '#166534' },
};
const PriorityBadge = ({ priority }) => {
  if (!priority) return null;
  const s = PRIORITY_STYLE[priority] || {};
  return (
    <span
      className="inline-block text-[10px] font-bold uppercase rounded px-[6px] py-[2px] tracking-wide mt-[2px]"
      style={{ background: s.bg, color: s.color }}
    >
      {priority}
    </span>
  );
};

// ── Actions dropdown ───────────────────────────────────────

const ActionsMenu = ({ rfq, onAction }) => {
  const [open, setOpen] = useState(false);
  const items =
    rfq.status === 'draft'
      ? [
          { key: 'send',      icon: 'send',         label: 'Send to Vendors' },
          { key: 'duplicate', icon: 'content_copy',  label: 'Duplicate'       },
          { key: 'cancel',    icon: 'cancel',        label: 'Cancel',  danger: true },
        ]
      : rfq.status === 'open'
      ? [
          { key: 'close',     icon: 'lock',          label: 'Close RFQ'       },
          { key: 'duplicate', icon: 'content_copy',  label: 'Duplicate'       },
          { key: 'cancel',    icon: 'cancel',        label: 'Cancel',  danger: true },
        ]
      : [{ key: 'duplicate', icon: 'content_copy',  label: 'Duplicate' }];

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-7 h-7 flex items-center justify-center rounded-lg
                   text-[#858484] hover:text-[#1C1C1C] hover:bg-[#EEECE8]
                   transition-all"
      >
        <span className="material-symbols-outlined text-[20px]">more_vert</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-8 z-20 w-44 rounded-xl py-1 overflow-hidden"
            style={{ background: '#fff', border: '1px solid #E5E1D8', boxShadow: '0 8px 24px rgba(28,28,28,0.10)' }}
          >
            {items.map((a) => (
              <button
                key={a.key}
                onClick={() => { onAction(rfq, a.key); setOpen(false); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px]
                           hover:bg-[#F9F7F3] transition-colors text-left"
                style={{ color: a.danger ? '#D94F3D' : '#1C1C1C' }}
              >
                <span className="material-symbols-outlined text-[15px]">{a.icon}</span>
                {a.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// ── Create RFQ Modal ───────────────────────────────────────

const EMPTY = {
  title: '', description: '', category: '', priority: 'medium', deadline: '',
  assignedVendors: [],
  lineItems: [{ itemName: '', description: '', quantity: 1, unitOfMeasure: '', estimatedPrice: '' }],
};

const InputCls =
  'w-full border border-[#E5E1D8] rounded-lg px-3.5 py-2.5 text-[13px] text-[#1C1C1C] ' +
  'placeholder:text-[#858484]/70 focus:outline-none focus:border-[#C6A664] focus:ring-1 ' +
  'focus:ring-[#C6A664]/30 transition-all bg-white';

const Label = ({ children }) => (
  <p className="text-[11px] font-bold uppercase tracking-[0.07em] text-[#858484] mb-1.5">
    {children}
  </p>
);

const CreateRFQModal = ({ onClose, onCreated, vendors }) => {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const setLine = (i, k, v) =>
    setForm((p) => {
      const li = [...p.lineItems]; li[i] = { ...li[i], [k]: v };
      return { ...p, lineItems: li };
    });
  const addLine = () =>
    setForm((p) => ({
      ...p,
      lineItems: [...p.lineItems, { itemName: '', description: '', quantity: 1, unitOfMeasure: '', estimatedPrice: '' }],
    }));
  const removeLine = (i) =>
    setForm((p) => ({ ...p, lineItems: p.lineItems.filter((_, x) => x !== i) }));
  const toggleVendor = (id) =>
    setForm((p) => ({
      ...p,
      assignedVendors: p.assignedVendors.includes(id)
        ? p.assignedVendors.filter((x) => x !== id)
        : [...p.assignedVendors, id],
    }));

  const submit = async () => {
    setErr('');
    if (!form.title || !form.deadline) { setErr('Title and Deadline are required.'); return; }
    setSaving(true);
    try {
      const res = await api.post('/rfqs', { ...form, status: 'draft' });
      onCreated(res.data.data);
      onClose();
    } catch (e) {
      setErr(e.response?.data?.message || 'Failed to create RFQ.');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl"
        style={{ background: '#fff', boxShadow: '0 24px 60px rgba(28,28,28,0.18)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5"
             style={{ borderBottom: '1px solid #E5E1D8' }}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#858484]">
              New Request
            </p>
            <h2 className="text-[20px] font-normal text-[#1C1C1C] mt-0.5"
                style={{ fontFamily: "'DM Serif Display', serif" }}>
              Create RFQ
            </h2>
          </div>
          <button onClick={onClose}
                  className="text-[#858484] hover:text-[#1C1C1C] transition-colors">
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {err && (
            <div className="text-[13px] text-[#D94F3D] bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              {err}
            </div>
          )}

          {/* Title + Description */}
          <div className="space-y-4">
            <div>
              <Label>Title *</Label>
              <input value={form.title} onChange={(e) => set('title', e.target.value)}
                     placeholder="e.g. Architectural Glass Supply" className={InputCls} />
            </div>
            <div>
              <Label>Description</Label>
              <textarea value={form.description} onChange={(e) => set('description', e.target.value)}
                        rows={2} placeholder="Brief description of the procurement need…"
                        className={InputCls + ' resize-none'} />
            </div>
          </div>

          {/* Category / Priority / Deadline */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Category</Label>
              <input value={form.category} onChange={(e) => set('category', e.target.value)}
                     placeholder="e.g. Construction" className={InputCls} />
            </div>
            <div>
              <Label>Priority</Label>
              <select value={form.priority} onChange={(e) => set('priority', e.target.value)}
                      className={InputCls}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <Label>Deadline *</Label>
              <input type="date" value={form.deadline}
                     min={new Date().toISOString().split('T')[0]}
                     onChange={(e) => set('deadline', e.target.value)}
                     className={InputCls} />
            </div>
          </div>

          {/* Line items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Line Items</Label>
              <button onClick={addLine}
                      className="text-[12px] text-[#745b20] font-bold hover:underline flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">add</span>Add Item
              </button>
            </div>
            <div className="space-y-2">
              {form.lineItems.map((li, i) => (
                <div key={i}
                     className="grid grid-cols-12 gap-2 items-center rounded-lg px-3 py-2"
                     style={{ background: '#F9F7F3', border: '1px solid #E5E1D8' }}>
                  <input value={li.itemName} onChange={(e) => setLine(i, 'itemName', e.target.value)}
                         placeholder="Item name"
                         className="col-span-4 border border-[#E5E1D8] rounded-lg px-2.5 py-1.5 text-[13px] bg-white focus:outline-none focus:border-[#C6A664]" />
                  <input type="number" value={li.quantity} min={1}
                         onChange={(e) => setLine(i, 'quantity', e.target.value)}
                         placeholder="Qty"
                         className="col-span-2 border border-[#E5E1D8] rounded-lg px-2.5 py-1.5 text-[13px] bg-white focus:outline-none focus:border-[#C6A664]" />
                  <input value={li.unitOfMeasure} onChange={(e) => setLine(i, 'unitOfMeasure', e.target.value)}
                         placeholder="UOM"
                         className="col-span-2 border border-[#E5E1D8] rounded-lg px-2.5 py-1.5 text-[13px] bg-white focus:outline-none focus:border-[#C6A664]" />
                  <input type="number" value={li.estimatedPrice}
                         onChange={(e) => setLine(i, 'estimatedPrice', e.target.value)}
                         placeholder="Est. price"
                         className="col-span-3 border border-[#E5E1D8] rounded-lg px-2.5 py-1.5 text-[13px] bg-white focus:outline-none focus:border-[#C6A664]" />
                  <button onClick={() => removeLine(i)} disabled={form.lineItems.length === 1}
                          className="col-span-1 flex justify-center text-[#858484] hover:text-[#D94F3D] disabled:opacity-25 transition-colors">
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Vendor selection */}
          {vendors.length > 0 && (
            <div>
              <Label>Invite Vendors</Label>
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto pr-1">
                {vendors.map((v) => {
                  const sel = form.assignedVendors.includes(v._id);
                  return (
                    <label key={v._id}
                           className="flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer
                                      text-[13px] transition-all"
                           style={{
                             border: sel ? '1px solid #C6A664' : '1px solid #E5E1D8',
                             background: sel ? '#FFF8EC' : '#fff',
                             color: sel ? '#1C1C1C' : '#858484',
                             fontWeight: sel ? 600 : 400,
                           }}>
                      <input type="checkbox" checked={sel} onChange={() => toggleVendor(v._id)}
                             className="accent-[#C6A664]" />
                      {v.companyName}
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 rounded-b-2xl"
             style={{ borderTop: '1px solid #E5E1D8', background: '#F9F7F3' }}>
          <button onClick={onClose}
                  className="px-5 py-2.5 rounded-lg text-[13px] font-semibold text-[#858484]
                             border border-[#E5E1D8] hover:bg-white transition-colors">
            Cancel
          </button>
          <button onClick={submit} disabled={saving}
                  className="px-5 py-2.5 rounded-lg text-[13px] font-bold disabled:opacity-50 transition-colors"
                  style={{ background: '#C6A664', color: '#1C1C1C' }}>
            {saving ? 'Creating…' : 'Create RFQ'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Filter chip ────────────────────────────────────────────

const Chip = ({ label, onRemove }) => (
  <span className="inline-flex items-center gap-1 pl-3 pr-2 py-[5px] text-[12px] font-semibold
                   rounded-full cursor-default"
        style={{ background: '#FFF3D6', color: '#795f24', border: '1px solid #C6A66460' }}>
    {label}
    {onRemove && (
      <button onClick={onRemove} className="hover:opacity-60">
        <span className="material-symbols-outlined text-[13px]">close</span>
      </button>
    )}
  </span>
);

// ── Tabs ───────────────────────────────────────────────────

const TABS = [
  { key: 'active', label: 'Active Solicitations', status: 'open'   },
  { key: 'drafts', label: 'Drafts',               status: 'draft'  },
  { key: 'closed', label: 'Closed/Archived',       status: 'closed' },
];
const PAGE_SIZE = 10;

// ══════════════════════════════════════════════════════════
//  MAIN PAGE
// ══════════════════════════════════════════════════════════
const RFQManagement = () => {
  const [tab,          setTab]          = useState('active');
  const [rfqs,         setRfqs]         = useState([]);
  const [counts,       setCounts]       = useState({ active: 0, drafts: 0, closed: 0 });
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [prioFilter,   setPrioFilter]   = useState('');
  const [catFilter,    setCatFilter]    = useState('');
  const [sortBy,       setSortBy]       = useState('deadline');
  const [page,         setPage]         = useState(1);
  const [totalPages,   setTotalPages]   = useState(1);
  const [totalCount,   setTotalCount]   = useState(0);
  const [showModal,    setShowModal]    = useState(false);
  const [vendors,      setVendors]      = useState([]);
  const [qCounts,      setQCounts]      = useState({});   // rfqId → quotation count

  const tabStatus = TABS.find((t) => t.key === tab)?.status;

  /* ── fetch RFQs ── */
  const fetchRFQs = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page, limit: PAGE_SIZE, status: tabStatus });
      if (search) p.set('search', search);
      const res = await api.get(`/rfqs?${p}`);
      const data = res.data?.data || [];
      setRfqs(data);
      setTotalCount(res.data?.total || 0);
      setTotalPages(Math.max(1, Math.ceil((res.data?.total || 0) / PAGE_SIZE)));
      // quotation counts in parallel
      if (data.length) {
        const results = await Promise.allSettled(
          data.map((r) => api.get(`/quotations?rfqId=${r._id}&limit=1`))
        );
        const map = {};
        data.forEach((r, i) => {
          map[r._id] = results[i].status === 'fulfilled'
            ? (results[i].value.data?.total || 0) : 0;
        });
        setQCounts((prev) => ({ ...prev, ...map }));
      }
    } catch (e) {
      console.error(e);
      setRfqs([]);
    } finally { setLoading(false); }
  }, [page, tabStatus, search]);

  /* ── tab badge counts ── */
  const fetchCounts = useCallback(async () => {
    try {
      const [a, d, c] = await Promise.all([
        api.get('/rfqs?status=open&limit=1'),
        api.get('/rfqs?status=draft&limit=1'),
        api.get('/rfqs?status=closed&limit=1'),
      ]);
      setCounts({
        active: a.data?.total || 0,
        drafts: d.data?.total || 0,
        closed: c.data?.total || 0,
      });
    } catch (_) {}
  }, []);

  const fetchVendors = async () => {
    try {
      const res = await api.get('/vendors?limit=100&status=active');
      setVendors(res.data?.data || []);
    } catch (_) {}
  };

  useEffect(() => { fetchRFQs(); },  [fetchRFQs]);
  useEffect(() => { fetchCounts(); }, [fetchCounts]);
  useEffect(() => { fetchVendors(); }, []);
  useEffect(() => { setPage(1); }, [tab, search]);

  /* ── actions ── */
  const handleAction = async (rfq, action) => {
    try {
      if      (action === 'send')      await api.patch(`/rfqs/${rfq._id}/send`);
      else if (action === 'close')     await api.patch(`/rfqs/${rfq._id}/close`);
      else if (action === 'cancel')    await api.patch(`/rfqs/${rfq._id}/cancel`);
      else if (action === 'duplicate') await api.post(`/rfqs/${rfq._id}/duplicate`);
      fetchRFQs(); fetchCounts();
    } catch (e) { console.error(e); }
  };

  /* ── client-side filter + sort ── */
  const displayed = rfqs
    .filter((r) => {
      if (prioFilter && r.priority !== prioFilter) return false;
      if (catFilter  && r.category !== catFilter)  return false;
      return true;
    })
    .sort((a, b) =>
      sortBy === 'deadline'
        ? new Date(a.deadline) - new Date(b.deadline)
        : a.title.localeCompare(b.title)
    );

  const categories = [...new Set(rfqs.map((r) => r.category).filter(Boolean))];

  /* ── export CSV ── */
  const exportReport = () => {
    const hdr = ['RFQ ID','Title','Category','Priority','Deadline','Status','Vendors','Responses'];
    const rows = rfqs.map((r) => [
      r.rfqNumber, r.title, r.category, r.priority,
      fmtDeadline(r.deadline), r.status,
      r.assignedVendors?.length || 0, qCounts[r._id] || 0,
    ]);
    const csv = [hdr, ...rows].map((r) => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `rfq-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  /* ── pagination numbers ── */
  const pageNums = Array.from(
    { length: Math.min(totalPages, 5) },
    (_, i) => {
      if (totalPages <= 5) return i + 1;
      if (page <= 3) return i + 1;
      if (page >= totalPages - 2) return totalPages - 4 + i;
      return page - 2 + i;
    }
  );

  // ── render ─────────────────────────────────────────────

  return (
    <div className="max-w-[1200px] mx-auto">

      {/* Breadcrumb */}
      <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#858484] mb-2">
        Procurement
        <span className="mx-1.5 text-[#C4C7C7]">›</span>
        <span className="text-[#858484]">Requests for Quotation</span>
      </p>

      {/* Page title + action buttons */}
      <div className="flex items-end justify-between gap-6 mb-7">
        <div>
          <h1
            className="text-[36px] leading-[1.1] text-[#1C1C1C] font-normal"
            style={{ fontFamily: "'DM Serif Display', serif", fontStyle: 'italic' }}
          >
            Solicitation Repository
          </h1>
          <p className="text-[13.5px] text-[#858484] mt-1.5 max-w-[480px] leading-snug">
            Manage your organisational procurement flow through structured RFQ cycles,
            vendor evaluations, and high-precision selection criteria.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {/* Export */}
          <button
            onClick={exportReport}
            className="flex items-center gap-2 px-4 py-[9px] rounded-lg text-[13px] font-semibold
                       text-[#1C1C1C] transition-all hover:bg-[#EEECE8]"
            style={{ border: '1px solid #E5E1D8', background: '#fff' }}
          >
            Export Report
          </button>
          {/* Create */}
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-[9px] rounded-lg text-[13px] font-bold
                       transition-all hover:opacity-90 active:opacity-80"
            style={{ background: '#C6A664', color: '#1C1C1C' }}
          >
            <span className="material-symbols-outlined text-[15px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}>add</span>
            Create New RFQ
          </button>
        </div>
      </div>

      {/* ── CARD ── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: '#fff', border: '1px solid #E5E1D8', boxShadow: '0 4px 20px rgba(28,28,28,0.04)' }}
      >

        {/* Tabs */}
        <div style={{ borderBottom: '1px solid #E5E1D8' }}>
          <div className="flex px-6 pt-0 gap-0">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className="relative mr-7 py-4 text-[13px] font-semibold whitespace-nowrap transition-colors"
                style={{
                  color: tab === t.key ? '#1C1C1C' : '#858484',
                  borderBottom: tab === t.key ? '2px solid #1C1C1C' : '2px solid transparent',
                }}
              >
                {t.label}
                {counts[t.key] > 0 && (
                  <span
                    className="ml-1.5 text-[11px] font-bold rounded-full px-1.5 py-[1px]"
                    style={{
                      background: tab === t.key ? '#1C1C1C' : '#EEECE8',
                      color:      tab === t.key ? '#fff'    : '#858484',
                    }}
                  >
                    {counts[t.key]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Filter bar */}
        <div className="px-6 py-3 flex flex-wrap items-center gap-2"
             style={{ borderBottom: '1px solid #E5E1D8', background: '#FAFAF8' }}>

          {/* Category: All dropdown */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2
                             text-[14px] text-[#858484] pointer-events-none">
              filter_list
            </span>
            <select
              value={catFilter}
              onChange={(e) => setCatFilter(e.target.value)}
              className="appearance-none pl-7 pr-6 py-[5px] text-[12px] font-semibold rounded-full
                         focus:outline-none focus:border-[#C6A664] cursor-pointer"
              style={{ background: '#EEECE8', border: '1px solid #E5E1D8', color: '#1C1C1C' }}
            >
              <option value="">Category: All</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Priority chip */}
          {prioFilter ? (
            <Chip
              label={`Priority: ${prioFilter.charAt(0).toUpperCase() + prioFilter.slice(1)}`}
              onRemove={() => setPrioFilter('')}
            />
          ) : (
            <select
              value={prioFilter}
              onChange={(e) => setPrioFilter(e.target.value)}
              className="appearance-none px-3 py-[5px] text-[12px] font-semibold rounded-full
                         focus:outline-none focus:border-[#C6A664] cursor-pointer"
              style={{ background: '#EEECE8', border: '1px solid #E5E1D8', color: '#1C1C1C' }}
            >
              <option value="">Priority: All</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          )}

          {/* Sort */}
          <div className="ml-auto flex items-center gap-1.5 text-[12px] font-semibold text-[#858484]">
            <span className="uppercase tracking-[0.06em]">Sort by:</span>
            <button
              onClick={() => setSortBy(sortBy === 'deadline' ? 'title' : 'deadline')}
              className="flex items-center gap-0.5 font-bold uppercase tracking-[0.06em]
                         text-[#1C1C1C] hover:text-[#C6A664] transition-colors"
            >
              {sortBy === 'deadline' ? 'Deadline' : 'Title'}
              <span className="material-symbols-outlined text-[14px]">arrow_downward</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ background: '#FAFAF8', borderBottom: '1px solid #E5E1D8' }}>
                {['RFQ ID', 'Subject & Project', 'Responses', 'Invited Vendors', 'Deadline', 'Actions'].map((h, i) => (
                  <th
                    key={h}
                    className="px-6 py-3 text-[11px] font-bold uppercase tracking-[0.07em] text-left"
                    style={{
                      color: '#858484',
                      textAlign: i === 2 ? 'center' : i === 5 ? 'right' : 'left',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {/* skeleton */}
              {loading && Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #F0EDE8' }}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-6 py-4">
                      <div className="h-4 rounded animate-pulse" style={{ background: '#F0EDE8', width: '70%' }} />
                    </td>
                  ))}
                </tr>
              ))}

              {/* empty state */}
              {!loading && displayed.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <span className="material-symbols-outlined text-[48px] text-[#C4C7C7] block mb-3">
                      inbox
                    </span>
                    <p className="text-[13px] text-[#858484] font-medium">
                      No {tab === 'active' ? 'active solicitations' : tab === 'drafts' ? 'drafts' : 'archived RFQs'} found
                    </p>
                    {tab !== 'closed' && (
                      <button
                        onClick={() => setShowModal(true)}
                        className="mt-2 text-[13px] font-semibold text-[#745b20] hover:underline"
                      >
                        Create your first RFQ →
                      </button>
                    )}
                  </td>
                </tr>
              )}

              {/* rows */}
              {!loading && displayed.map((rfq, idx) => (
                <tr
                  key={rfq._id}
                  className="group transition-colors"
                  style={{
                    borderBottom: '1px solid #F0EDE8',
                    background: 'transparent',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#FDFCFA'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  {/* RFQ ID */}
                  <td className="px-6 py-4 align-top">
                    <p className="text-[13px] font-semibold text-[#1C1C1C] leading-tight"
                       style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
                      #{rfq.rfqNumber}
                    </p>
                    <PriorityBadge priority={rfq.priority} />
                  </td>

                  {/* Subject & Project */}
                  <td className="px-6 py-4 align-top max-w-[220px]">
                    <p className="text-[14px] font-semibold text-[#1C1C1C] leading-snug">
                      {rfq.title}
                    </p>
                    {rfq.category && (
                      <p className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-[#858484] mt-[3px]">
                        {rfq.category}
                      </p>
                    )}
                  </td>

                  {/* Responses */}
                  <td className="px-6 py-4 align-top text-center">
                    <ResponsePill
                      count={qCounts[rfq._id] || 0}
                      total={rfq.assignedVendors?.length || 0}
                    />
                  </td>

                  {/* Invited vendors */}
                  <td className="px-6 py-4 align-top">
                    <VendorStack vendors={rfq.assignedVendors || []} />
                  </td>

                  {/* Deadline */}
                  <td className="px-6 py-4 align-top">
                    <p className="text-[13px] font-medium text-[#1C1C1C] leading-tight"
                       style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
                      {fmtDeadline(rfq.deadline)}
                    </p>
                    <DeadlineBadge deadline={rfq.deadline} status={rfq.status} />
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 align-top text-right">
                    <ActionsMenu rfq={rfq} onAction={handleAction} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        {!loading && displayed.length > 0 && (
          <div className="px-6 py-4 flex items-center justify-between"
               style={{ borderTop: '1px solid #E5E1D8' }}>
            <p className="text-[12px] text-[#858484]">
              Showing{' '}
              <strong className="text-[#1C1C1C] font-semibold">
                {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalCount)}
              </strong>{' '}
              of <strong className="text-[#1C1C1C] font-semibold">{totalCount}</strong>{' '}
              active requests
            </p>

            <div className="flex items-center gap-1">
              {/* Prev */}
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-[#858484]
                           hover:bg-[#EEECE8] disabled:opacity-30 transition-colors"
                style={{ border: '1px solid #E5E1D8' }}
              >
                <span className="material-symbols-outlined text-[16px]">chevron_left</span>
              </button>

              {pageNums.map((n) => (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg
                             text-[13px] font-semibold transition-all"
                  style={{
                    border:     page === n ? 'none'           : '1px solid #E5E1D8',
                    background: page === n ? '#1C1C1C'        : '#fff',
                    color:      page === n ? '#fff'           : '#1C1C1C',
                  }}
                >
                  {n}
                </button>
              ))}

              {/* Next */}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-[#858484]
                           hover:bg-[#EEECE8] disabled:opacity-30 transition-colors"
                style={{ border: '1px solid #E5E1D8' }}
              >
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <CreateRFQModal
          onClose={() => setShowModal(false)}
          onCreated={() => { fetchRFQs(); fetchCounts(); }}
          vendors={vendors}
        />
      )}
    </div>
  );
};

export default RFQManagement;
