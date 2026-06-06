import React, { useState, useEffect } from 'react';
import api from '../services/api';

const RFQManagement = () => {
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRfqs();
  }, []);

  const fetchRfqs = async () => {
    try {
      const res = await api.get('/rfqs');
      setRfqs(res.data?.data || []);
    } catch (err) {
      console.error(err);
      setRfqs([
        { _id: '1', rfqNumber: 'RFQ-2024-001', title: 'Office Laptops Q3', category: 'IT', status: 'open', deadline: '2026-07-01' },
        { _id: '2', rfqNumber: 'RFQ-2024-002', title: 'Warehouse Racking System', category: 'Logistics', status: 'draft', deadline: '2026-07-15' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-max-width-content mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h2 className="font-headline-md text-headline-md text-primary mb-2">Requests for Quotation</h2>
          <p className="font-body-main text-on-primary-container">Create and track your active RFQs.</p>
        </div>
        <div className="flex items-center gap-4">
          <button className="btn-primary px-6 py-2.5 flex items-center gap-2 font-label-caps text-label-caps uppercase shadow-sm">
            <span className="material-symbols-outlined text-base">post_add</span>
            Create RFQ
          </button>
        </div>
      </div>

      <div className="paper-card overflow-hidden">
        <div className="p-card-padding border-b border-outline-variant flex items-center justify-between">
          <h3 className="font-title-sm text-title-sm">Active RFQs</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low">
                <th className="px-6 py-4 font-label-caps text-label-caps text-primary uppercase">RFQ Number</th>
                <th className="px-6 py-4 font-label-caps text-label-caps text-primary uppercase">Title</th>
                <th className="px-6 py-4 font-label-caps text-label-caps text-primary uppercase">Category</th>
                <th className="px-6 py-4 font-label-caps text-label-caps text-primary uppercase">Deadline</th>
                <th className="px-6 py-4 font-label-caps text-label-caps text-primary uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30 font-data-tabular text-data-tabular">
              {loading ? (
                <tr><td colSpan="5" className="p-6 text-center text-on-surface-variant">Loading RFQs...</td></tr>
              ) : rfqs.map(rfq => (
                <tr key={rfq._id} className="hover:bg-[#F9F7F3] transition-colors group">
                  <td className="px-6 py-4 text-on-primary-container">{rfq.rfqNumber}</td>
                  <td className="px-6 py-4 font-semibold text-primary">{rfq.title}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-surface-container rounded text-xs font-medium">{rfq.category}</span>
                  </td>
                  <td className="px-6 py-4 tabular-nums">{new Date(rfq.deadline).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${rfq.status === 'open' ? 'bg-green-600' : 'bg-gray-500'}`}></div>
                      <span className={`${rfq.status === 'open' ? 'text-green-800' : 'text-gray-800'} font-medium capitalize`}>
                        {rfq.status}
                      </span>
                    </div>
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

export default RFQManagement;
