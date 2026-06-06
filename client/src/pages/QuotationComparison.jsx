import React, { useState, useEffect } from 'react';
import api from '../services/api';

const QuotationComparison = () => {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuotations();
  }, []);

  const fetchQuotations = async () => {
    try {
      const res = await api.get('/quotations');
      setQuotations(res.data?.data || []);
    } catch (err) {
      console.error(err);
      setQuotations([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-max-width-content mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h2 className="font-headline-md text-headline-md text-primary mb-2">Quotation Comparison</h2>
          <p className="font-body-main text-on-primary-container">Compare vendor responses and select the best offer.</p>
        </div>
      </div>

      <div className="paper-card overflow-hidden">
        <div className="p-card-padding border-b border-outline-variant flex items-center justify-between">
          <h3 className="font-title-sm text-title-sm">All Quotations</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low">
                <th className="px-6 py-4 font-label-caps text-label-caps text-primary uppercase">Vendor</th>
                <th className="px-6 py-4 font-label-caps text-label-caps text-primary uppercase">Grand Total</th>
                <th className="px-6 py-4 font-label-caps text-label-caps text-primary uppercase">Validity (Days)</th>
                <th className="px-6 py-4 font-label-caps text-label-caps text-primary uppercase">Status</th>
                <th className="px-6 py-4 font-label-caps text-label-caps text-primary uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30 font-data-tabular text-data-tabular">
              {loading ? (
                <tr><td colSpan="5" className="p-6 text-center text-on-surface-variant">Loading quotations...</td></tr>
              ) : quotations.map(q => (
                <tr key={q._id} className="hover:bg-[#F9F7F3] transition-colors group">
                  <td className="px-6 py-4 font-semibold text-primary">{q.vendorName || 'Unknown Vendor'}</td>
                  <td className="px-6 py-4 tabular-nums font-semibold">₹{q.grandTotal.toLocaleString()}</td>
                  <td className="px-6 py-4 tabular-nums">{q.validityPeriod}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${q.status === 'selected' ? 'bg-green-600' : 'bg-yellow-500'}`}></div>
                      <span className={`${q.status === 'selected' ? 'text-green-800' : 'text-yellow-800'} font-medium capitalize`}>
                        {q.status.replace('_', ' ')}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {q.status !== 'selected' && (
                      <button className="btn-secondary px-3 py-1 text-sm">Select</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default QuotationComparison;
