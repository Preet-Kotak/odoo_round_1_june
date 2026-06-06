const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize, ROLES } = require('../middleware/rbac');
const {
  getRFQs, createRFQ, getRFQById, updateRFQ,
  sendRFQ, closeRFQ, cancelRFQ, duplicateRFQ,
} = require('../controllers/rfq.controller');

router.use(protect);

router.get('/', authorize(ROLES.ADMIN, ROLES.OFFICER), getRFQs);
router.post('/', authorize(ROLES.OFFICER), createRFQ);
router.get('/:id', getRFQById);
router.put('/:id', authorize(ROLES.OFFICER), updateRFQ);
router.patch('/:id/send', authorize(ROLES.OFFICER), sendRFQ);
router.patch('/:id/close', authorize(ROLES.OFFICER), closeRFQ);
router.patch('/:id/cancel', authorize(ROLES.OFFICER, ROLES.ADMIN), cancelRFQ);
router.post('/:id/duplicate', authorize(ROLES.OFFICER), duplicateRFQ);

module.exports = router;
