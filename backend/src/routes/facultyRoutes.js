const express = require('express');
const router = express.Router();
const {
  getMentoredTeams,
  getEvaluatedTeams,
  mentorGradeSubmission,
  evaluateStudent,
  getTeamEvaluations,
  finishTeamEvaluation,
  getPreviousPhaseRemarks,
  getPendingReevaluations,
  submitReevaluationMarks,
  logInteraction,
  getInteractions,
  updateVenue,
  getVenue,
  getSuperMentoredTeams,
  reviewSuperMentorTeam,
  checkSuperMentorRole,
  getTimelineWarnings,
  exportEvaluatorMarks
} = require('../controllers/facultyController');
const { protect, authorize } = require('../middlewares/auth');

router.use(protect);
router.use(authorize('FACULTY'));

router.put('/venue', updateVenue);
router.get('/venue', getVenue);

// Super Mentor Routes
router.get('/super-mentor/check-role', checkSuperMentorRole);
router.get('/super-mentor/teams', getSuperMentoredTeams);
router.post('/super-mentor/review/:teamId', reviewSuperMentorTeam);

router.get('/mentor/teams', getMentoredTeams);
router.post('/mentor/grade/:submissionId', mentorGradeSubmission);
router.post('/mentor/team/:teamId/interaction', logInteraction);
router.get('/team/:teamId/interactions', getInteractions);

router.get('/evaluator/teams', getEvaluatedTeams);
router.get('/evaluator/timeline-warnings', getTimelineWarnings);
router.post('/evaluator/evaluate/:phaseId/:studentId', evaluateStudent);
router.get('/evaluator/export-marks/:phaseId', exportEvaluatorMarks);
router.get('/evaluator/evaluations/:phaseId/:teamId', getTeamEvaluations);
router.put('/evaluator/finish/:phaseId/:teamId', finishTeamEvaluation);
router.get('/evaluator/previous-remarks/:phaseNumber/:teamId', getPreviousPhaseRemarks);

router.get('/evaluator/re-evaluations', getPendingReevaluations);
router.post('/evaluator/re-evaluations/submit', submitReevaluationMarks);

module.exports = router;
