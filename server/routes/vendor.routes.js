const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize, ROLES } = require('../middleware/rbac');
const {
  getVendors,
  createVendor,
  getVendorById,
  updateVendor,
  updateVendorStatus,
} = require('../controllers/vendor.controller');

router.use(protect);

router.get('/', authorize(ROLES.ADMIN, ROLES.OFFICER), getVendors);
router.post('/', authorize(ROLES.ADMIN, ROLES.OFFICER), createVendor);
router.get('/:id', authorize(ROLES.ADMIN, ROLES.OFFICER), getVendorById);
router.put('/:id', authorize(ROLES.ADMIN, ROLES.OFFICER), updateVendor);
router.patch('/:id/status', authorize(ROLES.ADMIN), updateVendorStatus);

module.exports = router;
