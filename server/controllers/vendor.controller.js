const Vendor = require('../models/Vendor');
const { AppError } = require('../middleware/errorHandler');
const { generateVendorId } = require('../utils/counterService');
const { logActivity } = require('../utils/activityLogger');

// GET /api/vendors
const getVendors = async (req, res, next) => {
  try {
    const { search, status, category, page = 1, limit = 20 } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { companyName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { gstNumber: { $regex: search, $options: 'i' } },
      ];
    }
    if (status) query.status = status;
    if (category) query.category = category;

    const total = await Vendor.countDocuments(query);
    const vendors = await Vendor.find(query)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    res.json({ success: true, total, page: Number(page), data: vendors });
  } catch (err) {
    next(err);
  }
};

// POST /api/vendors
const createVendor = async (req, res, next) => {
  try {
    const vendorId = await generateVendorId();
    const vendor = await Vendor.create({ ...req.body, vendorId, createdBy: req.user.userId });

    await logActivity({
      userId: req.user.userId,
      userName: req.user.email,
      userRole: req.user.role,
      action: 'created',
      recordType: 'vendor',
      recordId: vendor._id,
      recordReference: vendor.vendorId,
      details: `Vendor ${vendor.companyName} created`,
      ipAddress: req.ip,
    });

    res.status(201).json({ success: true, data: vendor });
  } catch (err) {
    next(err);
  }
};

// GET /api/vendors/:id
const getVendorById = async (req, res, next) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) return next(new AppError('Vendor not found', 404, 'RESOURCE_NOT_FOUND'));
    res.json({ success: true, data: vendor });
  } catch (err) {
    next(err);
  }
};

// PUT /api/vendors/:id
const updateVendor = async (req, res, next) => {
  try {
    const vendor = await Vendor.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!vendor) return next(new AppError('Vendor not found', 404, 'RESOURCE_NOT_FOUND'));

    await logActivity({
      userId: req.user.userId,
      userName: req.user.email,
      userRole: req.user.role,
      action: 'updated',
      recordType: 'vendor',
      recordId: vendor._id,
      recordReference: vendor.vendorId,
      details: `Vendor ${vendor.companyName} updated`,
      ipAddress: req.ip,
    });

    res.json({ success: true, data: vendor });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/vendors/:id/status
const updateVendorStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const vendor = await Vendor.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!vendor) return next(new AppError('Vendor not found', 404, 'RESOURCE_NOT_FOUND'));

    await logActivity({
      userId: req.user.userId,
      userName: req.user.email,
      userRole: req.user.role,
      action: 'updated',
      recordType: 'vendor',
      recordId: vendor._id,
      recordReference: vendor.vendorId,
      details: `Vendor ${vendor.companyName} status changed to ${status}`,
      ipAddress: req.ip,
    });

    res.json({ success: true, data: vendor });
  } catch (err) {
    next(err);
  }
};

module.exports = { getVendors, createVendor, getVendorById, updateVendor, updateVendorStatus };
