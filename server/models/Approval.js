const mongoose = require('mongoose');

const approvalSchema = new mongoose.Schema(
  {
    referenceId: { type: mongoose.Schema.Types.ObjectId, required: true },
    referenceType: {
      type: String,
      enum: ['quotation', 'invoice', 'purchase_order'],
      required: true,
    },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    decision: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    remarks: String,
    decidedAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Approval', approvalSchema);
