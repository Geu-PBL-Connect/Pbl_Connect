const prisma = require('../config/db');

// @desc    Get CTO Dashboard Metrics
// @route   GET /api/cto/dashboard-metrics
// @access  Private/CTO
const getDashboardMetrics = async (req, res, next) => {
  try {
    const { pblId } = req.query;

    let totalStudents = 0;
    let totalTeams = 0;
    let studentsWithTeams = 0;
    let activePbls = 0;
    let teamsWithoutMentor = 0;
    let allEvaluations = [];
    let teams = [];

    const totalMentors = await prisma.faculty.count();
    activePbls = await prisma.pbl.count({
      where: { isArchived: false }
    });

    if (pblId) {
      const pbl = await prisma.pbl.findUnique({ where: { id: pblId } });
      if (pbl) {
        totalStudents = await prisma.student.count({ where: { semester: pbl.semester } });
      }
      
      totalTeams = await prisma.team.count({ where: { pblId } });
      
      studentsWithTeams = await prisma.teamMember.count({
        where: { status: 'APPROVED', team: { pblId } }
      });
      
      teamsWithoutMentor = await prisma.team.count({
        where: { mentorId: null, pblId }
      });

      teams = await prisma.team.findMany({
        where: { pblId },
        include: { submissions: { include: { mentorGrades: true } } }
      });

      allEvaluations = await prisma.evaluation.findMany({
        where: { phase: { pblId } }
      });
    } else {
      totalStudents = await prisma.student.count();
      totalTeams = await prisma.team.count();
      studentsWithTeams = await prisma.teamMember.count({ where: { status: 'APPROVED' } });
      teamsWithoutMentor = await prisma.team.count({ where: { mentorId: null } });
      teams = await prisma.team.findMany({
        include: { submissions: { include: { mentorGrades: true } } }
      });
      allEvaluations = await prisma.evaluation.findMany();
    }

    let mentorApprovedCount = 0;
    let mentorRejectedCount = 0;
    let totalTeacherMarks = 0;
    let teacherMarksCount = 0;

    let distribution = {
      'Excellent (≥80%)': 0,
      'Good (65-79%)': 0,
      'Average (50-64%)': 0,
      'Needs Improvement (<50%)': 0
    };

    teams.forEach(team => {
      if (team.superMentorStatus === 'APPROVED') mentorApprovedCount++;
      else if (team.superMentorStatus === 'REJECTED') mentorRejectedCount++;
    });

    allEvaluations.forEach(ev => {
      if (ev.totalMarks !== null && ev.totalMarks !== undefined) {
        totalTeacherMarks += ev.totalMarks;
        teacherMarksCount++;
        
        let pct = ev.totalMarks; // assuming totalMarks is the percentage or actual marks out of 100 for simplicity in this metric
        if (pct >= 80) distribution['Excellent (≥80%)']++;
        else if (pct >= 65) distribution['Good (65-79%)']++;
        else if (pct >= 50) distribution['Average (50-64%)']++;
        else distribution['Needs Improvement (<50%)']++;
      }
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
        pending: totalTeams - mentorApprovedCount - mentorRejectedCount,
        withoutMentor: teamsWithoutMentor
      },
      mentors: { total: totalMentors },
      pbls: { active: activePbls },
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
    const { pblId } = req.query;
    
    const whereClause = pblId ? { pblId } : {};

    const teams = await prisma.team.findMany({
      where: whereClause,
      include: {
        leader: { include: { user: { select: { name: true, email: true } } } },
        mentor: { include: { user: { select: { name: true, email: true } } } },
        members: {
          include: { student: { include: { user: { select: { name: true, email: true } } } } }
        },
        submissions: {
          include: { phase: true, mentorGrades: true }
        },
        examineeAssignments: {
          include: {
            evaluations: {
              include: { reviewerStudent: { include: { user: { select: { name: true } } } } }
            },
            phase: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Fetch all evaluations and group by student to attach to team
    const evaluationWhere = pblId ? { phase: { pblId } } : {};
    const allEvaluations = await prisma.evaluation.findMany({
      where: evaluationWhere,
      include: { phase: true, evaluator: { include: { user: { select: { name: true } } } } }
    });

    const formattedTeams = teams.map(team => {
      // Find evaluations for the leader of the team as a proxy for the team's evaluations
      const leaderEvaluations = allEvaluations.filter(ev => ev.studentId === team.leaderId);
      
      const mappedEvaluations = leaderEvaluations.map(ev => ({
        id: ev.id,
        phase: ev.phase,
        evaluator: ev.evaluator,
        remarks: ev.marksData?.remarks || '',
        marksObtained: ev.totalMarks,
        totalMarks: 100
      }));

      return {
        ...team,
        evaluations: mappedEvaluations
      };
    });

    res.json(formattedTeams);
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

// @desc    Get All PBLs for dropdown
// @route   GET /api/cto/pbl
// @access  Private/CTO
const getPbls = async (req, res, next) => {
  try {
    const pbls = await prisma.pbl.findMany({
      where: { isArchived: false },
      orderBy: { createdAt: 'desc' }
    });
    res.json(pbls);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardMetrics,
  getStudentProfile,
  getProjectsList,
  getPbls
};
