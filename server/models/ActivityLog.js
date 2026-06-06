const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userName: String,
    userRole: String,
    action: {
      type: String,
      enum: ['created', 'updated', 'deleted', 'approved', 'rejected', 'sent', 'login', 'logout', 'login_failed'],
      required: true,
    },
    recordType: {
      type: String,
      enum: ['user', 'vendor', 'rfq', 'quotation', 'purchase_order', 'invoice', 'approval'],
    },
    recordId: mongoose.Schema.Types.ObjectId,
    recordReference: String,
    details: String,
    ipAddress: String,
  },
  { timestamps: true }
);

activityLogSchema.index({ userId: 1 });
activityLogSchema.index({ recordType: 1, recordId: 1 });
activityLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
