const mongoose = require('mongoose');

const quotationSchema = new mongoose.Schema(
  {
    rfqId: { type: mongoose.Schema.Types.ObjectId, ref: 'RFQ', required: true },
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
    lineItems: [
      {
        rfqLineItemId: mongoose.Schema.Types.ObjectId,
        itemName: String,
        quantity: Number,
        unitPrice: { type: Number, required: true },
        totalPrice: Number,
      },
    ],
    subtotal: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    taxRate: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 },
    paymentTerms: String,
    deliveryTimeline: Date,
    validityPeriod: Number,
    notes: String,
    attachments: [{ fileName: String, fileUrl: String }],
    status: {
      type: String,
      enum: ['draft', 'submitted', 'under_review', 'selected', 'approved', 'rejected'],
      default: 'draft',
    },
    evaluationNotes: String,
    rejectionReason: String,
    submittedAt: Date,
  },
  { timestamps: true }
);

quotationSchema.index({ rfqId: 1, vendorId: 1 }, { unique: true });
quotationSchema.index({ status: 1 });

module.exports = mongoose.model('Quotation', quotationSchema);
