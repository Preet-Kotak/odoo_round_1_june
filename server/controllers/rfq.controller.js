const RFQ = require('../models/RFQ');
const Vendor = require('../models/Vendor');
const { AppError } = require('../middleware/errorHandler');
const { generateRFQNumber } = require('../utils/counterService');
const { logActivity } = require('../utils/activityLogger');
const { createNotification } = require('../utils/notificationService');
const { sendEmail } = require('../utils/emailService');
const rfqInvitationTemplate = require('../utils/emailTemplates/rfqInvitation');

// GET /api/rfqs
const getRFQs = async (req, res, next) => {
  try {
    const { search, status, page = 1, limit = 20 } = req.query;
    const query = {};

    if (search) query.$or = [{ title: { $regex: search, $options: 'i' } }, { rfqNumber: { $regex: search, $options: 'i' } }];
    if (status) query.status = status;

    const total = await RFQ.countDocuments(query);
    const rfqs = await RFQ.find(query)
      .populate('assignedVendors', 'companyName email')
      .populate('createdBy', 'name email')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    // Add quotation count for each RFQ
    const Quotation = require('../models/Quotation');
    const rfqsWithCounts = await Promise.all(
      rfqs.map(async (rfq) => {
        const quotationCount = await Quotation.countDocuments({ 
          rfqId: rfq._id, 
          status: { $in: ['submitted', 'under_review', 'selected', 'approved'] }
        });
        return {
          ...rfq.toObject(),
          quotationCount
        };
      })
    );

    res.json({ success: true, total, page: Number(page), data: rfqsWithCounts });
  } catch (err) {
    next(err);
  }
};

// POST /api/rfqs
const createRFQ = async (req, res, next) => {
  try {
    const rfqNumber = await generateRFQNumber();
    const rfq = await RFQ.create({ ...req.body, rfqNumber, createdBy: req.user.userId });

    await logActivity({
      userId: req.user.userId,
      userName: req.user.email,
      userRole: req.user.role,
      action: 'created',
      recordType: 'rfq',
      recordId: rfq._id,
      recordReference: rfq.rfqNumber,
      details: `RFQ ${rfq.rfqNumber} created: ${rfq.title}`,
      ipAddress: req.ip,
    });

    res.status(201).json({ success: true, data: rfq });
  } catch (err) {
    next(err);
  }
};

// GET /api/rfqs/:id
const getRFQById = async (req, res, next) => {
  try {
    const rfq = await RFQ.findById(req.params.id)
      .populate('assignedVendors', 'companyName email contactPerson')
      .populate('createdBy', 'name email');
    if (!rfq) return next(new AppError('RFQ not found', 404, 'RESOURCE_NOT_FOUND'));
    res.json({ success: true, data: rfq });
  } catch (err) {
    next(err);
  }
};

// PUT /api/rfqs/:id
const updateRFQ = async (req, res, next) => {
  try {
    const rfq = await RFQ.findById(req.params.id);
    if (!rfq) return next(new AppError('RFQ not found', 404, 'RESOURCE_NOT_FOUND'));
    if (rfq.status !== 'draft') return next(new AppError('Only draft RFQs can be edited', 400, 'VALIDATION_ERROR'));

    Object.assign(rfq, req.body);
    await rfq.save();

    await logActivity({
      userId: req.user.userId,
      userName: req.user.email,
      userRole: req.user.role,
      action: 'updated',
      recordType: 'rfq',
      recordId: rfq._id,
      recordReference: rfq.rfqNumber,
      details: `RFQ ${rfq.rfqNumber} updated`,
      ipAddress: req.ip,
    });

    res.json({ success: true, data: rfq });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/rfqs/:id/send
const sendRFQ = async (req, res, next) => {
  try {
    const rfq = await RFQ.findById(req.params.id).populate('assignedVendors', 'companyName email');
    if (!rfq) return next(new AppError('RFQ not found', 404, 'RESOURCE_NOT_FOUND'));
    if (!['draft'].includes(rfq.status)) return next(new AppError('RFQ cannot be sent in current status', 400, 'VALIDATION_ERROR'));
    if (!rfq.assignedVendors.length) return next(new AppError('Assign at least one vendor before sending', 400, 'VALIDATION_ERROR'));

    rfq.status = 'open';
    await rfq.save();

    // Send email + notification to each vendor
    for (const vendor of rfq.assignedVendors) {
      await sendEmail(
        vendor.email,
        `RFQ Invitation: ${rfq.rfqNumber} — ${rfq.title}`,
        rfqInvitationTemplate({
          vendorName: vendor.companyName,
          rfqNumber: rfq.rfqNumber,
          rfqTitle: rfq.title,
          deadline: rfq.deadline,
          clientUrl: process.env.CLIENT_URL,
        })
      );
    }

    await logActivity({
      userId: req.user.userId,
      userName: req.user.email,
      userRole: req.user.role,
      action: 'sent',
      recordType: 'rfq',
      recordId: rfq._id,
      recordReference: rfq.rfqNumber,
      details: `RFQ ${rfq.rfqNumber} sent to ${rfq.assignedVendors.length} vendors`,
      ipAddress: req.ip,
    });

    res.json({ success: true, data: rfq });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/rfqs/:id/close
const closeRFQ = async (req, res, next) => {
  try {
    const rfq = await RFQ.findByIdAndUpdate(req.params.id, { status: 'closed' }, { new: true });
    if (!rfq) return next(new AppError('RFQ not found', 404, 'RESOURCE_NOT_FOUND'));
    res.json({ success: true, data: rfq });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/rfqs/:id/cancel
const cancelRFQ = async (req, res, next) => {
  try {
    const rfq = await RFQ.findByIdAndUpdate(req.params.id, { status: 'cancelled' }, { new: true });
    if (!rfq) return next(new AppError('RFQ not found', 404, 'RESOURCE_NOT_FOUND'));
    res.json({ success: true, data: rfq });
  } catch (err) {
    next(err);
  }
};

// POST /api/rfqs/:id/duplicate
const duplicateRFQ = async (req, res, next) => {
  try {
    const original = await RFQ.findById(req.params.id);
    if (!original) return next(new AppError('RFQ not found', 404, 'RESOURCE_NOT_FOUND'));

    const rfqNumber = await generateRFQNumber();
    const { _id, rfqNumber: _, createdAt, updatedAt, ...rfqData } = original.toObject();
    const newRFQ = await RFQ.create({ ...rfqData, rfqNumber, status: 'draft', createdBy: req.user.userId });

    res.status(201).json({ success: true, data: newRFQ });
  } catch (err) {
    next(err);
  }
};

module.exports = { getRFQs, createRFQ, getRFQById, updateRFQ, sendRFQ, closeRFQ, cancelRFQ, duplicateRFQ };
