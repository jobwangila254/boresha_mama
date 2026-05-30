const { Router } = require('express');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const { audit } = require('../middleware/audit');
const controller = require('../controllers/facilityController');

const router = Router();

router.get('/', controller.getFacilities);
router.post('/',
  authenticate, authorize('county_admin'),
  [
    body('name').notEmpty().trim().withMessage('Facility name is required'),
    body('type').isIn(['dispensary', 'health_center', 'sub_county_hospital', 'county_hospital', 'county_referral_hospital']),
    body('ward').notEmpty().trim(),
    body('constituency').notEmpty().trim(),
    body('level').notEmpty().trim(),
    body('phone').optional().matches(/^\+?254\d{9}$/).withMessage('Valid Kenyan phone number required'),
    body('email').optional().isEmail(),
    body('latitude').optional().isFloat({ min: -90, max: 90 }),
    body('longitude').optional().isFloat({ min: -180, max: 180 }),
    validate,
  ],
  audit('CREATE_FACILITY', 'facility'),
  controller.createFacility
);
router.get('/nearby', controller.getNearbyFacilities);
router.get('/:id/stats', authenticate, authorize('county_admin'), controller.getFacilityStats);
router.get('/:id', controller.getFacilityById);
router.put('/:id',
  authenticate, authorize('county_admin'),
  audit('UPDATE_FACILITY', 'facility'),
  controller.updateFacility
);

module.exports = router;
