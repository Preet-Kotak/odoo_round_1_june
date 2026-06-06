import React, { useState, useEffect } from 'react';
import api from '../services/api';

const VendorManagement = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const res = await api.get('/vendors');
      setVendors(res.data?.data || []);
    } catch (err) {
      console.error(err);
      setVendors([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-max-width-content mx-auto animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h2 className="font-headline-md text-headline-md text-primary mb-2">Vendor Management</h2>
          <p className="font-body-main text-on-primary-container">Manage your global vendor ecosystem and contract lifecycle.</p>
        </div>
        <div className="flex items-center gap-4">
          <button className="btn-primary px-6 py-2.5 flex items-center gap-2 font-label-caps text-label-caps uppercase shadow-sm">
            <span className="material-symbols-outlined text-base">add_business</span>
            Onboard Vendor
          </button>
        </div>
      </div>

      {/* Bento Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="paper-card p-4 flex flex-col justify-between">
          <span className="font-label-caps text-label-caps text-on-primary-container mb-2 uppercase">Status Filter</span>
          <select className="bg-transparent border-none font-title-sm text-title-sm p-0 focus:ring-0 cursor-pointer">
            <option>All Statuses</option>
            <option>Active</option>
            <option>Pending</option>
          </select>
        </div>
        <div className="paper-card p-4 flex flex-col justify-between">
          <span className="font-label-caps text-label-caps text-on-primary-container mb-2 uppercase">Category</span>
          <select className="bg-transparent border-none font-title-sm text-title-sm p-0 focus:ring-0 cursor-pointer">
            <option>All Categories</option>
            <option>Logistics</option>
            <option>IT Services</option>
            <option>Raw Materials</option>
          </select>
        </div>
        <div className="paper-card p-4 flex flex-col justify-between">
          <span className="font-label-caps text-label-caps text-on-primary-container mb-2 uppercase">Total Spend Range</span>
          <div className="flex items-center gap-2 font-title-sm text-title-sm">
            <span>₹0</span>
            <input className="w-full accent-secondary" type="range" />
            <span>₹1M+</span>
          </div>
        </div>
        <div className="paper-card p-4 bg-primary text-on-primary flex flex-col justify-center">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-label-caps text-label-caps text-on-primary-container uppercase">Global Vendors</span>
              <div className="font-headline-md text-headline-md mt-1">{vendors.length || 1284}</div>
            </div>
            <span className="material-symbols-outlined text-3xl text-secondary">public</span>
          </div>
        </div>
      </div>

      {/* High-Density Data Table Section */}
      <div className="paper-card overflow-hidden">
        <div className="p-card-padding border-b border-outline-variant flex items-center justify-between">
          <h3 className="font-title-sm text-title-sm">Active Vendor List</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low">
                <th className="px-6 py-4 font-label-caps text-label-caps text-primary uppercase">Vendor ID</th>
                <th className="px-6 py-4 font-label-caps text-label-caps text-primary uppercase">Company Name</th>
                <th className="px-6 py-4 font-label-caps text-label-caps text-primary uppercase">Category</th>
                <th className="px-6 py-4 font-label-caps text-label-caps text-primary uppercase">Status</th>
                <th className="px-6 py-4 font-label-caps text-label-caps text-primary uppercase"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30 font-data-tabular text-data-tabular">
              {loading ? (
                <tr><td colSpan="5" className="p-6 text-center text-on-surface-variant">Loading vendors...</td></tr>
              ) : vendors.map(v => (
                <tr key={v._id || v.vendorId} className="hover:bg-[#F9F7F3] transition-colors group">
                  <td className="px-6 py-4 text-on-primary-container">{v.vendorId}</td>
                  <td className="px-6 py-4 font-semibold text-primary">{v.companyName}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-surface-container rounded text-xs font-medium">{v.category}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${v.status === 'active' ? 'bg-green-600' : 'bg-yellow-500'}`}></div>
                      <span className={`${v.status === 'active' ? 'text-green-800' : 'text-yellow-800'} font-medium capitalize`}>
                        {v.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white rounded transition-all">
                      <span className="material-symbols-outlined">more_vert</span>
                    </button>
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

export default VendorManagement;
