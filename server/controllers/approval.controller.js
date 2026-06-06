const Approval = require('../models/Approval');
const Quotation = require('../models/Quotation');
const Invoice = require('../models/Invoice');
const { AppError } = require('../middleware/errorHandler');
const { logActivity } = require('../utils/activityLogger');
const { createNotification } = require('../utils/notificationService');

// GET /api/approvals
const getApprovals = async (req, res, next) => {
  try {
    const { decision = 'pending', page = 1, limit = 20 } = req.query;
    const query = { assignedTo: req.user.userId };
    if (decision) query.decision = decision;

    const total = await Approval.countDocuments(query);
    const approvals = await Approval.find(query)
      .populate('requestedBy', 'name email')
      .populate('assignedTo', 'name email')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    res.json({ success: true, total, page: Number(page), data: approvals });
  } catch (err) {
    next(err);
  }
};

// GET /api/approvals/:id
const getApprovalById = async (req, res, next) => {
  try {
    const approval = await Approval.findById(req.params.id).populate('requestedBy', 'name email');
    if (!approval) return next(new AppError('Approval not found', 404, 'RESOURCE_NOT_FOUND'));
    res.json({ success: true, data: approval });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/approvals/:id/approve
const approveRecord = async (req, res, next) => {
  try {
    const approval = await Approval.findById(req.params.id);
    if (!approval) return next(new AppError('Approval not found', 404, 'RESOURCE_NOT_FOUND'));
    if (approval.decision !== 'pending') return next(new AppError('Already decided', 400, 'VALIDATION_ERROR'));

    approval.decision = 'approved';
    approval.remarks = req.body.remarks;
    approval.decidedAt = new Date();
    await approval.save();

    // Update referenced record status
    if (approval.referenceType === 'quotation') {
      await Quotation.findByIdAndUpdate(approval.referenceId, { status: 'approved' });
    } else if (approval.referenceType === 'invoice') {
      await Invoice.findByIdAndUpdate(approval.referenceId, { status: 'approved', approvalId: approval._id });
    }

    // Notify requester
    await createNotification({
      userId: approval.requestedBy,
      type: 'approval',
      title: 'Approved',
      message: `Your ${approval.referenceType} has been approved`,
      referenceId: approval.referenceId,
      referenceType: approval.referenceType,
    });

    await logActivity({
      userId: req.user.userId,
      action: 'approved',
      recordType: 'approval',
      recordId: approval._id,
      details: `${approval.referenceType} approved`,
      ipAddress: req.ip,
    });

    res.json({ success: true, data: approval });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/approvals/:id/reject
const rejectRecord = async (req, res, next) => {
  try {
    const { remarks } = req.body;
    if (!remarks) return next(new AppError('Rejection remarks are required', 400, 'VALIDATION_ERROR'));

    const approval = await Approval.findById(req.params.id);
    if (!approval) return next(new AppError('Approval not found', 404, 'RESOURCE_NOT_FOUND'));

    approval.decision = 'rejected';
    approval.remarks = remarks;
    approval.decidedAt = new Date();
    await approval.save();

    if (approval.referenceType === 'quotation') {
      await Quotation.findByIdAndUpdate(approval.referenceId, { status: 'rejected', rejectionReason: remarks });
    } else if (approval.referenceType === 'invoice') {
      await Invoice.findByIdAndUpdate(approval.referenceId, { status: 'rejected', rejectionReason: remarks });
    }

    await createNotification({
      userId: approval.requestedBy,
      type: 'approval',
      title: 'Rejected',
      message: `Your ${approval.referenceType} was rejected: ${remarks}`,
      referenceId: approval.referenceId,
      referenceType: approval.referenceType,
    });

    await logActivity({
      userId: req.user.userId,
      action: 'rejected',
      recordType: 'approval',
      recordId: approval._id,
      details: `${approval.referenceType} rejected: ${remarks}`,
      ipAddress: req.ip,
    });

    res.json({ success: true, data: approval });
  } catch (err) {
    next(err);
  }
};

module.exports = { getApprovals, getApprovalById, approveRecord, rejectRecord };
