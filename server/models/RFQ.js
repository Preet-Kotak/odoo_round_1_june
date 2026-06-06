const mongoose = require('mongoose');

const lineItemSchema = new mongoose.Schema({
  itemName: { type: String, required: true },
  description: String,
  quantity: { type: Number, required: true, min: 1 },
  unitOfMeasure: String,
  estimatedPrice: Number,
});

const rfqSchema = new mongoose.Schema(
  {
    rfqNumber: { type: String, unique: true },
    title: { type: String, required: true, trim: true },
    description: String,
    category: String,
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    lineItems: [lineItemSchema],
    assignedVendors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' }],
    deadline: { type: Date, required: true },
    attachments: [
      {
        fileName: String,
        fileUrl: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    status: {
      type: String,
      enum: ['draft', 'open', 'closed', 'cancelled'],
      default: 'draft',
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

rfqSchema.index({ status: 1 });
rfqSchema.index({ deadline: 1 });
rfqSchema.index({ createdBy: 1 });
rfqSchema.index({ assignedVendors: 1 });

module.exports = mongoose.model('RFQ', rfqSchema);
