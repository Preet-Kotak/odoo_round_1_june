import React, { useState, useEffect } from 'react';
import api from '../services/api';

const PurchaseOrders = () => {
  const [pos, setPos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPos();
  }, []);

  const fetchPos = async () => {
    try {
      const res = await api.get('/purchase-orders');
      setPos(res.data?.data || []);
    } catch (err) {
      console.error(err);
      setPos([
        { _id: '1', poNumber: 'PO-2024-001', vendorName: 'Acme Corp', grandTotal: 15400, status: 'confirmed', expectedDelivery: '2026-08-01' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-max-width-content mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h2 className="font-headline-md text-headline-md text-primary mb-2">Purchase Orders & Invoices</h2>
          <p className="font-body-main text-on-primary-container">Manage POs and track invoice status.</p>
        </div>
      </div>

      <div className="paper-card overflow-hidden">
        <div className="p-card-padding border-b border-outline-variant flex items-center justify-between">
          <h3 className="font-title-sm text-title-sm">Active Purchase Orders</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low">
                <th className="px-6 py-4 font-label-caps text-label-caps text-primary uppercase">PO Number</th>
                <th className="px-6 py-4 font-label-caps text-label-caps text-primary uppercase">Vendor</th>
                <th className="px-6 py-4 font-label-caps text-label-caps text-primary uppercase">Grand Total</th>
                <th className="px-6 py-4 font-label-caps text-label-caps text-primary uppercase">Expected Delivery</th>
                <th className="px-6 py-4 font-label-caps text-label-caps text-primary uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30 font-data-tabular text-data-tabular">
              {loading ? (
                <tr><td colSpan="5" className="p-6 text-center text-on-surface-variant">Loading POs...</td></tr>
              ) : pos.map(po => (
                <tr key={po._id} className="hover:bg-[#F9F7F3] transition-colors group">
                  <td className="px-6 py-4 text-on-primary-container">{po.poNumber}</td>
                  <td className="px-6 py-4 font-semibold text-primary">{po.vendorName || 'Unknown Vendor'}</td>
                  <td className="px-6 py-4 tabular-nums font-semibold">${po.grandTotal.toLocaleString()}</td>
                  <td className="px-6 py-4 tabular-nums">{new Date(po.expectedDelivery).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-600"></div>
                      <span className="text-green-800 font-medium capitalize">{po.status}</span>
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

export default PurchaseOrders;
