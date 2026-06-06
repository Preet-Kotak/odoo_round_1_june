import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Reports = () => {
  const [spending, setSpending] = useState([]);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const [spendRes, trendsRes] = await Promise.all([
          api.get('/reports/spending-summary'),
          api.get('/reports/monthly-trends'),
        ]);
        setSpending(spendRes.data?.data || []);
        setTrends(trendsRes.data?.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  return (
    <div className="max-w-max-width-content mx-auto animate-in fade-in duration-500">
      <div className="mb-8">
        <h2 className="font-headline-md text-headline-md text-primary mb-2">Reports</h2>
        <p className="font-body-main text-on-primary-container">Spending summaries and procurement trends.</p>
      </div>

      {/* Monthly Trends */}
      <div className="paper-card p-card-padding mb-6">
        <h3 className="font-title-sm text-title-sm mb-6">Monthly Spend Trends</h3>
        {loading ? (
          <p className="text-on-surface-variant text-sm">Loading...</p>
        ) : trends.length === 0 ? (
          <p className="text-on-surface-variant text-sm">No trend data available.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low">
                  <th className="px-6 py-4 font-label-caps text-label-caps text-primary uppercase">Month</th>
                  <th className="px-6 py-4 font-label-caps text-label-caps text-primary uppercase">Year</th>
                  <th className="px-6 py-4 font-label-caps text-label-caps text-primary uppercase">PO Count</th>
                  <th className="px-6 py-4 font-label-caps text-label-caps text-primary uppercase">Total Spend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30 font-data-tabular text-data-tabular">
                {trends.map((t, i) => (
                  <tr key={i} className="hover:bg-[#F9F7F3] transition-colors">
                    <td className="px-6 py-4">{months[(t._id?.month || 1) - 1]}</td>
                    <td className="px-6 py-4">{t._id?.year}</td>
                    <td className="px-6 py-4">{t.poCount}</td>
                    <td className="px-6 py-4 font-semibold">₹{t.totalSpend?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Spending by Vendor */}
      <div className="paper-card p-card-padding">
        <h3 className="font-title-sm text-title-sm mb-6">Spending by Vendor</h3>
        {loading ? (
          <p className="text-on-surface-variant text-sm">Loading...</p>
        ) : spending.length === 0 ? (
          <p className="text-on-surface-variant text-sm">No spending data available.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low">
                  <th className="px-6 py-4 font-label-caps text-label-caps text-primary uppercase">Vendor</th>
                  <th className="px-6 py-4 font-label-caps text-label-caps text-primary uppercase">Invoices</th>
                  <th className="px-6 py-4 font-label-caps text-label-caps text-primary uppercase">Total Spend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30 font-data-tabular text-data-tabular">
                {spending.map((s, i) => (
                  <tr key={i} className="hover:bg-[#F9F7F3] transition-colors">
                    <td className="px-6 py-4 font-semibold text-primary">{s.vendorName}</td>
                    <td className="px-6 py-4">{s.invoiceCount}</td>
                    <td className="px-6 py-4 font-semibold">₹{s.totalSpend?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
