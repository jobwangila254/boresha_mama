const { Router } = require('express');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const { audit } = require('../middleware/audit');
const controller = require('../controllers/authController');

const router = Router();

router.post('/register-mother-self', [
  body('firstName').notEmpty().trim(),
  body('lastName').notEmpty().trim(),
  body('phone').matches(/^\+?254\d{9}$/).withMessage('Valid Kenyan phone number required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('dateOfBirth').isDate().withMessage('Date of birth is required'),
  body('lmpDate').optional({ values: 'null' }).isDate().withMessage('LMP date must be a valid date'),
  body('pregnancyStage').isIn(['first_trimester', 'second_trimester', 'third_trimester', 'postnatal'])
    .withMessage('Valid pregnancy stage required'),
  body('village').optional().trim(),
  body('ward').optional().trim(),
  body('facilityId').optional().isUUID(),
  validate,
], controller.registerMotherSelf);

router.post('/onboarding', authenticate, audit('COMPLETE_ONBOARDING', 'mother'), [
  body('data').isObject().withMessage('Onboarding data is required'),
  validate,
], controller.saveOnboarding);

router.post('/register', authenticate, authorize('county_admin'), audit('REGISTER_USER', 'user'), [
  body('phone').matches(/^\+?254\d{9}$/).withMessage('Valid Kenyan phone number required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('firstName').notEmpty().trim(),
  body('lastName').notEmpty().trim(),
  body('role').isIn(['mother', 'chv', 'facility_staff', 'county_admin']),
  body('nationalId').if(body('role').equals('chv')).notEmpty().isLength({ min: 5 }).withMessage('National ID is required for CHVs'),
  body('nationalId').if(body('role').not().equals('chv')).optional().isLength({ min: 5 }),
  body('areaOfCoverage').if(body('role').equals('chv')).notEmpty().withMessage('Area of coverage is required for CHVs').trim(),
  body('areaOfCoverage').if(body('role').not().equals('chv')).optional().trim(),
  body('facilityId').optional().isUUID(),
  validate,
], controller.register);

router.post('/register-mother', authenticate, authorize('chv', 'facility_staff', 'county_admin'), [
  body('phone').matches(/^\+?254\d{9}$/).withMessage('Valid Kenyan phone number required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('firstName').notEmpty().trim(),
  body('lastName').notEmpty().trim(),
  body('lmpDate').optional({ values: 'null' }).isDate().withMessage('LMP date must be a valid date'),
  body('pregnancyStage').optional().isIn(['first_trimester', 'second_trimester', 'third_trimester', 'postnatal'])
    .withMessage('Valid pregnancy stage required when LMP is unknown'),
  body('nationalId').notEmpty().isLength({ min: 5 }).withMessage('National ID is required and must be at least 5 characters'),
  body('gravida').optional().isInt({ min: 1 }),
  body('parity').optional().isInt({ min: 0 }),
  validate,
], controller.registerMother);

router.post('/login', [
  body('identifier').notEmpty().withMessage('Email or phone number is required'),
  body('password').notEmpty().withMessage('Password is required'),
  validate,
], controller.login);

router.get('/users', authenticate, authorize('county_admin'), controller.getUsers);
router.patch('/users/:id/status', authenticate, authorize('county_admin'), controller.toggleUserStatus);

router.get('/profile', authenticate, controller.getProfile);
router.put('/profile', authenticate, controller.updateProfile);
router.post('/change-password', authenticate, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 }),
  validate,
], controller.changePassword);

module.exports = router;
