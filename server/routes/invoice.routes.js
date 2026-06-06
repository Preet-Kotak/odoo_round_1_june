const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize, ROLES } = require('../middleware/rbac');
const {
  getInvoices, generateInvoice, getInvoiceById,
  approveInvoice, rejectInvoice, downloadInvoicePdf, sendInvoiceEmail,
} = require('../controllers/invoice.controller');

router.use(protect);

router.get('/', authorize(ROLES.ADMIN, ROLES.OFFICER, ROLES.MANAGER), getInvoices);
router.post('/', authorize(ROLES.OFFICER), generateInvoice);
router.get('/:id/pdf', authorize(ROLES.ADMIN, ROLES.OFFICER, ROLES.MANAGER, ROLES.VENDOR), downloadInvoicePdf);
router.post('/:id/email', authorize(ROLES.OFFICER, ROLES.ADMIN), sendInvoiceEmail);
router.get('/:id', getInvoiceById);
router.patch('/:id/approve', authorize(ROLES.MANAGER, ROLES.ADMIN), approveInvoice);
router.patch('/:id/reject', authorize(ROLES.MANAGER, ROLES.ADMIN), rejectInvoice);

module.exports = router;
