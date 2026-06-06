const PurchaseOrder = require('../models/PurchaseOrder');
const Quotation = require('../models/Quotation');
const { AppError } = require('../middleware/errorHandler');
const { generatePONumber } = require('../utils/counterService');
const { logActivity } = require('../utils/activityLogger');
const { sendEmail } = require('../utils/emailService');
const { generatePOPdf } = require('../utils/pdfService');
const poConfirmationTemplate = require('../utils/emailTemplates/poConfirmation');

// GET /api/purchase-orders
const getPurchaseOrders = async (req, res, next) => {
  try {
    const { search, status, vendorId, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;
    if (vendorId) query.vendorId = vendorId;
    if (search) query.$or = [{ poNumber: { $regex: search, $options: 'i' } }];

    // Vendors only see their own POs
    if (req.user.role === 'vendor') {
      const vendor = await require('../models/Vendor').findOne({ linkedUserId: req.user.userId });
      if (vendor) query.vendorId = vendor._id;
    }

    const total = await PurchaseOrder.countDocuments(query);
    const pos = await PurchaseOrder.find(query)
      .populate('vendorId', 'companyName email')
      .populate('rfqId', 'rfqNumber title')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    res.json({ success: true, total, page: Number(page), data: pos });
  } catch (err) {
    next(err);
  }
};

// POST /api/purchase-orders
const createPurchaseOrder = async (req, res, next) => {
  try {
    const { quotationId, ...rest } = req.body;
    const poNumber = await generatePONumber();

    let poData = { ...rest, poNumber, createdBy: req.user.userId };

    // Auto-populate from quotation if provided
    if (quotationId) {
      const quotation = await Quotation.findById(quotationId).populate('rfqId').populate('vendorId');
      if (!quotation) return next(new AppError('Quotation not found', 404, 'RESOURCE_NOT_FOUND'));
      if (quotation.status !== 'approved') return next(new AppError('Quotation must be approved first', 400, 'VALIDATION_ERROR'));

      poData = {
        ...poData,
        quotationId,
        rfqId: quotation.rfqId._id,
        vendorId: quotation.vendorId._id,
        lineItems: quotation.lineItems.map(item => ({
          itemName: item.itemName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          receivedQuantity: 0,
        })),
        subtotal: quotation.subtotal,
        discount: quotation.discount,
        taxRate: quotation.taxRate,
        taxAmount: quotation.taxAmount,
        grandTotal: quotation.grandTotal,
      };
    }

    const po = await PurchaseOrder.create(poData);

    await logActivity({
      userId: req.user.userId,
      action: 'created',
      recordType: 'purchase_order',
      recordId: po._id,
      recordReference: po.poNumber,
      details: `PO ${po.poNumber} created`,
      ipAddress: req.ip,
    });

    res.status(201).json({ success: true, data: po });
  } catch (err) {
    next(err);
  }
};

// GET /api/purchase-orders/:id
const getPurchaseOrderById = async (req, res, next) => {
  try {
    const po = await PurchaseOrder.findById(req.params.id)
      .populate('vendorId', 'companyName email gstNumber address')
      .populate('rfqId', 'rfqNumber title')
      .populate('createdBy', 'name email');
    if (!po) return next(new AppError('Purchase Order not found', 404, 'RESOURCE_NOT_FOUND'));
    res.json({ success: true, data: po });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/purchase-orders/:id/confirm
const confirmPurchaseOrder = async (req, res, next) => {
  try {
    const po = await PurchaseOrder.findById(req.params.id);
    if (!po) return next(new AppError('PO not found', 404, 'RESOURCE_NOT_FOUND'));
    if (po.status !== 'draft') return next(new AppError('Only draft POs can be confirmed', 400, 'VALIDATION_ERROR'));

    po.status = 'confirmed';
    await po.save();

    await logActivity({
      userId: req.user.userId,
      action: 'updated',
      recordType: 'purchase_order',
      recordId: po._id,
      recordReference: po.poNumber,
      details: `PO ${po.poNumber} confirmed`,
      ipAddress: req.ip,
    });

    res.json({ success: true, data: po });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/purchase-orders/:id/send
const sendPurchaseOrder = async (req, res, next) => {
  try {
    const po = await PurchaseOrder.findById(req.params.id).populate('vendorId');
    if (!po) return next(new AppError('PO not found', 404, 'RESOURCE_NOT_FOUND'));

    po.status = 'sent';
    po.sentAt = new Date();
    await po.save();

    // Send email with PDF
    const pdfBuffer = await generatePOPdf(po);
    await sendEmail(
      po.vendorId.email,
      `Purchase Order ${po.poNumber} — VendorBridge`,
      poConfirmationTemplate({
        vendorName: po.vendorId.companyName,
        poNumber: po.poNumber,
        grandTotal: po.grandTotal,
        expectedDelivery: po.expectedDelivery,
        clientUrl: process.env.CLIENT_URL,
      })
    );

    await logActivity({
      userId: req.user.userId,
      action: 'sent',
      recordType: 'purchase_order',
      recordId: po._id,
      recordReference: po.poNumber,
      details: `PO ${po.poNumber} sent to ${po.vendorId.email}`,
      ipAddress: req.ip,
    });

    res.json({ success: true, data: po });
  } catch (err) {
    next(err);
  }
};

// GET /api/purchase-orders/:id/pdf
const downloadPOPdf = async (req, res, next) => {
  try {
    const po = await PurchaseOrder.findById(req.params.id).populate('vendorId');
    if (!po) return next(new AppError('PO not found', 404, 'RESOURCE_NOT_FOUND'));

    const pdfBuffer = await generatePOPdf(po);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${po.poNumber}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
};

module.exports = { getPurchaseOrders, createPurchaseOrder, getPurchaseOrderById, confirmPurchaseOrder, sendPurchaseOrder, downloadPOPdf };
