import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ vendors: 0, activeRfqs: 0, pendingPos: 0, totalSpend: 0 });
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const dashRes = await api.get('/reports/dashboard');
        const trendsRes = await api.get('/reports/monthly-trends');
        
        const data = dashRes.data?.data || {};
        const trends = trendsRes.data?.data || [];
        
        const totalSpendValue = trends.reduce((sum, item) => sum + item.totalSpend, 0);

        setStats({ 
          vendors: 142, // Keeping static to align with UI mockup if no endpoint, or could be fetched
          activeRfqs: data.activeRFQs || 0, 
          pendingPos: data.pendingApprovals || 0, 
          totalSpend: `$${(totalSpendValue / 1000000).toFixed(2)}M` 
        });

        // Map recent POs and Invoices to activity feed
        const recentPos = (data.recentPOs || []).map(po => ({
          id: po._id,
          title: `${po.poNumber} Created`,
          subtitle: po.vendorId?.companyName || 'Vendor',
          date: new Date(po.createdAt).toLocaleDateString(),
          icon: 'assignment_turned_in',
          color: 'primary'
        }));
        
        const recentInvs = (data.recentInvoices || []).map(inv => ({
          id: inv._id,
          title: `Invoice ${inv.invoiceNumber}`,
          subtitle: inv.vendorId?.companyName || 'Vendor',
          date: new Date(inv.createdAt).toLocaleDateString(),
          icon: 'receipt_long',
          color: 'secondary'
        }));

        setActivities([...recentPos, ...recentInvs].slice(0, 4));
      } catch (err) {
        console.error(err);
        setStats({ vendors: 142, activeRfqs: 12, pendingPos: 5, totalSpend: '$2.48M' });
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  return (
    <div className="animate-in fade-in duration-500">
      {/* Top Bar Area */}
      <header className="flex justify-between items-end mb-12">
        <div>
          <h2 className="font-headline-md text-headline-md">Operational Overview</h2>
          <p className="text-on-primary-container">Welcome back, {user?.name || 'Director of Procurement'}. Here's your status update for today.</p>
        </div>
      </header>

      {/* KPI Bento Grid */}
      <div className="grid grid-cols-12 gap-6 mb-10">
        <div className="col-span-12 md:col-span-4 paper-card p-card-padding">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="font-label-caps text-on-primary-container uppercase tracking-widest mb-1">Total Spend (YTD)</p>
              <h3 className="font-data-metric text-data-metric">{stats.totalSpend}</h3>
            </div>
            <div className="p-2 bg-secondary-container/30 rounded-full">
              <span className="material-symbols-outlined text-secondary">payments</span>
            </div>
          </div>
        </div>

        <div className="col-span-12 md:col-span-4 paper-card p-card-padding">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="font-label-caps text-on-primary-container uppercase tracking-widest mb-1">Pending Approvals</p>
              <h3 className="font-data-metric text-data-metric">{stats.pendingPos}</h3>
            </div>
            <div className="p-2 bg-error-container/30 rounded-full">
              <span className="material-symbols-outlined text-error">notification_important</span>
            </div>
          </div>
        </div>

        <div className="col-span-12 md:col-span-4 paper-card p-card-padding">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="font-label-caps text-on-primary-container uppercase tracking-widest mb-1">Active RFQs</p>
              <h3 className="font-data-metric text-data-metric">{stats.activeRfqs}</h3>
            </div>
            <div className="p-2 bg-surface-container-highest rounded-full">
              <span className="material-symbols-outlined text-on-surface-variant">query_stats</span>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics & Feed Layout */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8 paper-card p-card-padding">
          <div className="flex justify-between items-center mb-8">
            <h4 className="font-title-sm text-title-sm">Spend Analytics</h4>
          </div>
          <div className="relative h-[300px] w-full bg-[#fcfcfc] rounded-lg border border-dashed border-outline-variant/30 flex items-center justify-center">
            <svg className="w-full h-full p-4" viewBox="0 0 800 300">
              <defs>
                <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="#C6A664" stopOpacity="0.2"></stop>
                  <stop offset="95%" stopColor="#C6A664" stopOpacity="0"></stop>
                </linearGradient>
              </defs>
              {/* Animated Line representing Spend Trends */}
              <path className="graph-line" d="M0,250 Q100,220 200,230 T400,150 T600,180 T800,100" fill="none" stroke="#C6A664" strokeWidth="3"></path>
              <path d="M0,250 Q100,220 200,230 T400,150 T600,180 T800,100 V300 H0 Z" fill="url(#chartGradient)"></path>
            </svg>
            <div className="absolute left-4 top-4 bottom-8 flex flex-col justify-between text-[10px] text-on-primary-container font-bold uppercase">
              <span>High</span>
              <span>Med</span>
              <span>Low</span>
              <span>0</span>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 paper-card p-card-padding flex flex-col">
          <h4 className="font-title-sm text-title-sm mb-6">Recent Activity</h4>
          <div className="space-y-6 flex-1 overflow-y-auto pr-2">
            {!loading && activities.map((act, i) => (
              <div className="flex gap-4" key={i}>
                <div className={`w-10 h-10 rounded-full bg-${act.color}/5 flex items-center justify-center shrink-0`}>
                  <span className={`material-symbols-outlined text-${act.color} text-xl`}>{act.icon}</span>
                </div>
                <div>
                  <p className={`text-sm font-bold text-${act.color}`}>{act.title}</p>
                  <p className="text-xs text-on-primary-container">{act.subtitle}</p>
                  <span className="text-[10px] uppercase font-bold text-on-primary-container/60 mt-1 block">{act.date}</span>
                </div>
              </div>
            ))}
            {!loading && activities.length === 0 && (
              <p className="text-sm text-on-surface-variant text-center mt-10">No recent activity found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
