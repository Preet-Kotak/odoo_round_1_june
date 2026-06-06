import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';

const C = { ivory: '#F9F7F3', charcoal: '#1C1C1C', gold: '#C6A664', border: '#E5E1D8', muted: '#858484' };

const DEC_STYLE = {
  pending:  ['#FEF3C7', '#92400E'],
  approved: ['#DCFCE7', '#166534'],
  rejected: ['#FEE2E2', '#B91C1C'],
};

/* ─── Toast ─────────────────────────────────────────────────────────────── */
function Toast({ msg, type, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3500);
    return () => clearTimeout(t);
  }, [onDone]);

  const bg = type === 'error' ? '#B91C1C' : '#166534';
  const icon = type === 'error' ? 'error' : 'check_circle';

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl"
         style={{ background: bg, color: '#fff', minWidth: 280, animation: 'slideUp .25s ease' }}>
      <span className="material-symbols-outlined text-[20px]">{icon}</span>
      <span className="text-[13px] font-medium">{msg}</span>
    </div>
  );
}

/* ─── ApprovalDetail modal ───────────────────────────────────────────────── */
function ApprovalDetail({ approval: initialApproval, onClose, onUpdate }) {
  // Keep a LOCAL copy so the modal reflects the live decision after action
  const [approval, setApproval] = useState(initialApproval);
  const [remarks,  setRemarks]  = useState('');
  const [saving,   setSaving]   = useState(false);
  const [toast,    setToast]    = useState(null);

  const showToast = (msg, type = 'success') => setToast({ msg, type });

  const act = async (action) => {
    // Client-side guard: rejection requires remarks (mirrors server rule)
    if (action === 'reject' && !remarks.trim()) {
      showToast('Rejection remarks are required.', 'error');
      return;
    }

    setSaving(true);
    try {
      const { data } = await api.patch(`/approvals/${approval._id}/${action}`, { remarks: remarks.trim() });
      // Update the local copy so the modal immediately shows the new decision
      setApproval(prev => ({ ...prev, decision: data.data?.decision || action === 'approve' ? 'approved' : 'rejected' }));
      showToast(`Successfully ${action === 'approve' ? 'approved' : 'rejected'}.`);
      onUpdate(); // refresh list + counts in background
      // Close after a short pause so user sees the toast confirmation
      setTimeout(onClose, 1200);
    } catch (e) {
      showToast(e.response?.data?.message || `Failed to ${action}.`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const [sbg, sfg] = DEC_STYLE[approval.decision] || ['#F1F5F9', '#475569'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}

      <div className="w-full max-w-lg rounded-2xl" style={{ background: '#fff', boxShadow: '0 24px 60px rgba(28,28,28,0.18)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: `1px solid ${C.border}` }}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: C.muted }}>Approval Request</p>
            <h2 className="text-[20px] font-normal mt-0.5 capitalize" style={{ fontFamily: "'DM Serif Display',serif" }}>
              {approval.referenceType?.replace('_', ' ')}
            </h2>
          </div>
          <button onClick={onClose} aria-label="Close">
            <span className="material-symbols-outlined text-[22px]" style={{ color: C.muted }}>close</span>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { l: 'Type',         v: approval.referenceType?.replace('_', ' ') },
              { l: 'Decision',     v: <span className="text-[11px] font-bold uppercase rounded-full px-2.5 py-0.5" style={{ background: sbg, color: sfg }}>{approval.decision}</span> },
              { l: 'Requested By', v: approval.requestedBy?.name  || approval.requestedBy  || '—' },
              { l: 'Assigned To',  v: approval.assignedTo?.name   || approval.assignedTo   || '—' },
              { l: 'Date',         v: new Date(approval.createdAt).toLocaleString('en-IN') },
              ...(approval.remarks ? [{ l: 'Remarks', v: approval.remarks }] : []),
            ].map(f => (
              <div key={f.l} className="rounded-lg px-3 py-2" style={{ background: C.ivory }}>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: C.muted }}>{f.l}</p>
                <p className="text-[13px]" style={{ color: C.charcoal }}>{f.v}</p>
              </div>
            ))}
          </div>

          {approval.decision === 'pending' && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: C.muted }}>
                Remarks <span style={{ color: '#B91C1C' }}>*</span>
                <span className="normal-case font-normal ml-1" style={{ color: C.muted }}>(required for rejection)</span>
              </p>
              <textarea
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                rows={3}
                placeholder="Add approval or rejection remarks…"
                className="w-full border rounded-lg px-3.5 py-2.5 text-[13px] resize-none focus:outline-none focus:border-[#C6A664] transition-colors"
                style={{ borderColor: C.border }}
              />
            </div>
          )}
        </div>

        {/* Footer actions */}
        {approval.decision === 'pending' && (
          <div className="flex justify-end gap-3 px-6 py-4 rounded-b-2xl" style={{ borderTop: `1px solid ${C.border}`, background: C.ivory }}>
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg text-[13px] font-semibold border hover:bg-white transition-colors"
              style={{ borderColor: C.border, color: C.muted }}>
              Cancel
            </button>
            <button
              onClick={() => act('reject')}
              disabled={saving}
              className="px-5 py-2.5 rounded-lg text-[13px] font-semibold border disabled:opacity-50 hover:bg-red-50 transition-colors"
              style={{ borderColor: '#D94F3D', color: '#D94F3D' }}>
              {saving ? '…' : 'Reject'}
            </button>
            <button
              onClick={() => act('approve')}
              disabled={saving}
              className="px-5 py-2.5 rounded-lg text-[13px] font-bold disabled:opacity-50 hover:opacity-90 transition-opacity"
              style={{ background: C.gold, color: C.charcoal }}>
              {saving ? 'Approving…' : 'Approve'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────────────────────── */
export default function Approvals() {
  const [approvals, setApprovals] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [tab,       setTab]       = useState('pending');
  const [selected,  setSelected]  = useState(null);
  const [counts,    setCounts]    = useState({ pending: 0, approved: 0, rejected: 0 });
  const [error,     setError]     = useState(null);
  const [pageToast, setPageToast] = useState(null);

  // Track the most recent fetch so stale responses from previous tabs are ignored
  const fetchSeq = useRef(0);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    const seq = ++fetchSeq.current;

    try {
      const [pending, approved, rejected, current] = await Promise.all([
        api.get('/approvals?decision=pending&limit=1'),
        api.get('/approvals?decision=approved&limit=1'),
        api.get('/approvals?decision=rejected&limit=1'),
        api.get(`/approvals?decision=${tab}&limit=50`),
      ]);

      // Discard if a newer fetch has already started (tab switched mid-flight)
      if (seq !== fetchSeq.current) return;

      setCounts({
        pending:  pending.data?.total  ?? 0,
        approved: approved.data?.total ?? 0,
        rejected: rejected.data?.total ?? 0,
      });
      setApprovals(current.data?.data ?? []);
    } catch (err) {
      if (seq !== fetchSeq.current) return;
      setError('Failed to load approvals. Please try again.');
      setApprovals([]);
    } finally {
      if (seq === fetchSeq.current) setLoading(false);
    }
  }, [tab]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const TABS = ['pending', 'approved', 'rejected'];

  // When a detail action completes, also refresh the selected record from updated list
  const handleUpdate = useCallback(() => {
    fetchAll();
    // Clear selected so the reopened modal uses fresh data from the list
    setSelected(null);
  }, [fetchAll]);

  return (
    <div className="max-w-[1200px] mx-auto">
      {/* Keyframe for toast slide-up */}
      <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {pageToast && <Toast msg={pageToast.msg} type={pageToast.type} onDone={() => setPageToast(null)} />}

      <p className="text-[11px] font-bold uppercase tracking-[0.1em] mb-2" style={{ color: C.muted }}>Procurement › Approvals</p>

      <div className="flex items-end justify-between gap-4 mb-7">
        <div>
          <h1 className="text-[32px] font-normal" style={{ fontFamily: "'DM Serif Display',serif", fontStyle: 'italic' }}>Approval Workflow</h1>
          <p className="text-[13px] mt-1.5" style={{ color: C.muted }}>Review, approve or reject quotations and purchase requests.</p>
        </div>
        {counts.pending > 0 && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl" style={{ background: '#FEF3C7', border: '1px solid #D97706' }}>
            <span className="material-symbols-outlined text-[18px]" style={{ color: '#92400E' }}>notification_important</span>
            <span className="text-[13px] font-bold" style={{ color: '#92400E' }}>{counts.pending} pending approval{counts.pending > 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Stat chips / tab switcher */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {TABS.map(t => {
          const [bg, fg] = DEC_STYLE[t] || ['#F1F5F9', '#475569'];
          return (
            <button
              key={t}
              onClick={() => { setTab(t); setSelected(null); }}
              className="rounded-xl px-4 py-3 flex items-center justify-between transition-all hover:scale-[1.01]"
              style={{ background: tab === t ? bg : '#fff', border: `1px solid ${tab === t ? fg : C.border}` }}>
              <p className="text-[11px] font-bold uppercase tracking-wider capitalize" style={{ color: tab === t ? fg : C.muted }}>{t}</p>
              <p className="text-[22px] font-bold" style={{ color: tab === t ? fg : C.charcoal, fontFamily: "'IBM Plex Sans',sans-serif" }}>{counts[t]}</p>
            </button>
          );
        })}
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-4 flex items-center gap-3 px-5 py-3.5 rounded-xl" style={{ background: '#FEE2E2', border: '1px solid #B91C1C' }}>
          <span className="material-symbols-outlined text-[18px]" style={{ color: '#B91C1C' }}>error</span>
          <span className="text-[13px] font-medium" style={{ color: '#B91C1C' }}>{error}</span>
          <button onClick={fetchAll} className="ml-auto text-[12px] font-bold underline" style={{ color: '#B91C1C' }}>Retry</button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', border: `1px solid ${C.border}` }}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ background: '#FAFAF8', borderBottom: `1px solid ${C.border}` }}>
                {['Type', 'Requested By', 'Assigned To', 'Date', 'Decision', 'Actions'].map((h, i) => (
                  <th key={h} className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-[0.07em]"
                      style={{ color: C.muted, textAlign: i === 5 ? 'right' : 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Skeleton rows */}
              {loading && [1, 2, 3].map(i => (
                <tr key={i} style={{ borderBottom: '1px solid #F0EDE8' }}>
                  {[1, 2, 3, 4, 5, 6].map(j => (
                    <td key={j} className="px-5 py-4">
                      <div className="h-4 rounded animate-pulse" style={{ background: '#F0EDE8', width: '70%' }} />
                    </td>
                  ))}
                </tr>
              ))}

              {/* Empty state */}
              {!loading && approvals.length === 0 && !error && (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <span className="material-symbols-outlined text-[48px] block mb-3" style={{ color: '#C4C7C7' }}>fact_check</span>
                    <p className="text-[13px] font-medium" style={{ color: C.muted }}>No {tab} approvals</p>
                  </td>
                </tr>
              )}

              {/* Data rows */}
              {!loading && approvals.map(a => {
                const [sbg, sfg] = DEC_STYLE[a.decision] || ['#F1F5F9', '#475569'];
                const isSelected = selected?._id === a._id;
                return (
                  <tr
                    key={a._id}
                    style={{ borderBottom: '1px solid #F0EDE8', background: isSelected ? '#FDFCF5' : 'transparent' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#FDFCFA'}
                    onMouseLeave={e => e.currentTarget.style.background = isSelected ? '#FDFCF5' : 'transparent'}>
                    <td className="px-5 py-4 text-[13px] font-semibold capitalize" style={{ color: C.charcoal }}>{a.referenceType?.replace('_', ' ')}</td>
                    <td className="px-5 py-4 text-[13px]" style={{ color: C.muted }}>{a.requestedBy?.name || '—'}</td>
                    <td className="px-5 py-4 text-[13px]" style={{ color: C.muted }}>{a.assignedTo?.name  || '—'}</td>
                    <td className="px-5 py-4 text-[12px]" style={{ color: C.muted, fontFamily: "'IBM Plex Sans',sans-serif" }}>
                      {new Date(a.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-[11px] font-bold uppercase rounded-full px-2.5 py-0.5" style={{ background: sbg, color: sfg }}>{a.decision}</span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => setSelected(a)}
                        className="text-[12px] font-bold hover:underline transition-all"
                        style={{ color: '#745b20' }}>
                        {a.decision === 'pending' ? 'Review →' : 'View →'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail modal — uses fresh data snapshot; onUpdate closes + refreshes */}
      {selected && (
        <ApprovalDetail
          key={selected._id}   // force remount when switching rows
          approval={selected}
          onClose={() => setSelected(null)}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
}
