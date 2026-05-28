const { Router } = require('express');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const controller = require('../controllers/homeVisitController');

const router = Router();

router.use(authenticate);

router.post('/', authorize('chv'), [
  body('pregnancyId').isUUID(),
  body('motherId').isUUID(),
  body('visitDate').isDate(),
  body('visitType').isIn(['antenatal', 'postnatal', 'follow_up', 'emergency']),
  validate,
], controller.createHomeVisit);

router.post('/sync', authorize('chv'), [
  body('visits').isArray({ min: 1 }),
  body('visits.*.pregnancyId').isUUID(),
  body('visits.*.motherId').isUUID(),
  body('visits.*.visitDate').isDate(),
  body('visits.*.visitType').isIn(['antenatal', 'postnatal', 'follow_up', 'emergency']),
  validate,
], controller.syncOfflineVisits);
router.get('/', controller.getHomeVisits);

module.exports = router;
