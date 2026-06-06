import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const res = await api.get('/invoices');
      setInvoices(res.data?.data || []);
    } catch (err) {
      console.error(err);
      setInvoices([
        { _id: '1', invoiceNumber: 'INV-2024-001', vendorName: 'Acme Corp', grandTotal: 15400, status: 'pending', issueDate: '2026-06-01' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-max-width-content mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h2 className="font-headline-md text-headline-md text-primary mb-2">Invoices</h2>
          <p className="font-body-main text-on-primary-container">Manage your vendor invoices and payments.</p>
        </div>
      </div>

      <div className="paper-card overflow-hidden">
        <div className="p-card-padding border-b border-outline-variant flex items-center justify-between">
          <h3 className="font-title-sm text-title-sm">Recent Invoices</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low">
                <th className="px-6 py-4 font-label-caps text-label-caps text-primary uppercase">Invoice Number</th>
                <th className="px-6 py-4 font-label-caps text-label-caps text-primary uppercase">Vendor</th>
                <th className="px-6 py-4 font-label-caps text-label-caps text-primary uppercase">Grand Total</th>
                <th className="px-6 py-4 font-label-caps text-label-caps text-primary uppercase">Issue Date</th>
                <th className="px-6 py-4 font-label-caps text-label-caps text-primary uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30 font-data-tabular text-data-tabular">
              {loading ? (
                <tr><td colSpan="5" className="p-6 text-center text-on-surface-variant">Loading invoices...</td></tr>
              ) : invoices.map(inv => (
                <tr key={inv._id} className="hover:bg-[#F9F7F3] transition-colors group">
                  <td className="px-6 py-4 text-on-primary-container">{inv.invoiceNumber}</td>
                  <td className="px-6 py-4 font-semibold text-primary">{inv.vendorName || inv.vendorId?.companyName || 'Unknown Vendor'}</td>
                  <td className="px-6 py-4 tabular-nums font-semibold">${inv.grandTotal?.toLocaleString() || 0}</td>
                  <td className="px-6 py-4 tabular-nums">{new Date(inv.issueDate || inv.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${inv.status === 'approved' ? 'bg-green-600' : inv.status === 'rejected' ? 'bg-red-600' : 'bg-yellow-500'}`}></div>
                      <span className={`${inv.status === 'approved' ? 'text-green-800' : inv.status === 'rejected' ? 'text-red-800' : 'text-yellow-800'} font-medium capitalize`}>{inv.status}</span>
                    </div>
                  </td>
                </tr>
              ))}
              {invoices.length === 0 && !loading && (
                <tr>
                  <td colSpan="5" className="p-6 text-center text-on-surface-variant">No invoices found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Invoices;
