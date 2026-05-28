const { Router } = require('express');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const controller = require('../controllers/referralController');

const router = Router();

router.use(authenticate);

router.post('/', authorize('chv', 'facility_staff'), [
  body('pregnancyId').isUUID(),
  body('motherId').isUUID(),
  body('toFacilityId').isUUID(),
  body('referralReason').notEmpty(),
  validate,
], controller.createReferral);

router.get('/', controller.getReferrals);
router.patch('/:id/status', authorize('facility_staff', 'county_admin'), [
  body('status').isIn(['pending', 'accepted', 'completed', 'cancelled', 'declined']),
  body('outcome').optional().trim(),
  validate,
], controller.updateReferralStatus);

module.exports = router;
