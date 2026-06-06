import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';

/* ── design tokens ── */
const C = { ivory: '#F9F7F3', charcoal: '#1C1C1C', gold: '#C6A664', border: '#E5E1D8', muted: '#858484' };

const StatCard = ({ icon, label, value, sub, color = '#1C1C1C', bg = '#F9F7F3', link }) => (
  <Link to={link || '#'} className="rounded-2xl p-6 flex flex-col gap-3 hover:shadow-lg transition-shadow"
        style={{ background: '#fff', border: `1px solid ${C.border}` }}>
    <div className="flex items-center justify-between">
      <p className="text-[11px] font-bold uppercase tracking-[0.1em]" style={{ color: C.muted }}>{label}</p>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: bg }}>
        <span className="material-symbols-outlined text-[18px]" style={{ color }}>{icon}</span>
      </div>
    </div>
    <p className="text-[28px] font-bold leading-none" style={{ fontFamily: "'IBM Plex Sans',sans-serif", color: C.charcoal }}>
      {value}
    </p>
    {sub && <p className="text-[12px]" style={{ color: C.muted }}>{sub}</p>}
  </Link>
);

const STATUS_DOT = { approved: '#16a34a', pending: '#d97706', rejected: '#dc2626' };

export default function Dashboard() {
  const { user } = useAuth();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [rfqs,    setRfqs]    = useState([]);

  useEffect(() => {
    Promise.all([
      api.get('/reports/dashboard'),
      api.get('/rfqs?status=open&limit=5'),
    ]).then(([dash, rfqRes]) => {
      setData(dash.data?.data || {});
      setRfqs(rfqRes.data?.data || []);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const fmtMoney = (n) => n >= 1e6 ? `₹${(n/1e6).toFixed(1)}M` : n >= 1e3 ? `₹${(n/1e3).toFixed(0)}K` : `₹${n||0}`;

  return (
    <div className="max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.1em] mb-1" style={{ color: C.muted }}>
          Welcome back, {user?.name}
        </p>
        <h1 className="text-[32px] font-normal" style={{ fontFamily: "'DM Serif Display',serif", color: C.charcoal }}>
          Operational Overview
        </h1>
        <p className="text-[13px] mt-1" style={{ color: C.muted }}>
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon="request_quote" label="Active RFQs"         value={loading ? '—' : data?.activeRFQs  ?? 0} sub="Open solicitations"    color="#745b20" bg="#FFF3D6" link="/rfqs" />
        <StatCard icon="fact_check"    label="Pending Approvals"   value={loading ? '—' : data?.pendingApprovals ?? 0} sub="Awaiting review"   color="#D94F3D" bg="#FEE2E2" link="/approvals" />
        <StatCard icon="shopping_cart" label="Active POs"          value={loading ? '—' : data?.activePOs   ?? 0} sub="In progress"            color="#1d4ed8" bg="#DBEAFE" link="/pos" />
        <StatCard icon="storefront"    label="Vendors"             value={loading ? '—' : data?.totalVendors ?? 6} sub="Registered suppliers"  color="#166534" bg="#DCFCE7" link="/vendors" />
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Active RFQs mini-table */}
        <div className="col-span-12 lg:col-span-8 rounded-2xl overflow-hidden"
             style={{ background: '#fff', border: `1px solid ${C.border}` }}>
          <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${C.border}` }}>
            <h3 className="text-[15px] font-semibold" style={{ color: C.charcoal }}>Active Solicitations</h3>
            <Link to="/rfqs" className="text-[12px] font-bold hover:underline" style={{ color: '#745b20' }}>View All →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr style={{ background: '#FAFAF8', borderBottom: `1px solid ${C.border}` }}>
                  {['RFQ ID', 'Title', 'Category', 'Deadline', 'Priority'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-[0.07em]"
                        style={{ color: C.muted }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && [1,2,3].map(i => (
                  <tr key={i} style={{ borderBottom: `1px solid #F0EDE8` }}>
                    {[1,2,3,4,5].map(j => (
                      <td key={j} className="px-5 py-3.5">
                        <div className="h-3.5 rounded animate-pulse" style={{ background: '#F0EDE8', width: '70%' }} />
                      </td>
                    ))}
                  </tr>
                ))}
                {!loading && rfqs.length === 0 && (
                  <tr><td colSpan={5} className="px-5 py-10 text-center text-[13px]" style={{ color: C.muted }}>No active RFQs</td></tr>
                )}
                {!loading && rfqs.map((r) => {
                  const days = Math.ceil((new Date(r.deadline) - new Date()) / 86400000);
                  const prioStyle = { high: '#B91C1C', medium: '#92400E', low: '#166534' };
                  const prioBg   = { high: '#FEE2E2', medium: '#FEF3C7', low: '#DCFCE7' };
                  return (
                    <tr key={r._id} style={{ borderBottom: `1px solid #F0EDE8` }}
                        onMouseEnter={e => e.currentTarget.style.background='#FDFCFA'}
                        onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                      <td className="px-5 py-3.5 text-[12px] font-semibold" style={{ color: C.muted, fontFamily: "'IBM Plex Sans',sans-serif" }}>#{r.rfqNumber}</td>
                      <td className="px-5 py-3.5 text-[13px] font-semibold" style={{ color: C.charcoal }}>{r.title}</td>
                      <td className="px-5 py-3.5 text-[12px]" style={{ color: C.muted }}>{r.category || '—'}</td>
                      <td className="px-5 py-3.5 text-[12px]" style={{ color: days <= 5 ? '#D94F3D' : C.charcoal, fontFamily: "'IBM Plex Sans',sans-serif" }}>
                        {new Date(r.deadline).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-[10px] font-bold uppercase rounded px-2 py-0.5"
                              style={{ background: prioBg[r.priority], color: prioStyle[r.priority] }}>{r.priority}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="col-span-12 lg:col-span-4 rounded-2xl"
             style={{ background: '#fff', border: `1px solid ${C.border}` }}>
          <div className="px-6 py-4" style={{ borderBottom: `1px solid ${C.border}` }}>
            <h3 className="text-[15px] font-semibold" style={{ color: C.charcoal }}>Recent Activity</h3>
          </div>
          <div className="px-4 py-3 divide-y" style={{ '--tw-divide-opacity': 1, borderColor: '#F0EDE8' }}>
            {loading && [1,2,3,4].map(i => (
              <div key={i} className="flex gap-3 py-3">
                <div className="w-8 h-8 rounded-full animate-pulse shrink-0" style={{ background: '#F0EDE8' }} />
                <div className="flex-1 space-y-2">
                  <div className="h-3 rounded animate-pulse" style={{ background: '#F0EDE8', width: '80%' }} />
                  <div className="h-3 rounded animate-pulse" style={{ background: '#F0EDE8', width: '50%' }} />
                </div>
              </div>
            ))}
            {!loading && [...(data?.recentPOs||[]).slice(0,2), ...(data?.recentInvoices||[]).slice(0,2)].map((item, i) => (
              <div key={i} className="flex gap-3 py-3 items-start">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                     style={{ background: item.poNumber ? '#DBEAFE' : '#FFF3D6' }}>
                  <span className="material-symbols-outlined text-[15px]"
                        style={{ color: item.poNumber ? '#1d4ed8' : '#745b20' }}>
                    {item.poNumber ? 'assignment_turned_in' : 'receipt_long'}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-[12.5px] font-semibold truncate" style={{ color: C.charcoal }}>
                    {item.poNumber ? `PO ${item.poNumber}` : `Invoice ${item.invoiceNumber}`}
                  </p>
                  <p className="text-[11px]" style={{ color: C.muted }}>
                    {item.vendorId?.companyName || '—'}
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-wide mt-0.5" style={{ color: '#C4C7C7' }}>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
            {!loading && (data?.recentPOs?.length === 0 && data?.recentInvoices?.length === 0) && (
              <p className="py-8 text-center text-[12px]" style={{ color: C.muted }}>No recent activity</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Create RFQ',        icon: 'add_circle',        to: '/rfqs',        bg: '#C6A664', fg: '#1C1C1C' },
          { label: 'Review Approvals',  icon: 'fact_check',        to: '/approvals',   bg: '#1C1C1C', fg: '#fff'    },
          { label: 'Compare Quotes',    icon: 'compare_arrows',    to: '/quotations',  bg: '#fff',    fg: '#1C1C1C' },
          { label: 'View Reports',      icon: 'bar_chart',         to: '/reports',     bg: '#fff',    fg: '#1C1C1C' },
        ].map((a) => (
          <Link key={a.label} to={a.to}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-bold transition-all hover:opacity-90 active:scale-95"
                style={{ background: a.bg, color: a.fg, border: a.bg === '#fff' ? `1px solid ${C.border}` : 'none' }}>
            <span className="material-symbols-outlined text-[18px]">{a.icon}</span>
            {a.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
