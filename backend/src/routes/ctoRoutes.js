const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middlewares/auth');
const ctoController = require('../controllers/ctoController');

// All routes are protected and restricted to CTO role
router.use(protect);
router.use(restrictTo('CTO'));

// CTO Dashboard Metrics
router.get('/dashboard-metrics', ctoController.getDashboardMetrics);

// Student 360 Profile
router.get('/student-profile/:rollNo', ctoController.getStudentProfile);

module.exports = router;
