import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const C = { ivory: '#F9F7F3', charcoal: '#1C1C1C', gold: '#C6A664', border: '#E5E1D8', muted: '#858484' };

const STATUS_STYLE = {
  submitted:    ['#DBEAFE','#1d4ed8'],
  under_review: ['#FEF3C7','#92400E'],
  selected:     ['#DCFCE7','#166534'],
  approved:     ['#DCFCE7','#166534'],
  rejected:     ['#FEE2E2','#B91C1C'],
  draft:        ['#F1F5F9','#475569'],
};

function CompareModal({ rfqId, rfqTitle, onClose }) {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/quotations/rfq/${rfqId}/compare`)
      .then(r => setQuotes(r.data?.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [rfqId]);

  const handleSelect = async (qId) => {
    try { await api.patch(`/quotations/${qId}/select`); onClose(); }
    catch (e) { alert(e.response?.data?.message || 'Failed to select quotation.'); }
  };
  const handleReject = async (qId) => {
    const reason = prompt('Rejection reason:');
    if (!reason) return;
    try { await api.patch(`/quotations/${qId}/reject`, { rejectionReason: reason }); onClose(); }
    catch (e) { alert(e.response?.data?.message || 'Failed to reject quotation.'); }
  };

  const lowest = quotes.length ? Math.min(...quotes.map(q => q.grandTotal)) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl"
           style={{ background: '#fff', boxShadow: '0 24px 60px rgba(28,28,28,0.18)' }}>
        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: `1px solid ${C.border}` }}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: C.muted }}>Quotation Comparison</p>
            <h2 className="text-[20px] font-normal mt-0.5" style={{ fontFamily: "'DM Serif Display',serif" }}>{rfqTitle}</h2>
          </div>
          <button onClick={onClose}><span className="material-symbols-outlined text-[22px]" style={{ color: C.muted }}>close</span></button>
        </div>

        <div className="p-6">
          {loading && <div className="py-10 text-center text-[13px]" style={{ color: C.muted }}>Loading quotations…</div>}
          {!loading && quotes.length === 0 && <div className="py-10 text-center text-[13px]" style={{ color: C.muted }}>No quotations submitted for this RFQ yet.</div>}
          {!loading && quotes.length > 0 && (
            <div className="grid grid-cols-1 gap-4">
              {quotes.sort((a,b)=>a.grandTotal-b.grandTotal).map((q, i) => {
                const [sbg, sfg] = STATUS_STYLE[q.status] || ['#F1F5F9','#475569'];
                const isLowest = q.grandTotal === lowest;
                return (
                  <div key={q._id} className="rounded-xl p-5" style={{
                    border: isLowest ? `2px solid ${C.gold}` : `1px solid ${C.border}`,
                    background: isLowest ? '#FFFDF5' : '#fff'
                  }}>
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-[13px]"
                             style={{ background: '#1C1C1C', color: '#fff' }}>
                          {(q.vendorId?.companyName||'?')[0]}
                        </div>
                        <div>
                          <p className="text-[14px] font-bold" style={{ color: C.charcoal }}>{q.vendorId?.companyName || 'Unknown'}</p>
                          <p className="text-[11px]" style={{ color: C.muted }}>{q.vendorId?.email}</p>
                        </div>
                        {isLowest && <span className="text-[10px] font-bold uppercase rounded-full px-2.5 py-0.5" style={{ background: C.gold, color: C.charcoal }}>Lowest Price</span>}
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-[11px] font-bold uppercase rounded-full px-2.5 py-0.5" style={{ background: sbg, color: sfg }}>{q.status.replace('_',' ')}</span>
                        {['submitted','under_review'].includes(q.status) && (
                          <>
                            <button onClick={() => handleSelect(q._id)} className="px-3 py-1.5 rounded-lg text-[12px] font-bold transition-opacity hover:opacity-90" style={{ background: C.gold, color: C.charcoal }}>Select</button>
                            <button onClick={() => handleReject(q._id)} className="px-3 py-1.5 rounded-lg text-[12px] font-semibold border transition-colors hover:bg-red-50" style={{ borderColor: '#D94F3D', color: '#D94F3D' }}>Reject</button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { label: 'Grand Total', value: `₹${q.grandTotal?.toLocaleString('en-IN')}`, bold: true },
                        { label: 'Subtotal',    value: `₹${q.subtotal?.toLocaleString('en-IN')}` },
                        { label: 'Tax',         value: `${q.taxRate}% (₹${q.taxAmount?.toLocaleString('en-IN')})` },
                        { label: 'Discount',    value: `${q.discount}%` },
                        { label: 'Payment',     value: q.paymentTerms || '—' },
                        { label: 'Validity',    value: q.validityPeriod ? `${q.validityPeriod} days` : '—' },
                        { label: 'Delivery',    value: q.deliveryTimeline ? new Date(q.deliveryTimeline).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}) : '—' },
                        { label: 'Notes',       value: q.notes || '—' },
                      ].map(f => (
                        <div key={f.label} className="rounded-lg px-3 py-2" style={{ background: C.ivory }}>
                          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: C.muted }}>{f.label}</p>
                          <p className="text-[13px] mt-0.5 truncate" style={{ color: C.charcoal, fontWeight: f.bold ? 700 : 400 }}>{f.value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Line items */}
                    {q.lineItems?.length > 0 && (
                      <div className="mt-3 overflow-x-auto">
                        <table className="w-full text-left">
                          <thead><tr style={{ borderBottom: `1px solid ${C.border}` }}>
                            {['Item','Qty','Unit Price','Total'].map(h => <th key={h} className="pb-1.5 text-[10px] font-bold uppercase tracking-wider pr-4" style={{ color: C.muted }}>{h}</th>)}
                          </tr></thead>
                          <tbody>
                            {q.lineItems.map((li,j) => (
                              <tr key={j}><td className="py-1 pr-4 text-[12px]" style={{ color: C.charcoal }}>{li.itemName}</td>
                                <td className="py-1 pr-4 text-[12px]" style={{ color: C.muted }}>{li.quantity}</td>
                                <td className="py-1 pr-4 text-[12px]" style={{ color: C.charcoal }}>₹{li.unitPrice?.toLocaleString('en-IN')}</td>
                                <td className="py-1 pr-4 text-[12px] font-semibold" style={{ color: C.charcoal }}>₹{li.totalPrice?.toLocaleString('en-IN')}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function QuotationComparison() {
  const [rfqs,    setRfqs]    = useState([]);
  const [quotes,  setQuotes]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState('all');
  const [compare, setCompare] = useState(null); // { rfqId, rfqTitle }
  const [page,    setPage]    = useState(1);
  const [total,   setTotal]   = useState(0);
  const LIMIT = 15;

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page, limit: LIMIT });
      if (tab !== 'all') p.set('status', tab);
      const res = await api.get(`/quotations?${p}`);
      setQuotes(res.data?.data || []);
      setTotal(res.data?.total || 0);
    } catch { setQuotes([]); }
    finally { setLoading(false); }
  }, [page, tab]);

  useEffect(() => { fetch(); }, [fetch]);
  useEffect(() => { setPage(1); }, [tab]);

  const TABS = ['all','submitted','under_review','selected','approved','rejected'];
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div className="max-w-[1200px] mx-auto">
      <p className="text-[11px] font-bold uppercase tracking-[0.1em] mb-2" style={{ color: C.muted }}>Procurement › Quotations</p>

      <div className="flex items-end justify-between gap-4 mb-7">
        <div>
          <h1 className="text-[32px] font-normal" style={{ fontFamily: "'DM Serif Display',serif", fontStyle: 'italic' }}>Quotation Comparison</h1>
          <p className="text-[13px] mt-1.5" style={{ color: C.muted }}>Compare vendor responses, evaluate pricing, and select the best offer.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', border: `1px solid ${C.border}` }}>
        <div style={{ borderBottom: `1px solid ${C.border}` }}>
          <div className="flex px-6 gap-0 overflow-x-auto">
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)}
                      className="mr-6 py-4 text-[13px] font-semibold whitespace-nowrap transition-colors"
                      style={{ color: tab===t ? C.charcoal : C.muted, borderBottom: tab===t ? `2px solid ${C.charcoal}` : '2px solid transparent' }}>
                {t === 'all' ? 'All Quotations' : t.replace('_',' ').replace(/\b\w/g,c=>c.toUpperCase())}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ background: '#FAFAF8', borderBottom: `1px solid ${C.border}` }}>
                {['RFQ','Vendor','Grand Total','Tax Rate','Discount','Payment Terms','Status','Actions'].map((h,i)=>(
                  <th key={h} className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-[0.07em]"
                      style={{ color: C.muted, textAlign: i===7?'right':'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && [1,2,3,4].map(i=>(
                <tr key={i} style={{ borderBottom:'1px solid #F0EDE8' }}>
                  {[1,2,3,4,5,6,7,8].map(j=><td key={j} className="px-5 py-4"><div className="h-4 rounded animate-pulse" style={{ background:'#F0EDE8', width:'70%' }}/></td>)}
                </tr>
              ))}
              {!loading && quotes.length===0 && (
                <tr><td colSpan={8} className="px-5 py-16 text-center">
                  <span className="material-symbols-outlined text-[48px] block mb-3" style={{ color:'#C4C7C7' }}>description</span>
                  <p className="text-[13px] font-medium" style={{ color: C.muted }}>No quotations found</p>
                </td></tr>
              )}
              {!loading && quotes.map(q => {
                const [sbg,sfg] = STATUS_STYLE[q.status]||['#F1F5F9','#475569'];
                return (
                  <tr key={q._id} style={{ borderBottom:'1px solid #F0EDE8' }}
                      onMouseEnter={e=>e.currentTarget.style.background='#FDFCFA'}
                      onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <td className="px-5 py-4">
                      <p className="text-[12px] font-semibold" style={{ color: C.muted }}>{q.rfqId?.rfqNumber||'—'}</p>
                      <p className="text-[12px] truncate max-w-[120px]" style={{ color: C.charcoal }}>{q.rfqId?.title||'—'}</p>
                    </td>
                    <td className="px-5 py-4 text-[13px] font-semibold" style={{ color: C.charcoal }}>{q.vendorId?.companyName||'—'}</td>
                    <td className="px-5 py-4 text-[13px] font-bold" style={{ color: C.charcoal, fontFamily:"'IBM Plex Sans',sans-serif" }}>₹{q.grandTotal?.toLocaleString('en-IN')}</td>
                    <td className="px-5 py-4 text-[13px]" style={{ color: C.muted }}>{q.taxRate}%</td>
                    <td className="px-5 py-4 text-[13px]" style={{ color: C.muted }}>{q.discount}%</td>
                    <td className="px-5 py-4 text-[13px]" style={{ color: C.muted }}>{q.paymentTerms||'—'}</td>
                    <td className="px-5 py-4">
                      <span className="text-[11px] font-bold uppercase rounded-full px-2.5 py-0.5" style={{ background:sbg, color:sfg }}>{q.status.replace('_',' ')}</span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {q.rfqId?._id && (
                        <button onClick={() => setCompare({ rfqId: q.rfqId._id, rfqTitle: q.rfqId.title })}
                                className="text-[12px] font-bold hover:underline" style={{ color: '#745b20' }}>
                          Compare →
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {total > LIMIT && (
          <div className="px-5 py-4 flex items-center justify-between" style={{ borderTop:`1px solid ${C.border}` }}>
            <p className="text-[12px]" style={{ color: C.muted }}>Showing <strong style={{ color: C.charcoal }}>{(page-1)*LIMIT+1}–{Math.min(page*LIMIT,total)}</strong> of <strong style={{ color: C.charcoal }}>{total}</strong></p>
            <div className="flex gap-1">
              <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} className="w-8 h-8 flex items-center justify-center rounded-lg border disabled:opacity-30 hover:bg-[#EEECE8]" style={{ borderColor:C.border }}>
                <span className="material-symbols-outlined text-[15px]">chevron_left</span>
              </button>
              {Array.from({length:Math.min(totalPages,5)},(_,i)=>i+1).map(n=>(
                <button key={n} onClick={()=>setPage(n)} className="w-8 h-8 flex items-center justify-center rounded-lg text-[13px] font-semibold"
                        style={{ background:page===n?C.charcoal:'#fff', color:page===n?'#fff':C.charcoal, border:page===n?'none':`1px solid ${C.border}` }}>{n}</button>
              ))}
              <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages} className="w-8 h-8 flex items-center justify-center rounded-lg border disabled:opacity-30 hover:bg-[#EEECE8]" style={{ borderColor:C.border }}>
                <span className="material-symbols-outlined text-[15px]">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {compare && <CompareModal {...compare} onClose={() => { setCompare(null); fetch(); }} />}
    </div>
  );
}
