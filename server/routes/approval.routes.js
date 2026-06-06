const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize, ROLES } = require('../middleware/rbac');
const { getApprovals, getApprovalById, approveRecord, rejectRecord } = require('../controllers/approval.controller');

router.use(protect);
router.use(authorize(ROLES.MANAGER, ROLES.ADMIN));

router.get('/', getApprovals);
router.get('/:id', getApprovalById);
router.patch('/:id/approve', approveRecord);
router.patch('/:id/reject', rejectRecord);

module.exports = router;
