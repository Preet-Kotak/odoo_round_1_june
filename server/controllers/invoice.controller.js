const Invoice = require('../models/Invoice');
const PurchaseOrder = require('../models/PurchaseOrder');
const Approval = require('../models/Approval');
const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');
const { generateInvoiceNumber } = require('../utils/counterService');
const { logActivity } = require('../utils/activityLogger');
const { createNotification } = require('../utils/notificationService');
const { sendEmail } = require('../utils/emailService');
const { generateInvoicePdf } = require('../utils/pdfService');
const { invoiceApprovedTemplate, invoiceRejectedTemplate } = require('../utils/emailTemplates/invoiceStatus');

// GET /api/invoices
const getInvoices = async (req, res, next) => {
  try {
    const { status, vendorId, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;
    if (vendorId) query.vendorId = vendorId;

    const total = await Invoice.countDocuments(query);
    const invoices = await Invoice.find(query)
      .populate('vendorId', 'companyName email')
      .populate('poId', 'poNumber')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    res.json({ success: true, total, page: Number(page), data: invoices });
  } catch (err) {
    next(err);
  }
};

// POST /api/invoices
const generateInvoice = async (req, res, next) => {
  try {
    const { poId, ...rest } = req.body;
    const po = await PurchaseOrder.findById(poId).populate('vendorId');
    if (!po) return next(new AppError('Purchase Order not found', 404, 'RESOURCE_NOT_FOUND'));

    const invoiceNumber = await generateInvoiceNumber();

    // Auto-populate from PO
    const lineItems = po.lineItems.map(item => ({
      itemName: item.itemName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
    }));

    const grandTotal = rest.grandTotal || po.grandTotal;

    // Discrepancy check: > 5% difference
    const discrepancyPct = Math.abs(grandTotal - po.grandTotal) / po.grandTotal;
    const hasDiscrepancy = discrepancyPct > 0.05;

    const invoice = await Invoice.create({
      invoiceNumber,
      poId,
      vendorId: po.vendorId._id,
      lineItems,
      subtotal: po.subtotal,
      discount: po.discount,
      taxRate: po.taxRate,
      taxAmount: po.taxAmount,
      grandTotal,
      hasDiscrepancy,
      discrepancyNote: hasDiscrepancy ? `Invoice total differs from PO by ${(discrepancyPct * 100).toFixed(1)}%` : '',
      threeWayMatch: {
        poMatched: true,
        goodsReceived: po.status === 'completed',
        invoiceMatched: !hasDiscrepancy,
      },
      status: 'received',
      createdBy: req.user.userId,
      ...rest,
    });

    // Notify managers
    const managers = await User.find({ role: 'manager', isActive: true });
    for (const manager of managers) {
      await createNotification({
        userId: manager._id,
        type: 'invoice',
        title: 'Invoice Received',
        message: `Invoice ${invoiceNumber} received for PO ${po.poNumber}`,
        referenceId: invoice._id,
        referenceType: 'invoice',
      });
    }

    await logActivity({
      userId: req.user.userId,
      action: 'created',
      recordType: 'invoice',
      recordId: invoice._id,
      recordReference: invoiceNumber,
      details: `Invoice ${invoiceNumber} generated for PO ${po.poNumber}`,
      ipAddress: req.ip,
    });

    res.status(201).json({ success: true, data: invoice });
  } catch (err) {
    next(err);
  }
};

// GET /api/invoices/:id
const getInvoiceById = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('vendorId', 'companyName email gstNumber')
      .populate('poId', 'poNumber grandTotal')
      .populate('createdBy', 'name email');
    if (!invoice) return next(new AppError('Invoice not found', 404, 'RESOURCE_NOT_FOUND'));
    res.json({ success: true, data: invoice });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/invoices/:id/approve
const approveInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate('vendorId');
    if (!invoice) return next(new AppError('Invoice not found', 404, 'RESOURCE_NOT_FOUND'));

    invoice.status = 'approved';
    await invoice.save();

    await sendEmail(
      invoice.vendorId.email,
      `Invoice Approved — ${invoice.invoiceNumber}`,
      invoiceApprovedTemplate({ vendorName: invoice.vendorId.companyName, invoiceNumber: invoice.invoiceNumber, grandTotal: invoice.grandTotal })
    );

    await logActivity({
      userId: req.user.userId,
      action: 'approved',
      recordType: 'invoice',
      recordId: invoice._id,
      recordReference: invoice.invoiceNumber,
      details: `Invoice ${invoice.invoiceNumber} approved`,
      ipAddress: req.ip,
    });

    res.json({ success: true, data: invoice });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/invoices/:id/reject
const rejectInvoice = async (req, res, next) => {
  try {
    const { rejectionReason } = req.body;
    if (!rejectionReason) return next(new AppError('Rejection reason is required', 400, 'VALIDATION_ERROR'));

    const invoice = await Invoice.findById(req.params.id).populate('vendorId');
    if (!invoice) return next(new AppError('Invoice not found', 404, 'RESOURCE_NOT_FOUND'));

    invoice.status = 'rejected';
    invoice.rejectionReason = rejectionReason;
    await invoice.save();

    await sendEmail(
      invoice.vendorId.email,
      `Invoice Rejected — ${invoice.invoiceNumber}`,
      invoiceRejectedTemplate({ vendorName: invoice.vendorId.companyName, invoiceNumber: invoice.invoiceNumber, reason: rejectionReason })
    );

    await logActivity({
      userId: req.user.userId,
      action: 'rejected',
      recordType: 'invoice',
      recordId: invoice._id,
      recordReference: invoice.invoiceNumber,
      details: `Invoice ${invoice.invoiceNumber} rejected: ${rejectionReason}`,
      ipAddress: req.ip,
    });

    res.json({ success: true, data: invoice });
  } catch (err) {
    next(err);
  }
};

// GET /api/invoices/:id/pdf
const downloadInvoicePdf = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate('vendorId').populate('poId');
    if (!invoice) return next(new AppError('Invoice not found', 404, 'RESOURCE_NOT_FOUND'));

    const pdfBuffer = await generateInvoicePdf(invoice);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoiceNumber}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
};

// POST /api/invoices/:id/email
const sendInvoiceEmail = async (req, res, next) => {
  try {
    const { to, subject, message } = req.body;
    const invoice = await Invoice.findById(req.params.id).populate('vendorId').populate('poId');
    if (!invoice) return next(new AppError('Invoice not found', 404, 'RESOURCE_NOT_FOUND'));

    const pdfBuffer = await generateInvoicePdf(invoice);
    await sendEmail(to || invoice.vendorId.email, subject || `Invoice ${invoice.invoiceNumber}`, message || `<p>Please find invoice ${invoice.invoiceNumber} attached.</p>`);

    invoice.emailSentAt = new Date();
    await invoice.save();

    res.json({ success: true, message: 'Invoice email sent' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getInvoices, generateInvoice, getInvoiceById, approveInvoice, rejectInvoice, downloadInvoicePdf, sendInvoiceEmail };
