const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['rfq', 'quotation', 'approval', 'purchase_order', 'invoice', 'system'],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    referenceId: mongoose.Schema.Types.ObjectId,
    referenceType: String,
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
