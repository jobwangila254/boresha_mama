const { Router } = require('express');
const controller = require('../controllers/healthTipController');

const router = Router();

router.get('/', controller.getHealthTips);

module.exports = router;
