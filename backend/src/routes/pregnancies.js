const { Router } = require('express');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const { audit } = require('../middleware/audit');
const controller = require('../controllers/pregnancyController');

const router = Router();

router.use(authenticate);

router.post('/', authorize('chv', 'facility_staff', 'county_admin'), audit('REGISTER_PREGNANCY', 'pregnancy'), [
  body('motherId').isUUID(),
  body('lmpDate').isDate(),
  body('gravida').optional().isInt({ min: 1 }),
  validate,
], controller.registerPregnancy);

router.get('/', controller.getPregnancies);
router.get('/timeline/:id', controller.getPregnancyTimeline);
router.get('/:id', controller.getPregnancyById);
router.put('/:id', authorize('chv', 'facility_staff', 'county_admin'), audit('UPDATE_PREGNANCY', 'pregnancy'), [
  body('status').optional().isIn(['active', 'delivered', 'lost', 'transferred']),
  body('riskLevel').optional().isIn(['low', 'medium', 'high', 'critical']),
  body('riskFactors').optional().isArray(),
  body('notes').optional().trim(),
  body('facilityId').optional().isUUID(),
  validate,
], controller.updatePregnancy);

router.patch('/:id/assign-chv', authorize('county_admin'), audit('ASSIGN_CHV', 'pregnancy'), [
  body('chvId').isUUID(),
  validate,
], controller.assignChv);

module.exports = router;
