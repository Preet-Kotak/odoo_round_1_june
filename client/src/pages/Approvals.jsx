import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Approvals = () => {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApprovals();
  }, []);

  const fetchApprovals = async () => {
    try {
      const res = await api.get('/approvals');
      setApprovals(res.data?.data || []);
    } catch (err) {
      console.error(err);
      setApprovals([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-max-width-content mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h2 className="font-headline-md text-headline-md text-primary mb-2">Approval Workflow</h2>
          <p className="font-body-main text-on-primary-container">Review and approve pending requests.</p>
        </div>
      </div>

      <div className="paper-card overflow-hidden">
        <div className="p-card-padding border-b border-outline-variant flex items-center justify-between">
          <h3 className="font-title-sm text-title-sm">Pending Approvals</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low">
                <th className="px-6 py-4 font-label-caps text-label-caps text-primary uppercase">Type</th>
                <th className="px-6 py-4 font-label-caps text-label-caps text-primary uppercase">Requested By</th>
                <th className="px-6 py-4 font-label-caps text-label-caps text-primary uppercase">Date</th>
                <th className="px-6 py-4 font-label-caps text-label-caps text-primary uppercase">Status</th>
                <th className="px-6 py-4 font-label-caps text-label-caps text-primary uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30 font-data-tabular text-data-tabular">
              {loading ? (
                <tr><td colSpan="5" className="p-6 text-center text-on-surface-variant">Loading approvals...</td></tr>
              ) : approvals.map(approval => (
                <tr key={approval._id} className="hover:bg-[#F9F7F3] transition-colors group">
                  <td className="px-6 py-4 capitalize font-semibold text-primary">{approval.referenceType.replace('_', ' ')}</td>
                  <td className="px-6 py-4">{approval.requestedByName || 'System'}</td>
                  <td className="px-6 py-4 tabular-nums">{new Date(approval.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${approval.decision === 'pending' ? 'bg-yellow-500' : 'bg-green-600'}`}></div>
                      <span className={`${approval.decision === 'pending' ? 'text-yellow-800' : 'text-green-800'} font-medium capitalize`}>
                        {approval.decision}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {approval.decision === 'pending' && (
                      <div className="flex gap-2 justify-end">
                        <button className="btn-primary px-3 py-1 flex items-center gap-1 text-sm shadow-sm">
                          <span className="material-symbols-outlined text-[16px]">check</span> Approve
                        </button>
                        <button className="btn-secondary px-3 py-1 flex items-center gap-1 text-sm border-error text-error hover:bg-error-container">
                          <span className="material-symbols-outlined text-[16px]">close</span> Reject
                        </button>
                      </div>
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

export default Approvals;
