import React, { useState, useEffect } from 'react';
import api from '../services/api';

const C = { ivory: '#F9F7F3', charcoal: '#1C1C1C', gold: '#C6A664', border: '#E5E1D8', muted: '#858484' };
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function Reports() {
  const [spending, setSpending] = useState([]);
  const [trends,   setTrends]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [from,     setFrom]     = useState('');
  const [to,       setTo]       = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (from) params.from = from;
      if (to)   params.to   = to;
      const [spendRes, trendsRes] = await Promise.all([
        api.get('/reports/spending-summary', { params }),
        api.get('/reports/monthly-trends'),
      ]);
      setSpending(spendRes.data?.data || []);
      setTrends(trendsRes.data?.data || []);
    } catch { setSpending([]); setTrends([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const totalSpend = spending.reduce((s, x) => s + x.totalSpend, 0);
  const maxTrend   = Math.max(...trends.map(t => t.totalSpend), 1);

  const exportCSV = () => {
    const hdr = ['Vendor','Invoice Count','Total Spend'];
    const rows = spending.map(s => [s.vendorName, s.invoiceCount, s.totalSpend]);
    const csv = [hdr, ...rows].map(r => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `spending-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="max-w-[1200px] mx-auto">
      <p className="text-[11px] font-bold uppercase tracking-[0.1em] mb-2" style={{ color: C.muted }}>Procurement › Reports</p>

      <div className="flex items-end justify-between gap-4 mb-7">
        <div>
          <h1 className="text-[32px] font-normal" style={{ fontFamily: "'DM Serif Display',serif", fontStyle: 'italic' }}>Reports & Analytics</h1>
          <p className="text-[13px] mt-1.5" style={{ color: C.muted }}>Procurement spending summaries, vendor performance and monthly trends.</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="date" value={from} onChange={e => setFrom(e.target.value)}
                 className="px-3 py-2 rounded-lg text-[12px] border focus:outline-none focus:border-[#C6A664]"
                 style={{ borderColor: C.border }} />
          <span className="text-[12px]" style={{ color: C.muted }}>to</span>
          <input type="date" value={to} onChange={e => setTo(e.target.value)}
                 className="px-3 py-2 rounded-lg text-[12px] border focus:outline-none focus:border-[#C6A664]"
                 style={{ borderColor: C.border }} />
          <button onClick={fetchData} className="px-4 py-2 rounded-lg text-[12px] font-bold hover:opacity-90"
                  style={{ background: C.charcoal, color: '#fff' }}>Apply</button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-3 gap-4 mb-7">
        {[
          { l: 'Total Spend',     v: `₹${(totalSpend/1e6).toFixed(2)}M`, icon: 'payments',     bg: '#FFF3D6', fg: '#745b20' },
          { l: 'Vendors Active',  v: spending.length,                    icon: 'storefront',   bg: '#DCFCE7', fg: '#166534' },
          { l: 'Total Invoices',  v: spending.reduce((s,x)=>s+x.invoiceCount,0), icon: 'receipt_long', bg: '#DBEAFE', fg: '#1d4ed8' },
        ].map(k => (
          <div key={k.l} className="rounded-2xl p-5 flex items-center gap-4"
               style={{ background: '#fff', border: `1px solid ${C.border}` }}>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: k.bg }}>
              <span className="material-symbols-outlined text-[20px]" style={{ color: k.fg }}>{k.icon}</span>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: C.muted }}>{k.l}</p>
              <p className="text-[24px] font-bold mt-0.5" style={{ color: C.charcoal, fontFamily: "'IBM Plex Sans',sans-serif" }}>{k.v}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Monthly Trends Chart */}
      <div className="rounded-2xl p-6 mb-6" style={{ background: '#fff', border: `1px solid ${C.border}` }}>
        <h3 className="text-[15px] font-semibold mb-5" style={{ color: C.charcoal }}>Monthly Spend Trends</h3>
        {loading ? (
          <div className="h-40 flex items-center justify-center text-[13px]" style={{ color: C.muted }}>Loading…</div>
        ) : trends.length === 0 ? (
          <div className="h-40 flex flex-col items-center justify-center gap-2">
            <span className="material-symbols-outlined text-[40px]" style={{ color: '#C4C7C7' }}>bar_chart</span>
            <p className="text-[13px]" style={{ color: C.muted }}>No trend data — purchase orders generate this data.</p>
          </div>
        ) : (
          <div className="flex items-end gap-2 h-44 overflow-x-auto pb-2">
            {trends.map((t, i) => {
              const pct = Math.max(8, (t.totalSpend / maxTrend) * 100);
              return (
                <div key={i} className="flex flex-col items-center gap-1 flex-1 min-w-[40px]" title={`₹${t.totalSpend?.toLocaleString('en-IN')}`}>
                  <p className="text-[10px] font-bold" style={{ color: C.gold }}>₹{(t.totalSpend/1e3).toFixed(0)}K</p>
                  <div className="w-full rounded-t-md transition-all" style={{ height: `${pct}%`, background: `linear-gradient(180deg, ${C.gold} 0%, #B5954F 100%)` }} />
                  <p className="text-[10px] font-semibold" style={{ color: C.muted }}>{MONTHS[(t._id?.month||1)-1]}</p>
                  <p className="text-[9px]" style={{ color: '#C4C7C7' }}>{t._id?.year}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Spending by Vendor Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', border: `1px solid ${C.border}` }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${C.border}` }}>
          <h3 className="text-[15px] font-semibold" style={{ color: C.charcoal }}>Spending by Vendor</h3>
          <button onClick={exportCSV} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-semibold border hover:bg-[#EEECE8] transition-colors"
                  style={{ borderColor: C.border, color: C.charcoal }}>
            <span className="material-symbols-outlined text-[15px]">download</span> Export CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ background: '#FAFAF8', borderBottom: `1px solid ${C.border}` }}>
                {['Rank','Vendor','Invoice Count','Total Spend','Share'].map((h,i)=>(
                  <th key={h} className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-[0.07em]"
                      style={{ color: C.muted, textAlign: i>=2?'right':'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && [1,2,3].map(i=>(
                <tr key={i} style={{ borderBottom:'1px solid #F0EDE8' }}>
                  {[1,2,3,4,5].map(j=><td key={j} className="px-5 py-4"><div className="h-4 rounded animate-pulse" style={{ background:'#F0EDE8', width:'70%' }}/></td>)}
                </tr>
              ))}
              {!loading && spending.length===0 && (
                <tr><td colSpan={5} className="px-5 py-16 text-center">
                  <span className="material-symbols-outlined text-[48px] block mb-3" style={{ color:'#C4C7C7' }}>analytics</span>
                  <p className="text-[13px] font-medium" style={{ color:C.muted }}>No spending data available yet</p>
                </td></tr>
              )}
              {!loading && spending.map((s,i)=>{
                const share = totalSpend > 0 ? ((s.totalSpend/totalSpend)*100).toFixed(1) : 0;
                return (
                  <tr key={i} style={{ borderBottom:'1px solid #F0EDE8' }}
                      onMouseEnter={e=>e.currentTarget.style.background='#FDFCFA'}
                      onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <td className="px-5 py-4 text-[13px] font-bold" style={{ color:C.muted }}>#{i+1}</td>
                    <td className="px-5 py-4 text-[13px] font-semibold" style={{ color:C.charcoal }}>{s.vendorName}</td>
                    <td className="px-5 py-4 text-[13px] text-right" style={{ color:C.muted }}>{s.invoiceCount}</td>
                    <td className="px-5 py-4 text-[13px] font-bold text-right" style={{ color:C.charcoal, fontFamily:"'IBM Plex Sans',sans-serif" }}>₹{s.totalSpend?.toLocaleString('en-IN')}</td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="h-1.5 rounded-full bg-[#EEECE8] w-20 overflow-hidden">
                          <div className="h-full rounded-full" style={{ width:`${share}%`, background:C.gold }} />
                        </div>
                        <span className="text-[12px] font-semibold" style={{ color:C.muted }}>{share}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
