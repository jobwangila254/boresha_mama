const { Router } = require('express');
const controller = require('../controllers/locationController');

const router = Router();

router.get('/', controller.getLocations);

module.exports = router;
