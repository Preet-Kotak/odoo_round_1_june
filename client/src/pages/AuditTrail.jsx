import React, { useState, useEffect } from 'react';
import api from '../services/api';

const AuditTrail = () => {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 50;

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const res = await api.get('/activity-logs', { params: { page, limit } });
        setLogs(res.data?.data || []);
        setTotal(res.data?.total || 0);
      } catch (err) {
        console.error(err);
        setLogs([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [page]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="max-w-max-width-content mx-auto animate-in fade-in duration-500">
      <div className="mb-8">
        <h2 className="font-headline-md text-headline-md text-primary mb-2">Audit Trail</h2>
        <p className="font-body-main text-on-primary-container">Immutable log of all system activity.</p>
      </div>

      <div className="paper-card overflow-hidden">
        <div className="p-card-padding border-b border-outline-variant flex items-center justify-between">
          <h3 className="font-title-sm text-title-sm">Activity Logs</h3>
          <span className="text-xs text-on-surface-variant">{total} total records</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low">
                <th className="px-6 py-4 font-label-caps text-label-caps text-primary uppercase">Timestamp</th>
                <th className="px-6 py-4 font-label-caps text-label-caps text-primary uppercase">User</th>
                <th className="px-6 py-4 font-label-caps text-label-caps text-primary uppercase">Role</th>
                <th className="px-6 py-4 font-label-caps text-label-caps text-primary uppercase">Action</th>
                <th className="px-6 py-4 font-label-caps text-label-caps text-primary uppercase">Record Type</th>
                <th className="px-6 py-4 font-label-caps text-label-caps text-primary uppercase">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30 font-data-tabular text-data-tabular">
              {loading ? (
                <tr><td colSpan="6" className="p-6 text-center text-on-surface-variant">Loading logs...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan="6" className="p-6 text-center text-on-surface-variant">No activity logs found.</td></tr>
              ) : logs.map(log => (
                <tr key={log._id} className="hover:bg-[#F9F7F3] transition-colors">
                  <td className="px-6 py-4 tabular-nums text-xs">{new Date(log.createdAt).toLocaleString()}</td>
                  <td className="px-6 py-4 font-semibold text-primary">{log.userName || '—'}</td>
                  <td className="px-6 py-4 capitalize text-xs">
                    <span className="px-2 py-1 bg-surface-container rounded">{log.userRole?.replace('_', ' ') || '—'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      log.action?.includes('fail') ? 'bg-error-container text-error' :
                      log.action === 'login' ? 'bg-green-100 text-green-800' :
                      log.action === 'logout' ? 'bg-gray-100 text-gray-700' :
                      'bg-secondary-container text-on-secondary-container'
                    }`}>{log.action}</span>
                  </td>
                  <td className="px-6 py-4 capitalize">{log.recordType || '—'}</td>
                  <td className="px-6 py-4 text-on-surface-variant text-xs max-w-[200px] truncate">{log.details || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-outline-variant flex items-center justify-between">
            <span className="text-xs text-on-surface-variant">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-sm border border-outline-variant rounded disabled:opacity-40 hover:bg-surface-container transition-colors"
              >Previous</button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 text-sm border border-outline-variant rounded disabled:opacity-40 hover:bg-surface-container transition-colors"
              >Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditTrail;
