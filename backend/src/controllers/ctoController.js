const prisma = require('../config/db');

// @desc    Get CTO Dashboard Metrics
// @route   GET /api/cto/dashboard-metrics
// @access  Private/CTO
const getDashboardMetrics = async (req, res, next) => {
  try {
    // Basic counts
    const totalStudents = await prisma.student.count();
    const totalTeams = await prisma.team.count();
    const totalMentors = await prisma.faculty.count();
    
    // Evaluate metrics
    const completedEvaluations = await prisma.submission.count({
      where: { status: 'APPROVED' }
    });
    
    const pendingEvaluations = await prisma.submission.count({
      where: { status: 'PENDING' }
    });

    // We can also fetch department-wise students if department data exists, 
    // or phase-wise breakdown
    const phaseStats = await prisma.phase.findMany({
      include: {
        _count: {
          select: { submissions: true }
        }
      }
    });

    res.json({
      students: { total: totalStudents },
      projects: { 
        total: totalTeams, 
        completed: completedEvaluations, 
        pending: pendingEvaluations 
      },
      mentors: { total: totalMentors },
      phaseProgress: phaseStats.map(p => ({
        phaseNumber: p.phaseNumber,
        name: p.name,
        submissions: p._count.submissions
      }))
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Student 360 Profile
// @route   GET /api/cto/student-profile/:rollNo
// @access  Private/CTO
const getStudentProfile = async (req, res, next) => {
  try {
    const { rollNo } = req.params;
    
    const student = await prisma.student.findUnique({
      where: { enrollmentNumber: rollNo },
      include: {
        user: {
          select: { name: true, email: true, isVerified: true }
        },
        teamMembers: {
          include: {
            team: {
              include: {
                pbl: true,
                leader: { include: { user: true } },
                mentor: { include: { user: true } },
                superMentor: { include: { user: true } },
                submissions: {
                  include: {
                    phase: true,
                    mentorGrades: true,
                    evaluatorGrades: true
                  }
                }
              }
            }
          }
        },
        interactionRecords: {
          include: {
            interaction: {
              include: { faculty: { include: { user: true } } }
            }
          }
        }
      }
    });

    if (!student) {
      res.status(404);
      throw new Error('Student not found');
    }

    res.json(student);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardMetrics,
  getStudentProfile
};
