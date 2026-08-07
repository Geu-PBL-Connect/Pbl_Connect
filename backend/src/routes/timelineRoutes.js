const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middlewares/authMiddleware');
const timelineController = require('../controllers/timelineController');

router.use(protect);

// Get timeline for phase
router.get('/:phaseId', timelineController.getTimeline);

// Create or update timeline (Admin only)
router.post('/', restrictTo('ADMIN', 'SUPER_ADMIN'), timelineController.upsertTimeline);

module.exports = router;
