const { Router } = require('express');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const controller = require('../controllers/pregnancyController');

const router = Router();

router.use(authenticate);

router.post('/', authorize('chv', 'facility_staff', 'county_admin'), [
  body('motherId').isUUID(),
  body('lmpDate').isDate(),
  body('gravida').optional().isInt({ min: 1 }),
  validate,
], controller.registerPregnancy);

router.get('/', controller.getPregnancies);
router.get('/timeline/:id', controller.getPregnancyTimeline);
router.get('/:id', controller.getPregnancyById);
router.put('/:id', authorize('chv', 'facility_staff', 'county_admin'), [
  body('status').optional().isIn(['active', 'completed', 'miscarriage', 'ectopic', 'loss']),
  body('riskLevel').optional().isIn(['low', 'medium', 'high']),
  body('riskFactors').optional().isArray(),
  body('notes').optional().trim(),
  body('facilityId').optional().isUUID(),
  validate,
], controller.updatePregnancy);

module.exports = router;
