const Quotation = require('../models/Quotation');
const RFQ = require('../models/RFQ');
const Approval = require('../models/Approval');
const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');
const { logActivity } = require('../utils/activityLogger');
const { createNotification } = require('../utils/notificationService');

// Calculate totals helper
const calcTotals = (lineItems, discount = 0, taxRate = 0) => {
  const subtotal = lineItems.reduce((sum, item) => {
    item.totalPrice = item.quantity * item.unitPrice;
    return sum + item.totalPrice;
  }, 0);
  const discountAmt = subtotal * (discount / 100);
  const taxable = subtotal - discountAmt;
  const taxAmount = taxable * (taxRate / 100);
  const grandTotal = taxable + taxAmount;
  return { subtotal, taxAmount, grandTotal };
};

// GET /api/quotations
const getQuotations = async (req, res, next) => {
  try {
    const { status, rfqId, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;
    if (rfqId) query.rfqId = rfqId;

    // Vendors only see their own quotations
    if (req.user.role === 'vendor') {
      const vendor = await require('../models/Vendor').findOne({ linkedUserId: req.user.userId });
      if (vendor) query.vendorId = vendor._id;
    }

    const total = await Quotation.countDocuments(query);
    const quotations = await Quotation.find(query)
      .populate('rfqId', 'rfqNumber title deadline')
      .populate('vendorId', 'companyName email')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    res.json({ success: true, total, page: Number(page), data: quotations });
  } catch (err) {
    next(err);
  }
};

// POST /api/quotations
const submitQuotation = async (req, res, next) => {
  try {
    const { rfqId, vendorId, lineItems, discount, taxRate, ...rest } = req.body;

    const rfq = await RFQ.findById(rfqId);
    if (!rfq) return next(new AppError('RFQ not found', 404, 'RESOURCE_NOT_FOUND'));
    if (rfq.status !== 'open') return next(new AppError('RFQ is not open for quotations', 400, 'VALIDATION_ERROR'));
    if (new Date() > new Date(rfq.deadline)) return next(new AppError('RFQ deadline has passed', 400, 'VALIDATION_ERROR'));

    const { subtotal, taxAmount, grandTotal } = calcTotals(lineItems, discount, taxRate);

    const quotation = await Quotation.create({
      rfqId, vendorId, lineItems, discount, taxRate,
      subtotal, taxAmount, grandTotal,
      status: 'submitted', submittedAt: new Date(),
      ...rest,
    });

    // Notify procurement officer
    const officer = await User.findById(rfq.createdBy);
    if (officer) {
      await createNotification({
        userId: officer._id,
        type: 'quotation',
        title: 'New Quotation Received',
        message: `A quotation has been submitted for ${rfq.rfqNumber}`,
        referenceId: quotation._id,
        referenceType: 'quotation',
      });
    }

    await logActivity({
      userId: req.user.userId,
      action: 'created',
      recordType: 'quotation',
      recordId: quotation._id,
      recordReference: rfq.rfqNumber,
      details: `Quotation submitted for ${rfq.rfqNumber}`,
      ipAddress: req.ip,
    });

    res.status(201).json({ success: true, data: quotation });
  } catch (err) {
    next(err);
  }
};

// GET /api/quotations/:id
const getQuotationById = async (req, res, next) => {
  try {
    const quotation = await Quotation.findById(req.params.id)
      .populate('rfqId')
      .populate('vendorId', 'companyName email gstNumber');
    if (!quotation) return next(new AppError('Quotation not found', 404, 'RESOURCE_NOT_FOUND'));
    res.json({ success: true, data: quotation });
  } catch (err) {
    next(err);
  }
};

// GET /api/quotations/rfq/:rfqId/compare
const getComparisonData = async (req, res, next) => {
  try {
    const quotations = await Quotation.find({ rfqId: req.params.rfqId, status: { $in: ['submitted', 'under_review', 'selected'] } })
      .populate('vendorId', 'companyName email rating');

    // Find lowest price
    const lowestPrice = Math.min(...quotations.map(q => q.grandTotal));

    const data = quotations.map(q => ({
      ...q.toObject(),
      isLowestPrice: q.grandTotal === lowestPrice,
    }));

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/quotations/:id/select
const selectQuotation = async (req, res, next) => {
  try {
    const quotation = await Quotation.findById(req.params.id).populate('rfqId');
    if (!quotation) return next(new AppError('Quotation not found', 404, 'RESOURCE_NOT_FOUND'));

    quotation.status = 'selected';
    await quotation.save();

    // Find a manager to assign approval to
    const manager = await User.findOne({ role: 'manager', isActive: true });
    if (!manager) return next(new AppError('No active manager found for approval', 400, 'VALIDATION_ERROR'));

    await Approval.create({
      referenceId: quotation._id,
      referenceType: 'quotation',
      requestedBy: req.user.userId,
      assignedTo: manager._id,
    });

    await createNotification({
      userId: manager._id,
      type: 'approval',
      title: 'Quotation Awaiting Approval',
      message: `A quotation for ${quotation.rfqId?.rfqNumber} requires your approval`,
      referenceId: quotation._id,
      referenceType: 'quotation',
    });

    await logActivity({
      userId: req.user.userId,
      action: 'updated',
      recordType: 'quotation',
      recordId: quotation._id,
      details: 'Quotation selected for approval',
      ipAddress: req.ip,
    });

    res.json({ success: true, data: quotation });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/quotations/:id/reject
const rejectQuotation = async (req, res, next) => {
  try {
    const { rejectionReason } = req.body;
    const quotation = await Quotation.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected', rejectionReason },
      { new: true }
    );
    if (!quotation) return next(new AppError('Quotation not found', 404, 'RESOURCE_NOT_FOUND'));
    res.json({ success: true, data: quotation });
  } catch (err) {
    next(err);
  }
};

module.exports = { getQuotations, submitQuotation, getQuotationById, getComparisonData, selectQuotation, rejectQuotation };
