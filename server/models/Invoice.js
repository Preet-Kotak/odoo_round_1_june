const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, unique: true },
    poId: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseOrder', required: true },
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
    lineItems: [
      {
        itemName: String,
        quantity: Number,
        unitPrice: Number,
        totalPrice: Number,
      },
    ],
    subtotal: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    taxRate: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 },
    dueDate: Date,
    hasDiscrepancy: { type: Boolean, default: false },
    discrepancyNote: String,
    threeWayMatch: {
      poMatched: { type: Boolean, default: false },
      goodsReceived: { type: Boolean, default: false },
      invoiceMatched: { type: Boolean, default: false },
    },
    status: {
      type: String,
      enum: ['draft', 'received', 'under_review', 'approved', 'rejected', 'paid'],
      default: 'draft',
    },
    approvalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Approval' },
    rejectionReason: String,
    emailSentAt: Date,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

invoiceSchema.index({ poId: 1 });
invoiceSchema.index({ vendorId: 1 });
invoiceSchema.index({ status: 1 });

module.exports = mongoose.model('Invoice', invoiceSchema);
