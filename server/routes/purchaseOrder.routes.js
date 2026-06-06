const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize, ROLES } = require('../middleware/rbac');
const {
  getPurchaseOrders, createPurchaseOrder, getPurchaseOrderById,
  confirmPurchaseOrder, sendPurchaseOrder, downloadPOPdf,
} = require('../controllers/purchaseOrder.controller');

router.use(protect);

router.get('/', authorize(ROLES.ADMIN, ROLES.OFFICER, ROLES.MANAGER, ROLES.VENDOR), getPurchaseOrders);
router.post('/', authorize(ROLES.OFFICER), createPurchaseOrder);
router.get('/:id/pdf', downloadPOPdf);
router.get('/:id', getPurchaseOrderById);
router.patch('/:id/confirm', authorize(ROLES.OFFICER), confirmPurchaseOrder);
router.patch('/:id/send', authorize(ROLES.OFFICER), sendPurchaseOrder);

module.exports = router;
