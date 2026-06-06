import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const C = { ivory: '#F9F7F3', charcoal: '#1C1C1C', gold: '#C6A664', border: '#E5E1D8', muted: '#858484' };

const INV_STATUS = {
  draft:    ['#F1F5F9','#475569'],
  pending:  ['#FEF3C7','#92400E'],
  approved: ['#DCFCE7','#166534'],
  rejected: ['#FEE2E2','#B91C1C'],
  paid:     ['#F3E8FF','#7e22ce'],
};

function InvoiceDetail({ invoice, onClose, onUpdate }) {
  const [acting, setActing] = useState(false);

  const act = async (action) => {
    setActing(true);
    try { await api.patch(`/invoices/${invoice._id}/${action}`); onUpdate(); onClose(); }
    catch (e) { alert(e.response?.data?.message || 'Action failed.'); }
    finally { setActing(false); }
  };
  const sendEmail = async () => {
    setActing(true);
    try { await api.post(`/invoices/${invoice._id}/email`); alert('Invoice sent via email!'); }
    catch (e) { alert(e.response?.data?.message || 'Failed to send email.'); }
    finally { setActing(false); }
  };

  const [sbg, sfg] = INV_STATUS[invoice.status] || ['#F1F5F9','#475569'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl" style={{ background:'#fff', boxShadow:'0 24px 60px rgba(28,28,28,0.18)' }}>
        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom:`1px solid ${C.border}` }}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color:C.muted }}>Invoice</p>
            <h2 className="text-[20px] font-normal mt-0.5" style={{ fontFamily:"'DM Serif Display',serif" }}>{invoice.invoiceNumber}</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-bold uppercase rounded-full px-2.5 py-0.5" style={{ background:sbg, color:sfg }}>{invoice.status}</span>
            <button onClick={onClose}><span className="material-symbols-outlined text-[22px]" style={{ color:C.muted }}>close</span></button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { l:'Vendor',      v: invoice.vendorId?.companyName || '—' },
              { l:'Grand Total', v: `₹${invoice.grandTotal?.toLocaleString('en-IN')}` },
              { l:'Subtotal',    v: `₹${invoice.subtotal?.toLocaleString('en-IN')}` },
              { l:'Tax Amount',  v: `₹${invoice.taxAmount?.toLocaleString('en-IN')} (${invoice.taxRate}%)` },
              { l:'Discount',    v: `${invoice.discount}%` },
              { l:'Issue Date',  v: invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}) : '—' },
              { l:'Due Date',    v: invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}) : '—' },
            ].map(f => (
              <div key={f.l} className="rounded-lg px-3 py-2" style={{ background:C.ivory }}>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color:C.muted }}>{f.l}</p>
                <p className="text-[13px]" style={{ color:C.charcoal }}>{f.v}</p>
              </div>
            ))}
          </div>

          {invoice.lineItems?.length > 0 && (
            <div className="rounded-xl overflow-hidden" style={{ border:`1px solid ${C.border}` }}>
              <p className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider" style={{ color:C.muted, background:'#FAFAF8', borderBottom:`1px solid ${C.border}` }}>Line Items</p>
              <table className="w-full border-collapse">
                <thead><tr style={{ borderBottom:`1px solid ${C.border}` }}>
                  {['Item','Qty','Unit Price','Total'].map(h=><th key={h} className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-wider" style={{ color:C.muted }}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {invoice.lineItems.map((li,i)=>(
                    <tr key={i} style={{ borderBottom:'1px solid #F0EDE8' }}>
                      <td className="px-4 py-2 text-[13px]" style={{ color:C.charcoal }}>{li.itemName}</td>
                      <td className="px-4 py-2 text-[13px]" style={{ color:C.muted }}>{li.quantity}</td>
                      <td className="px-4 py-2 text-[13px]" style={{ color:C.charcoal }}>₹{li.unitPrice?.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-2 text-[13px] font-semibold" style={{ color:C.charcoal }}>₹{li.totalPrice?.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex flex-wrap justify-end gap-3 px-6 py-4 rounded-b-2xl" style={{ borderTop:`1px solid ${C.border}`, background:C.ivory }}>
          <button onClick={onClose} className="px-4 py-2.5 rounded-lg text-[13px] font-semibold border hover:bg-white" style={{ borderColor:C.border, color:C.muted }}>Close</button>
          <a href={`http://localhost:5000/api/invoices/${invoice._id}/pdf`} target="_blank" rel="noreferrer"
             className="px-4 py-2.5 rounded-lg text-[13px] font-semibold border flex items-center gap-1.5 hover:bg-[#EEECE8] transition-colors"
             style={{ borderColor:C.border, color:C.charcoal }}>
            <span className="material-symbols-outlined text-[15px]">download</span> PDF
          </a>
          <button onClick={sendEmail} disabled={acting} className="px-4 py-2.5 rounded-lg text-[13px] font-semibold border flex items-center gap-1.5 disabled:opacity-50 hover:bg-[#EEECE8]"
                  style={{ borderColor:C.border, color:C.charcoal }}>
            <span className="material-symbols-outlined text-[15px]">email</span> Email
          </button>
          {invoice.status === 'pending' && (
            <>
              <button onClick={()=>act('reject')} disabled={acting} className="px-4 py-2.5 rounded-lg text-[13px] font-semibold border disabled:opacity-50 hover:bg-red-50"
                      style={{ borderColor:'#D94F3D', color:'#D94F3D' }}>Reject</button>
              <button onClick={()=>act('approve')} disabled={acting} className="px-4 py-2.5 rounded-lg text-[13px] font-bold disabled:opacity-50 hover:opacity-90"
                      style={{ background:C.gold, color:C.charcoal }}>{acting?'…':'Approve'}</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState('all');
  const [detail,   setDetail]   = useState(null);
  const [page,     setPage]     = useState(1);
  const [total,    setTotal]    = useState(0);
  const LIMIT = 15;

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page, limit: LIMIT });
      if (tab !== 'all') p.set('status', tab);
      const res = await api.get(`/invoices?${p}`);
      setInvoices(res.data?.data || []);
      setTotal(res.data?.total || 0);
    } catch { setInvoices([]); }
    finally { setLoading(false); }
  }, [page, tab]);

  useEffect(() => { fetch(); }, [fetch]);
  useEffect(() => { setPage(1); }, [tab]);

  const TABS = ['all','pending','approved','rejected','paid'];
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div className="max-w-[1200px] mx-auto">
      <p className="text-[11px] font-bold uppercase tracking-[0.1em] mb-2" style={{ color:C.muted }}>Procurement › Invoices</p>
      <div className="flex items-end justify-between gap-4 mb-7">
        <div>
          <h1 className="text-[32px] font-normal" style={{ fontFamily:"'DM Serif Display',serif", fontStyle:'italic' }}>Invoices</h1>
          <p className="text-[13px] mt-1.5" style={{ color:C.muted }}>Manage vendor invoices — approve, reject, download PDF or send via email.</p>
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background:'#fff', border:`1px solid ${C.border}` }}>
        {/* Tabs */}
        <div style={{ borderBottom:`1px solid ${C.border}` }}>
          <div className="flex px-6 overflow-x-auto">
            {TABS.map(t=>(
              <button key={t} onClick={()=>setTab(t)}
                      className="mr-6 py-4 text-[13px] font-semibold whitespace-nowrap transition-colors"
                      style={{ color:tab===t?C.charcoal:C.muted, borderBottom:tab===t?`2px solid ${C.charcoal}`:'2px solid transparent' }}>
                {t==='all'?'All Invoices':t.charAt(0).toUpperCase()+t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ background:'#FAFAF8', borderBottom:`1px solid ${C.border}` }}>
                {['Invoice #','Vendor','Grand Total','Issue Date','Due Date','Status','Actions'].map((h,i)=>(
                  <th key={h} className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-[0.07em]"
                      style={{ color:C.muted, textAlign:i===6?'right':'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && [1,2,3].map(i=>(
                <tr key={i} style={{ borderBottom:'1px solid #F0EDE8' }}>
                  {[1,2,3,4,5,6,7].map(j=><td key={j} className="px-5 py-4"><div className="h-4 rounded animate-pulse" style={{ background:'#F0EDE8', width:'70%' }}/></td>)}
                </tr>
              ))}
              {!loading && invoices.length===0 && (
                <tr><td colSpan={7} className="px-5 py-16 text-center">
                  <span className="material-symbols-outlined text-[48px] block mb-3" style={{ color:'#C4C7C7' }}>receipt_long</span>
                  <p className="text-[13px] font-medium" style={{ color:C.muted }}>No invoices found</p>
                </td></tr>
              )}
              {!loading && invoices.map(inv=>{
                const [sbg,sfg]=INV_STATUS[inv.status]||['#F1F5F9','#475569'];
                return (
                  <tr key={inv._id} style={{ borderBottom:'1px solid #F0EDE8' }}
                      onMouseEnter={e=>e.currentTarget.style.background='#FDFCFA'}
                      onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <td className="px-5 py-4 text-[13px] font-semibold" style={{ color:C.charcoal, fontFamily:"'IBM Plex Sans',sans-serif" }}>{inv.invoiceNumber}</td>
                    <td className="px-5 py-4 text-[13px] font-semibold" style={{ color:C.charcoal }}>{inv.vendorId?.companyName||'—'}</td>
                    <td className="px-5 py-4 text-[13px] font-bold" style={{ color:C.charcoal, fontFamily:"'IBM Plex Sans',sans-serif" }}>₹{inv.grandTotal?.toLocaleString('en-IN')}</td>
                    <td className="px-5 py-4 text-[12px]" style={{ color:C.muted }}>{inv.issueDate?new Date(inv.issueDate).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}):'—'}</td>
                    <td className="px-5 py-4 text-[12px]" style={{ color:C.muted }}>{inv.dueDate?new Date(inv.dueDate).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}):'—'}</td>
                    <td className="px-5 py-4">
                      <span className="text-[11px] font-bold uppercase rounded-full px-2.5 py-0.5" style={{ background:sbg, color:sfg }}>{inv.status}</span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button onClick={()=>setDetail(inv)} className="text-[12px] font-bold hover:underline" style={{ color:'#745b20' }}>View →</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {total > LIMIT && (
          <div className="px-5 py-4 flex items-center justify-between" style={{ borderTop:`1px solid ${C.border}` }}>
            <p className="text-[12px]" style={{ color:C.muted }}>Showing <strong style={{ color:C.charcoal }}>{(page-1)*LIMIT+1}–{Math.min(page*LIMIT,total)}</strong> of <strong style={{ color:C.charcoal }}>{total}</strong></p>
            <div className="flex gap-1">
              <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} className="w-8 h-8 flex items-center justify-center rounded-lg border disabled:opacity-30 hover:bg-[#EEECE8]" style={{ borderColor:C.border }}><span className="material-symbols-outlined text-[15px]">chevron_left</span></button>
              {Array.from({length:Math.min(totalPages,5)},(_,i)=>i+1).map(n=>(
                <button key={n} onClick={()=>setPage(n)} className="w-8 h-8 flex items-center justify-center rounded-lg text-[13px] font-semibold"
                        style={{ background:page===n?C.charcoal:'#fff', color:page===n?'#fff':C.charcoal, border:page===n?'none':`1px solid ${C.border}` }}>{n}</button>
              ))}
              <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages} className="w-8 h-8 flex items-center justify-center rounded-lg border disabled:opacity-30 hover:bg-[#EEECE8]" style={{ borderColor:C.border }}><span className="material-symbols-outlined text-[15px]">chevron_right</span></button>
            </div>
          </div>
        )}
      </div>

      {detail && <InvoiceDetail invoice={detail} onClose={()=>setDetail(null)} onUpdate={fetch} />}
    </div>
  );
}
