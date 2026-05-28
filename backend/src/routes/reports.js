const { Router } = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const controller = require('../controllers/reportController');

const router = Router();

router.use(authenticate);
router.use(authorize('county_admin', 'facility_staff'));

router.get('/dashboard', controller.getDashboardStats);
router.get('/kpi', controller.getKPIData);
router.get('/export', controller.exportReport);

module.exports = router;
