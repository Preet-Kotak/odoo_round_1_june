import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const C = { ivory: '#F9F7F3', charcoal: '#1C1C1C', gold: '#C6A664', border: '#E5E1D8', muted: '#858484' };

const DEC_STYLE = { pending: ['#FEF3C7','#92400E'], approved: ['#DCFCE7','#166534'], rejected: ['#FEE2E2','#B91C1C'] };

function ApprovalDetail({ approval, onClose, onUpdate }) {
  const [remarks, setRemarks] = useState('');
  const [saving, setSaving]   = useState(false);

  const act = async (action) => {
    setSaving(true);
    try {
      await api.patch(`/approvals/${approval._id}/${action}`, { remarks });
      onUpdate();
      onClose();
    } catch (e) { alert(e.response?.data?.message || `Failed to ${action}.`); }
    finally { setSaving(false); }
  };

  const [sbg, sfg] = DEC_STYLE[approval.decision] || ['#F1F5F9','#475569'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl" style={{ background: '#fff', boxShadow: '0 24px 60px rgba(28,28,28,0.18)' }}>
        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: `1px solid ${C.border}` }}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: C.muted }}>Approval Request</p>
            <h2 className="text-[20px] font-normal mt-0.5 capitalize" style={{ fontFamily: "'DM Serif Display',serif" }}>
              {approval.referenceType?.replace('_',' ')}
            </h2>
          </div>
          <button onClick={onClose}><span className="material-symbols-outlined text-[22px]" style={{ color: C.muted }}>close</span></button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { l: 'Type',         v: approval.referenceType?.replace('_',' ') },
              { l: 'Decision',     v: <span className="text-[11px] font-bold uppercase rounded-full px-2.5 py-0.5" style={{ background: sbg, color: sfg }}>{approval.decision}</span> },
              { l: 'Requested By', v: approval.requestedBy?.name || approval.requestedBy || '—' },
              { l: 'Assigned To',  v: approval.assignedTo?.name || approval.assignedTo || '—' },
              { l: 'Date',         v: new Date(approval.createdAt).toLocaleString('en-IN') },
            ].map(f => (
              <div key={f.l} className="rounded-lg px-3 py-2" style={{ background: C.ivory }}>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: C.muted }}>{f.l}</p>
                <p className="text-[13px]" style={{ color: C.charcoal }}>{f.v}</p>
              </div>
            ))}
          </div>

          {approval.decision === 'pending' && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: C.muted }}>Remarks (optional)</p>
              <textarea value={remarks} onChange={e => setRemarks(e.target.value)} rows={3}
                        placeholder="Add approval or rejection remarks…"
                        className="w-full border rounded-lg px-3.5 py-2.5 text-[13px] resize-none focus:outline-none focus:border-[#C6A664]"
                        style={{ borderColor: C.border }} />
            </div>
          )}
        </div>

        {approval.decision === 'pending' && (
          <div className="flex justify-end gap-3 px-6 py-4 rounded-b-2xl" style={{ borderTop: `1px solid ${C.border}`, background: C.ivory }}>
            <button onClick={onClose} className="px-5 py-2.5 rounded-lg text-[13px] font-semibold border hover:bg-white transition-colors" style={{ borderColor: C.border, color: C.muted }}>Cancel</button>
            <button onClick={() => act('reject')} disabled={saving}
                    className="px-5 py-2.5 rounded-lg text-[13px] font-semibold border disabled:opacity-50 hover:bg-red-50 transition-colors"
                    style={{ borderColor: '#D94F3D', color: '#D94F3D' }}>
              {saving ? '…' : 'Reject'}
            </button>
            <button onClick={() => act('approve')} disabled={saving}
                    className="px-5 py-2.5 rounded-lg text-[13px] font-bold disabled:opacity-50 hover:opacity-90"
                    style={{ background: C.gold, color: C.charcoal }}>
              {saving ? 'Approving…' : 'Approve'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Approvals() {
  const [approvals, setApprovals] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [tab,       setTab]       = useState('pending');
  const [selected,  setSelected]  = useState(null);
  const [counts,    setCounts]    = useState({ pending: 0, approved: 0, rejected: 0 });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [pending, approved, rejected, current] = await Promise.all([
        api.get('/approvals?decision=pending&limit=1'),
        api.get('/approvals?decision=approved&limit=1'),
        api.get('/approvals?decision=rejected&limit=1'),
        api.get(`/approvals?decision=${tab}&limit=50`),
      ]);
      setCounts({ pending: pending.data?.total||0, approved: approved.data?.total||0, rejected: rejected.data?.total||0 });
      setApprovals(current.data?.data || []);
    } catch { setApprovals([]); }
    finally { setLoading(false); }
  }, [tab]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const TABS = ['pending','approved','rejected'];

  return (
    <div className="max-w-[1200px] mx-auto">
      <p className="text-[11px] font-bold uppercase tracking-[0.1em] mb-2" style={{ color: C.muted }}>Procurement › Approvals</p>

      <div className="flex items-end justify-between gap-4 mb-7">
        <div>
          <h1 className="text-[32px] font-normal" style={{ fontFamily: "'DM Serif Display',serif", fontStyle: 'italic' }}>Approval Workflow</h1>
          <p className="text-[13px] mt-1.5" style={{ color: C.muted }}>Review, approve or reject quotations and purchase requests.</p>
        </div>
        {counts.pending > 0 && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl" style={{ background: '#FEF3C7', border: '1px solid #D97706' }}>
            <span className="material-symbols-outlined text-[18px]" style={{ color: '#92400E' }}>notification_important</span>
            <span className="text-[13px] font-bold" style={{ color: '#92400E' }}>{counts.pending} pending approval{counts.pending>1?'s':''}</span>
          </div>
        )}
      </div>

      {/* Stat chips */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {TABS.map(t => {
          const [bg, fg] = DEC_STYLE[t]||['#F1F5F9','#475569'];
          return (
            <button key={t} onClick={() => setTab(t)}
                    className="rounded-xl px-4 py-3 flex items-center justify-between transition-all"
                    style={{ background: tab===t?bg:'#fff', border: `1px solid ${tab===t?fg:C.border}` }}>
              <p className="text-[11px] font-bold uppercase tracking-wider capitalize" style={{ color: tab===t?fg:C.muted }}>{t}</p>
              <p className="text-[22px] font-bold" style={{ color: tab===t?fg:C.charcoal, fontFamily:"'IBM Plex Sans',sans-serif" }}>{counts[t]}</p>
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', border: `1px solid ${C.border}` }}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ background: '#FAFAF8', borderBottom: `1px solid ${C.border}` }}>
                {['Type','Requested By','Assigned To','Date','Decision','Actions'].map((h,i)=>(
                  <th key={h} className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-[0.07em]"
                      style={{ color: C.muted, textAlign: i===5?'right':'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && [1,2,3].map(i=>(
                <tr key={i} style={{ borderBottom:'1px solid #F0EDE8' }}>
                  {[1,2,3,4,5,6].map(j=><td key={j} className="px-5 py-4"><div className="h-4 rounded animate-pulse" style={{ background:'#F0EDE8', width:'70%' }}/></td>)}
                </tr>
              ))}
              {!loading && approvals.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-16 text-center">
                  <span className="material-symbols-outlined text-[48px] block mb-3" style={{ color:'#C4C7C7' }}>fact_check</span>
                  <p className="text-[13px] font-medium" style={{ color: C.muted }}>No {tab} approvals</p>
                </td></tr>
              )}
              {!loading && approvals.map(a => {
                const [sbg,sfg] = DEC_STYLE[a.decision]||['#F1F5F9','#475569'];
                return (
                  <tr key={a._id} style={{ borderBottom:'1px solid #F0EDE8' }}
                      onMouseEnter={e=>e.currentTarget.style.background='#FDFCFA'}
                      onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <td className="px-5 py-4 text-[13px] font-semibold capitalize" style={{ color: C.charcoal }}>{a.referenceType?.replace('_',' ')}</td>
                    <td className="px-5 py-4 text-[13px]" style={{ color: C.muted }}>{a.requestedBy?.name || '—'}</td>
                    <td className="px-5 py-4 text-[13px]" style={{ color: C.muted }}>{a.assignedTo?.name || '—'}</td>
                    <td className="px-5 py-4 text-[12px]" style={{ color: C.muted, fontFamily:"'IBM Plex Sans',sans-serif" }}>{new Date(a.createdAt).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})}</td>
                    <td className="px-5 py-4">
                      <span className="text-[11px] font-bold uppercase rounded-full px-2.5 py-0.5" style={{ background:sbg, color:sfg }}>{a.decision}</span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button onClick={() => setSelected(a)} className="text-[12px] font-bold hover:underline" style={{ color: '#745b20' }}>
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

      {selected && <ApprovalDetail approval={selected} onClose={() => setSelected(null)} onUpdate={fetchAll} />}
    </div>
  );
}
