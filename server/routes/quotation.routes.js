const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize, ROLES } = require('../middleware/rbac');
const {
  getQuotations, submitQuotation, getQuotationById,
  getComparisonData, selectQuotation, rejectQuotation,
} = require('../controllers/quotation.controller');

router.use(protect);

router.get('/', authorize(ROLES.ADMIN, ROLES.OFFICER), getQuotations);
router.post('/', authorize(ROLES.VENDOR), submitQuotation);
router.get('/rfq/:rfqId/compare', authorize(ROLES.OFFICER, ROLES.ADMIN), getComparisonData);
router.get('/:id', getQuotationById);
router.patch('/:id/select', authorize(ROLES.OFFICER), selectQuotation);
router.patch('/:id/reject', authorize(ROLES.OFFICER), rejectQuotation);

module.exports = router;
