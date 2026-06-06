const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  street: String,
  city: String,
  state: String,
  country: String,
  postalCode: String,
});

const purchaseOrderSchema = new mongoose.Schema(
  {
    poNumber: { type: String, unique: true },
    rfqId: { type: mongoose.Schema.Types.ObjectId, ref: 'RFQ' },
    quotationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quotation' },
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
    lineItems: [
      {
        itemName: String,
        description: String,
        quantity: Number,
        unitPrice: Number,
        totalPrice: Number,
        receivedQuantity: { type: Number, default: 0 },
      },
    ],
    deliveryAddress: addressSchema,
    billingAddress: addressSchema,
    expectedDelivery: Date,
    specialInstructions: String,
    termsAndConditions: String,
    subtotal: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    taxRate: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['draft', 'confirmed', 'sent', 'acknowledged', 'partially_delivered', 'completed', 'cancelled'],
      default: 'draft',
    },
    acknowledgedAt: Date,
    sentAt: Date,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

purchaseOrderSchema.index({ vendorId: 1 });
purchaseOrderSchema.index({ status: 1 });

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);
