const { Router } = require('express');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const { audit } = require('../middleware/audit');
const controller = require('../controllers/appointmentController');

const router = Router();

router.use(authenticate);

router.post('/', authorize('mother', 'facility_staff', 'chv'), audit('CREATE_APPOINTMENT', 'appointment'), [
  body('pregnancyId').isUUID(),
  body('motherId').isUUID(),
  body('facilityId').isUUID(),
  body('appointmentDate').isISO8601(),
  body('visitType').isIn(['antenatal', 'postnatal', 'follow_up', 'emergency']),
  validate,
], controller.createAppointment);

router.get('/', controller.getAppointments);
router.patch('/:id/status', authenticate, audit('UPDATE_APPOINTMENT_STATUS', 'appointment'), [
  body('status').isIn(['scheduled', 'confirmed', 'completed', 'cancelled', 'missed']),
  body('notes').optional().trim(),
  body('cancellationReason').optional().trim(),
  validate,
], controller.updateAppointmentStatus);

module.exports = router;
