const { Router } = require('express');
const controller = require('../controllers/facilityController');

const router = Router();

router.get('/', controller.getFacilities);
router.get('/nearby', controller.getNearbyFacilities);
router.get('/:id', controller.getFacilityById);

module.exports = router;
