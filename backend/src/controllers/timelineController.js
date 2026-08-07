const prisma = require('../config/db');

// @desc    Get timeline for a phase
// @route   GET /api/timelines/:phaseId
// @access  Private
const getTimeline = async (req, res, next) => {
  try {
    const { phaseId } = req.params;
    const timeline = await prisma.evaluationTimeline.findUnique({
      where: { phaseId }
    });

    if (!timeline) {
      return res.json(null);
    }
    res.json(timeline);
  } catch (error) {
    next(error);
  }
};

// @desc    Create or update timeline
// @route   POST /api/timelines
// @access  Private/Admin
const upsertTimeline = async (req, res, next) => {
  try {
    const { phaseId, startDate, endDate, editEndDate, isLocked } = req.body;
    
    if (!phaseId || !startDate || !endDate) {
      res.status(400);
      throw new Error("Phase ID, Start Date, and End Date are required.");
    }

    const timeline = await prisma.evaluationTimeline.upsert({
      where: { phaseId },
      update: {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        editEndDate: editEndDate ? new Date(editEndDate) : null,
        isLocked: isLocked || false
      },
      create: {
        phaseId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        editEndDate: editEndDate ? new Date(editEndDate) : null,
        isLocked: isLocked || false
      }
    });

    res.json({ message: "Timeline saved successfully", timeline });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTimeline,
  upsertTimeline
};
