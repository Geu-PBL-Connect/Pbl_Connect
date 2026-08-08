const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const ctoController = require('../controllers/ctoController');

// All routes are protected and restricted to CTO role
router.use(protect);
router.use(authorize('CTO', 'SUPER_ADMIN'));

// CTO Dashboard Metrics
router.get('/dashboard-metrics', ctoController.getDashboardMetrics);

// CTO Projects List
router.get('/projects', ctoController.getProjectsList);

// CTO PBL List
router.get('/pbl', ctoController.getPbls);

// Student 360 Profile
router.get('/student-profile/:rollNo', ctoController.getStudentProfile);

// CTO Activity Logs
router.get('/logs', ctoController.getActivityLogs);

module.exports = router;
