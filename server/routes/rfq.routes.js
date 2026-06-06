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
router.post('/', authorize(ROLES.OFFICER, ROLES.ADMIN), createRFQ);
router.get('/:id', getRFQById);
router.put('/:id', authorize(ROLES.OFFICER, ROLES.ADMIN), updateRFQ);
router.patch('/:id/send', authorize(ROLES.OFFICER, ROLES.ADMIN), sendRFQ);
router.patch('/:id/close', authorize(ROLES.OFFICER, ROLES.ADMIN), closeRFQ);
router.patch('/:id/cancel', authorize(ROLES.OFFICER, ROLES.ADMIN), cancelRFQ);
router.post('/:id/duplicate', authorize(ROLES.OFFICER, ROLES.ADMIN), duplicateRFQ);

module.exports = router;
