const express = require('express');
const { generatePhotoReport, generateMeasurementReport, generateDailyReport } = require('../controllers/reportController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/:projectId/photo', authenticate, generatePhotoReport);
router.post('/:projectId/measurement', authenticate, generateMeasurementReport);
router.post('/:projectId/daily', authenticate, generateDailyReport);

module.exports = router;

