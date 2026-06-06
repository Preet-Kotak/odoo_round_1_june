import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';

const CreateRFQModal = ({ show, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'medium',
    deadline: '',
    assignedVendors: [],
    lineItems: [{ itemName: '', description: '', quantity: 1, unitOfMeasure: '', estimatedPrice: 0 }]
  });
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (show) {
      // Check authentication before fetching vendors
      const token = localStorage.getItem('token');
      if (!token) {
        setError('You are not logged in. Please log in and try again.');
        return;
      }
      fetchVendors();
    }
  }, [show]);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const res = await api.get('/vendors');
      setVendors(res.data?.data || []);
    } catch (err) {
      console.error('Error fetching vendors:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleVendorToggle = (vendorId) => {
    setFormData(prev => ({
      ...prev,
      assignedVendors: prev.assignedVendors.includes(vendorId)
        ? prev.assignedVendors.filter(id => id !== vendorId)
        : [...prev.assignedVendors, vendorId]
    }));
  };

  const handleLineItemChange = (index, field, value) => {
    const updatedItems = [...formData.lineItems];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    };
    setFormData(prev => ({ ...prev, lineItems: updatedItems }));
  };

  const addLineItem = () => {
    setFormData(prev => ({
      ...prev,
      lineItems: [...prev.lineItems, { itemName: '', description: '', quantity: 1, unitOfMeasure: '', estimatedPrice: 0 }]
    }));
  };

  const removeLineItem = (index) => {
    if (formData.lineItems.length > 1) {
      setFormData(prev => ({
        ...prev,
        lineItems: prev.lineItems.filter((_, i) => i !== index)
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Check authentication first
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Authentication required. Please log in and try again.');
      return;
    }

    // Validation
    if (!formData.title.trim()) {
      setError('RFQ title is required');
      return;
    }
    if (!formData.deadline) {
      setError('Deadline is required');
      return;
    }
    if (formData.assignedVendors.length === 0) {
      setError('Please select at least one vendor');
      return;
    }
    if (formData.lineItems.some(item => !item.itemName.trim())) {
      setError('All line items must have a name');
      return;
    }

    try {
      setSubmitting(true);
      
      // Prepare data matching backend schema exactly
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category.trim(),
        priority: formData.priority,
        deadline: formData.deadline,
        assignedVendors: formData.assignedVendors,
        lineItems: formData.lineItems.map(item => ({
          itemName: item.itemName.trim(),
          description: item.description ? item.description.trim() : '',
          quantity: parseInt(item.quantity) || 1,
          unitOfMeasure: item.unitOfMeasure ? item.unitOfMeasure.trim() : '',
          estimatedPrice: parseFloat(item.estimatedPrice) || 0
        })),
        status: 'draft' // Explicitly set status
      };

      console.log('Auth Token:', token ? 'Present' : 'Missing');
      console.log('Submitting RFQ payload:', payload);
      
      const res = await api.post('/rfqs', payload);
      console.log('RFQ created successfully:', res.data);
      
      // Success - close modal and refresh
      if (onSuccess) {
        onSuccess(res.data?.data);
      }
      onClose();
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        category: '',
        priority: 'medium',
        deadline: '',
        assignedVendors: [],
        lineItems: [{ itemName: '', description: '', quantity: 1, unitOfMeasure: '', estimatedPrice: 0 }]
      });
    } catch (err) {
      console.error('Error creating RFQ:', err);
      console.error('Error response:', err.response?.data);
      
      // Handle specific error cases
      if (err.response?.status === 401) {
        setError('Authentication failed. Your session may have expired. Please log in again.');
        // Optionally redirect to login after a delay
        setTimeout(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }, 2000);
      } else if (err.response?.status === 403) {
        setError('Permission denied. Only Procurement Officers can create RFQs. Please contact your administrator.');
      } else {
        setError(err.response?.data?.message || err.response?.data?.error?.message || 'Failed to create RFQ. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!show) return null;

  // Check if user has permission (for better UX feedback)
  const hasPermission = user && (user.role === 'procurement_officer' || user.role === 'admin');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <div className="bg-surface rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-surface border-b border-outline-variant p-6 flex justify-between items-center z-10">
          <div>
            <h3 className="font-headline-md text-headline-md text-primary">Create New RFQ</h3>
            <p className="text-sm text-on-surface-variant mt-1">Request for Quotation - Vendor Solicitation</p>
          </div>
          <button 
            onClick={onClose}
            className="text-on-surface-variant hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Permission Warning */}
        {!hasPermission && (
          <div className="p-6 pb-0">
            <div className="p-4 bg-error-container/10 border border-error rounded-lg flex items-start gap-3">
              <span className="material-symbols-outlined text-error">warning</span>
              <div className="flex-1">
                <p className="font-bold text-error mb-1">Permission Required</p>
                <p className="text-sm text-on-surface-variant">
                  Your current role ({user?.role || 'unknown'}) does not have permission to create RFQs. 
                  Only <strong>Procurement Officers</strong> and <strong>Administrators</strong> can create RFQs.
                  Please contact your system administrator if you need access.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-error-container text-error rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <h4 className="font-title-sm text-title-sm text-primary">Basic Information</h4>
            
            <div>
              <label className="block font-label-caps text-label-caps text-on-surface-variant mb-2">
                RFQ TITLE *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-outline-variant rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
                placeholder="e.g., Office Equipment Procurement Q1 2024"
                required
              />
            </div>

            <div>
              <label className="block font-label-caps text-label-caps text-on-surface-variant mb-2">
                DESCRIPTION
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                className="w-full px-4 py-2 border border-outline-variant rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
                placeholder="Provide detailed requirements and specifications..."
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block font-label-caps text-label-caps text-on-surface-variant mb-2">
                  CATEGORY
                </label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-outline-variant rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
                  placeholder="e.g., IT Services"
                />
              </div>

              <div>
                <label className="block font-label-caps text-label-caps text-on-surface-variant mb-2">
                  PRIORITY *
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-outline-variant rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div>
                <label className="block font-label-caps text-label-caps text-on-surface-variant mb-2">
                  DEADLINE *
                </label>
                <input
                  type="date"
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-outline-variant rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
                  required
                />
              </div>
            </div>
          </div>

          {/* Vendor Selection */}
          <div className="space-y-4">
            <h4 className="font-title-sm text-title-sm text-primary">Assign Vendors *</h4>
            
            {loading ? (
              <p className="text-sm text-on-surface-variant">Loading vendors...</p>
            ) : vendors.length === 0 ? (
              <p className="text-sm text-error">No vendors available. Please add vendors first.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto p-2 border border-outline-variant rounded-lg">
                {vendors.map(vendor => (
                  <label
                    key={vendor._id}
                    className="flex items-center gap-3 p-3 bg-surface-container-low hover:bg-surface-container rounded-lg cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={formData.assignedVendors.includes(vendor._id)}
                      onChange={() => handleVendorToggle(vendor._id)}
                      className="w-4 h-4 text-secondary focus:ring-secondary"
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-primary">{vendor.companyName}</p>
                      <p className="text-xs text-on-surface-variant">{vendor.email}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
            <p className="text-xs text-on-surface-variant">
              Selected: {formData.assignedVendors.length} vendor(s)
            </p>
          </div>

          {/* Line Items */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-title-sm text-title-sm text-primary">Line Items</h4>
              <button
                type="button"
                onClick={addLineItem}
                className="text-sm font-bold text-secondary hover:text-secondary/80 flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                Add Item
              </button>
            </div>

            <div className="space-y-4">
              {formData.lineItems.map((item, index) => (
                <div key={index} className="p-4 bg-surface-container-low rounded-lg space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-label-caps text-label-caps text-on-surface-variant">
                      ITEM {index + 1}
                    </span>
                    {formData.lineItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLineItem(index)}
                        className="text-error hover:text-error/80"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={item.itemName}
                      onChange={(e) => handleLineItemChange(index, 'itemName', e.target.value)}
                      placeholder="Item Name *"
                      className="px-3 py-2 border border-outline-variant rounded-lg text-sm focus:ring-2 focus:ring-secondary"
                      required
                    />
                    <input
                      type="text"
                      value={item.unitOfMeasure}
                      onChange={(e) => handleLineItemChange(index, 'unitOfMeasure', e.target.value)}
                      placeholder="Unit (e.g., pcs, kg)"
                      className="px-3 py-2 border border-outline-variant rounded-lg text-sm focus:ring-2 focus:ring-secondary"
                    />
                  </div>

                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
                    placeholder="Description / Specifications"
                    className="w-full px-3 py-2 border border-outline-variant rounded-lg text-sm focus:ring-2 focus:ring-secondary"
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleLineItemChange(index, 'quantity', e.target.value)}
                      min="1"
                      placeholder="Quantity"
                      className="px-3 py-2 border border-outline-variant rounded-lg text-sm focus:ring-2 focus:ring-secondary"
                    />
                    <input
                      type="number"
                      value={item.estimatedPrice}
                      onChange={(e) => handleLineItemChange(index, 'estimatedPrice', e.target.value)}
                      min="0"
                      step="0.01"
                      placeholder="Est. Unit Price (₹)"
                      className="px-3 py-2 border border-outline-variant rounded-lg text-sm focus:ring-2 focus:ring-secondary"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-4 pt-4 border-t border-outline-variant">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-6 py-2.5 border border-outline-variant text-primary font-bold rounded-lg hover:bg-surface-container transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-8 py-2.5 btn-gold shadow-lg disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                  Creating...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">send</span>
                  Create RFQ
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRFQModal;
