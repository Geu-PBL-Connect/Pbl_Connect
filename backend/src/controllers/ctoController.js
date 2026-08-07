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

    const studentsWithTeams = await prisma.teamMember.count({
      where: { status: 'APPROVED' }
    });

    const teams = await prisma.team.findMany({
      include: {
        submissions: {
          include: { mentorGrades: true }
        },
        evaluations: true
      }
    });

    let mentorApprovedCount = 0;
    let mentorRejectedCount = 0;
    let totalMentorMarks = 0;
    let mentorMarksCount = 0;
    
    let totalTeacherMarks = 0;
    let teacherMarksCount = 0;

    let distribution = {
      'Excellent (≥80%)': 0,
      'Good (65-79%)': 0,
      'Average (50-64%)': 0,
      'Needs Improvement (<50%)': 0
    };

    teams.forEach(team => {
      // Mentor approval is based on superMentorStatus or Phase 1 mentor marks.
      // We'll use superMentorStatus for explicit approval
      if (team.superMentorStatus === 'APPROVED') mentorApprovedCount++;
      else if (team.superMentorStatus === 'REJECTED') mentorRejectedCount++;

      // Average Teacher Evaluation
      team.evaluations.forEach(ev => {
        if (ev.marksObtained !== null) {
          totalTeacherMarks += ev.marksObtained;
          teacherMarksCount++;
          
          let pct = (ev.marksObtained / (ev.totalMarks || 100)) * 100;
          if (pct >= 80) distribution['Excellent (≥80%)']++;
          else if (pct >= 65) distribution['Good (65-79%)']++;
          else if (pct >= 50) distribution['Average (50-64%)']++;
          else distribution['Needs Improvement (<50%)']++;
        }
      });
    });

    const avgTeacherEvaluation = teacherMarksCount > 0 
      ? parseFloat((totalTeacherMarks / teacherMarksCount).toFixed(2)) 
      : 0;

    res.json({
      students: { 
        total: totalStudents,
        withTeams: studentsWithTeams,
        withoutTeams: totalStudents - studentsWithTeams
      },
      projects: { 
        total: totalTeams, 
        mentorApproved: mentorApprovedCount,
        mentorRejected: mentorRejectedCount,
        pending: totalTeams - mentorApprovedCount - mentorRejectedCount
      },
      mentors: { total: totalMentors },
      evaluationStats: {
        averageScore: avgTeacherEvaluation,
        distribution: [
          { name: 'Excellent (≥80%)', value: distribution['Excellent (≥80%)'], color: '#10B981' },
          { name: 'Good (65-79%)', value: distribution['Good (65-79%)'], color: '#3B82F6' },
          { name: 'Average (50-64%)', value: distribution['Average (50-64%)'], color: '#F59E0B' },
          { name: 'Needs Imp (<50%)', value: distribution['Needs Improvement (<50%)'], color: '#EF4444' }
        ].filter(d => d.value > 0)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get All Projects List with details
// @route   GET /api/cto/projects
// @access  Private/CTO
const getProjectsList = async (req, res, next) => {
  try {
    const teams = await prisma.team.findMany({
      include: {
        leader: { include: { user: { select: { name: true, email: true } } } },
        mentor: { include: { user: { select: { name: true, email: true } } } },
        teamMembers: {
          include: { student: { include: { user: { select: { name: true, email: true } } } } }
        },
        submissions: {
          include: { phase: true, mentorGrades: true }
        },
        evaluations: {
          include: { evaluator: { include: { user: { select: { name: true } } } }, phase: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(teams);
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
  getStudentProfile,
  getProjectsList
};
