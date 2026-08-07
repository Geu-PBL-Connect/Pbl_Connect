const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const timelineController = require('../controllers/timelineController');

router.use(protect);

// Get timeline for phase
router.get('/:phaseId', timelineController.getTimeline);

// Create or update timeline (Admin only)
router.post('/', authorize('ADMIN', 'SUPER_ADMIN'), timelineController.upsertTimeline);

module.exports = router;
