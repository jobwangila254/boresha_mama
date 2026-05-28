const { Router } = require('express');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const controller = require('../controllers/authController');

const router = Router();

router.post('/register', authenticate, authorize('county_admin'), [
  body('phone').matches(/^\+?254\d{9}$/).withMessage('Valid Kenyan phone number required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('firstName').notEmpty().trim(),
  body('lastName').notEmpty().trim(),
  body('role').isIn(['mother', 'chv', 'facility_staff', 'county_admin']),
  body('nationalId').optional().isLength({ min: 5 }),
  body('areaOfCoverage').optional().trim(),
  body('facilityId').optional().isUUID(),
  validate,
], controller.register);

router.post('/register-mother', authenticate, authorize('chv', 'facility_staff', 'county_admin'), [
  body('phone').matches(/^\+?254\d{9}$/).withMessage('Valid Kenyan phone number required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('firstName').notEmpty().trim(),
  body('lastName').notEmpty().trim(),
  body('lmpDate').isDate().withMessage('Last menstrual period date is required'),
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
