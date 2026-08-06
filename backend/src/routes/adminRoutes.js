const express = require('express');
const router = express.Router();
const {
  createTeamAdmin,
  createPbl,
  getPbls,
  updatePbl,
  archivePbl,
  deletePbl,
  updatePblTimeline,
  updatePhaseTimeline,
  uploadFaculty,
  bulkUploadFaculty,
  bulkUploadStudents,
  assignMentors,
  assignEvaluators,
  randomMapMentors,
  randomMapEvaluators,
  updatePhaseConfig,
  updateTeam,
  deleteTeam,
  addTeamMemberAdmin,
  removeTeamMemberAdmin,
  addFaculty,
  getAllFaculty,
  getTeamsForPbl,
  getMarksForPbl,
  downloadReport,
  resetUserPassword,
  getDashboardStats,
  getSettings,
  updateSettings,
  autoFormTeams,
  unlockForReevaluation,
  bulkReevaluation,
  getReevaluations,
  adminUpdateMarks,
  getAllStudents,
  bulkDeleteTeams,
  bulkUploadTeams,
  assignMicroMentors,
  getMicroMentorAssignments,
  assignSuperMentors,
  getSuperMentorTeamsAdmin,
  overrideSuperMentorReview,
  getSuperMentorReport,
  getEvaluationSchedule,
  updateEvaluationSchedule,
  getFacultyGradingStats,
} = require('../controllers/adminController');
const { getInteractions } = require('../controllers/facultyController');
const { protect, authorize } = require('../middlewares/auth');
const { uploadExcel } = require('../middlewares/upload');
const axios = require('axios');
const prisma = require('../config/db');

// Apply protection and RBAC to all routes
router.use(protect);
router.use(authorize('ADMIN', 'SUPER_ADMIN'));

router.get('/team/:teamId/interactions', getInteractions);

router.route('/faculty')
  .get(getAllFaculty)
  .post(addFaculty);

router.route('/students')
  .get(getAllStudents);
router.post('/mentor-mapping', assignMentors);
router.post('/evaluator-mapping', assignEvaluators);
router.post('/random-map/mentors', randomMapMentors);
router.post('/random-map/evaluators', randomMapEvaluators);

// Super Mentor Routes
router.post('/super-mentor/assign', assignSuperMentors);
router.get('/super-mentor/teams/:pblId', getSuperMentorTeamsAdmin);
router.post('/super-mentor/override/:teamId', overrideSuperMentorReview);
router.get('/reports/super-mentor/:pblId', getSuperMentorReport);

router.post('/re-evaluation/unlock', unlockForReevaluation);
router.post('/re-evaluation/bulk', uploadExcel.single('file'), bulkReevaluation);
router.get('/re-evaluation/list/:phaseId', getReevaluations);
router.get('/reports/:type', downloadReport);
router.get('/reports/marks/:pblId', getMarksForPbl);
router.put('/reports/marks/update', adminUpdateMarks);
router.get('/pbl', getPbls);
router.get('/stats', getDashboardStats);
router.get('/faculty-grading-stats', getFacultyGradingStats);
router.get('/settings', getSettings);
router.put('/settings', updateSettings);

router.route('/pbl')
  .post(createPbl)
  .get(getPbls);

router.post('/pbl/:pblId/auto-form-teams', autoFormTeams);
router.post('/pbl/:pblId/teams/bulk', uploadExcel.single('file'), bulkUploadTeams);

router.route('/pbl/:id')
  .put(updatePbl)
  .delete(archivePbl);

router.delete('/pbl/hard/:id', deletePbl);

router.post('/pbl/:id/timeline', updatePblTimeline);
router.post('/pbl/:id/phase-timeline/:phaseNumber', updatePhaseTimeline);
router.post('/pbl/:id/phase-config', updatePhaseConfig);

router.route('/teams')
  .post(createTeamAdmin);

router.post('/teams/bulk-delete', bulkDeleteTeams);

router.route('/teams/:id')
  .put(updateTeam)
  .delete(deleteTeam);

router.post('/teams/:id/members', addTeamMemberAdmin);
router.delete('/teams/:id/members/:studentId', removeTeamMemberAdmin);

router.get('/teams/pbl/:pblId', getTeamsForPbl);

// Micro Mentoring
router.post('/micro-mentor/assign', assignMicroMentors);
router.get('/micro-mentor/:pblId', getMicroMentorAssignments);

// Evaluation Schedule
router.get('/evaluation-schedule/:pblId/:phaseId', getEvaluationSchedule);
router.put('/evaluation-schedule', updateEvaluationSchedule);

module.exports = router;
