const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize, ROLES } = require('../middleware/rbac');
const ActivityLog = require('../models/ActivityLog');

router.use(protect);
router.use(authorize(ROLES.ADMIN));

// GET /api/activity-logs
router.get('/', async (req, res, next) => {
  try {
    const { userId, recordType, action, from, to, page = 1, limit = 50 } = req.query;
    const query = {};

    if (userId) query.userId = userId;
    if (recordType) query.recordType = recordType;
    if (action) query.action = action;
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) query.createdAt.$lte = new Date(to);
    }

    const total = await ActivityLog.countDocuments(query);
    const logs = await ActivityLog.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, total, page: Number(page), data: logs });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
