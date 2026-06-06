const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize, ROLES } = require('../middleware/rbac');
const PurchaseOrder = require('../models/PurchaseOrder');
const Invoice = require('../models/Invoice');
const RFQ = require('../models/RFQ');
const Vendor = require('../models/Vendor');
const Approval = require('../models/Approval');

router.use(protect);

// GET /api/reports/dashboard
router.get('/dashboard', async (req, res, next) => {
  try {
    const [activeRFQs, pendingApprovals, activePOs, recentInvoices, recentPOs] = await Promise.all([
      RFQ.countDocuments({ status: 'open' }),
      Approval.countDocuments({ decision: 'pending' }),
      PurchaseOrder.countDocuments({ status: { $in: ['confirmed', 'sent', 'acknowledged'] } }),
      Invoice.find().sort({ createdAt: -1 }).limit(5).populate('vendorId', 'companyName'),
      PurchaseOrder.find().sort({ createdAt: -1 }).limit(5).populate('vendorId', 'companyName'),
    ]);

    res.json({
      success: true,
      data: { activeRFQs, pendingApprovals, activePOs, recentInvoices, recentPOs },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/reports/spending-summary
router.get('/spending-summary', authorize(ROLES.ADMIN, ROLES.MANAGER), async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const match = { status: 'approved' };
    if (from || to) {
      match.createdAt = {};
      if (from) match.createdAt.$gte = new Date(from);
      if (to) match.createdAt.$lte = new Date(to);
    }

    const spending = await Invoice.aggregate([
      { $match: match },
      { $group: { _id: '$vendorId', totalSpend: { $sum: '$grandTotal' }, invoiceCount: { $sum: 1 } } },
      { $lookup: { from: 'vendors', localField: '_id', foreignField: '_id', as: 'vendor' } },
      { $unwind: '$vendor' },
      { $project: { vendorName: '$vendor.companyName', totalSpend: 1, invoiceCount: 1 } },
      { $sort: { totalSpend: -1 } },
    ]);

    res.json({ success: true, data: spending });
  } catch (err) {
    next(err);
  }
});

// GET /api/reports/monthly-trends
router.get('/monthly-trends', authorize(ROLES.ADMIN, ROLES.MANAGER), async (req, res, next) => {
  try {
    const trends = await PurchaseOrder.aggregate([
      { $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        totalSpend: { $sum: '$grandTotal' },
        poCount: { $sum: 1 },
      }},
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 },
    ]);

    res.json({ success: true, data: trends });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
