const { Router } = require('express');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const { audit } = require('../middleware/audit');
const controller = require('../controllers/monitoringController');

const router = Router();

router.use(authenticate);
router.use(authorize('mother', 'chv', 'facility_staff', 'county_admin'));

router.post('/', audit('RECORD_SELF_MONITORING', 'self_monitoring'), [
  body('pregnancyId').isUUID(),
  body('weightKg').optional().isFloat({ min: 20, max: 200 }),
  body('bpSystolic').optional().isInt({ min: 60, max: 250 }),
  body('bpDiastolic').optional().isInt({ min: 30, max: 150 }),
  validate,
], controller.recordSelfMonitoring);

router.get('/', controller.getSelfMonitoring);

module.exports = router;
