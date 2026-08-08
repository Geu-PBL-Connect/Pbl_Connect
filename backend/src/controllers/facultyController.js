const prisma = require("../config/db"); // trigger restart
const crypto = require("crypto");
const {
  serializeMentorRemarks,
  parseMentorGradeRecord,
  attachParsedMentorGrades,
} = require("../utils/mentorGradeHelper");

// @desc    Get teams where faculty is Mentor
// @route   GET /api/faculty/mentor/teams
// @access  Private/Faculty
const getMentoredTeams = async (req, res, next) => {
  try {
    const facultyId = req.user.facultyProfileId;
    if (!facultyId) {
      res.status(403);
      throw new Error("Not registered as a faculty member.");
    }

    const teams = await prisma.team.findMany({
      where: { mentorId: facultyId },
      include: {
        pbl: {
          include: { phases: true, pblFaculties: { where: { facultyId } } },
        },
        leader: { include: { user: true } },
        superMentor: { include: { user: true } },
        members: { include: { student: { include: { user: true } } } },
        submissions: { include: { mentorGrades: true } },
        examineeAssignments: { include: { evaluations: true } },
      },
    });

    res.json(attachParsedMentorGrades(teams));
  } catch (error) {
    next(error);
  }
};

// @desc    Get teams where faculty is Evaluator
// @route   GET /api/faculty/evaluator/teams
// @access  Private/Faculty
const getEvaluatedTeams = async (req, res, next) => {
  try {
    const facultyId = req.user.facultyProfileId;
    if (!facultyId) {
      res.status(403);
      throw new Error("Not registered as a faculty member.");
    }

    const teams = await prisma.team.findMany({
      where: {
        phaseEvaluators: {
          some: {
            evaluatorId: facultyId,
          },
        },
      },
      include: {
        pbl: {
          include: { phases: true, pblFaculties: { where: { facultyId } } },
        },
        leader: { include: { user: true } },
        members: { include: { student: { include: { user: true } } } },
        submissions: {
          include: { mentorGrades: { orderBy: { gradedAt: "desc" } } },
        },
        phaseEvaluators: {
          where: { evaluatorId: facultyId },
        },
        examineeAssignments: { include: { evaluations: true } },
      },
    });

    res.json(attachParsedMentorGrades(teams));
  } catch (error) {
    next(error);
  }
};

const { syncGradeToMoodle, syncTeamToMoodleGroup } = require("../services/moodleService");

// Helper to push grade to Moodle for all team members
const pushGradeToMoodleForTeam = async (teamId, phaseId, grade, feedbackText, submissionId) => {
  try {
    const phase = await prisma.phase.findUnique({
      where: { id: phaseId },
    });
    if (!phase?.moodleAssignmentId) return;

    const teamMembers = await prisma.teamMember.findMany({
      where: { teamId },
      include: { student: true },
    });

    let targetSubmission = null;
    if (submissionId) {
      targetSubmission = await prisma.submission.findUnique({ where: { id: submissionId } });
    } else {
      targetSubmission = await prisma.submission.findFirst({
        where: { teamId, phaseId },
        orderBy: { submittedAt: "desc" },
      });
    }

    const team = await prisma.team.findUnique({ where: { id: teamId } });
    let feedback = feedbackText || (grade === 1 ? "Approved" : "Rejected");
    if (team?.teamName) {
      feedback = `[Team: ${team.teamName}]\n${feedback}`;
    }

    if (targetSubmission?.synopsisUrl) {
      const signature = crypto
        .createHmac("sha256", process.env.JWT_SECRET || "default_secret")
        .update(targetSubmission.id)
        .digest("hex");

      const portalUrl =
        `${process.env.BACKEND_URL || ""}/api/files/moodle/` +
        `${targetSubmission.id}/${signature}`;

      feedback += `\n\nSubmitted File (PBL Portal): ${portalUrl}`;
    }

    if (team?.teamName) {
      const moodleIds = teamMembers
        .map(m => m.student?.moodleId || m.student?.enrollmentNumber)
        .filter(Boolean);
      await syncTeamToMoodleGroup(team.teamName, phase.moodleAssignmentId, moodleIds).catch(err => 
        console.error("Faculty moodle group sync err:", err)
      );
    }

    for (const member of teamMembers) {
      const studentProfile = member.student;
      const moodleIdToUse =
        studentProfile?.moodleId || studentProfile?.enrollmentNumber;

      if (moodleIdToUse) {
        syncGradeToMoodle(
          moodleIdToUse,
          phase.moodleAssignmentId,
          grade,
          feedback
        ).catch((err) => {
          console.error(
            `Non-blocking Moodle grade sync error for ${moodleIdToUse}:`,
            err
          );
        });
      }
    }
  } catch (err) {
    console.error("pushGradeToMoodleForTeam error:", err);
  }
};

// @desc    Grade a submission as a Mentor
// @route   POST /api/faculty/mentor/grade/:submissionId
// @access  Private/Faculty
const mentorGradeSubmission = async (req, res, next) => {
  try {
    const { submissionId } = req.params;
    const { grade, remarks, studentMarks } = req.body; // grade: 0 or 1, studentMarks: { [studentId]: number }
    const facultyId = req.user.facultyProfileId;

    if (grade !== 0 && grade !== 1) {
      res.status(400);
      throw new Error("Grade must be 0 or 1");
    }

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: { team: { include: { members: true } } },
    });

    if (!submission || submission.team.mentorId !== facultyId) {
      res.status(403);
      throw new Error("Not authorized to grade this submission.");
    }

    // Validate and sanitize studentMarks (each student grade should be 0 to 10)
    let sanitizedStudentMarks = {};
    if (studentMarks && typeof studentMarks === "object") {
      Object.keys(studentMarks).forEach((sId) => {
        const val = parseFloat(studentMarks[sId]);
        if (!isNaN(val)) {
          sanitizedStudentMarks[sId] = Math.min(10, Math.max(0, parseFloat(val.toFixed(2))));
        }
      });
    }

    const serializedRemarks = serializeMentorRemarks(remarks, sanitizedStudentMarks);

    const mentorGrade = await prisma.mentorGrade.upsert({
      where: {
        submissionId_mentorId: {
          submissionId,
          mentorId: facultyId,
        },
      },
      update: { grade, remarks: serializedRemarks, gradedAt: new Date() },
      create: {
        submissionId,
        mentorId: facultyId,
        grade,
        remarks: serializedRemarks,
      },
    });

    const parsedMentorGrade = parseMentorGradeRecord(mentorGrade);

    if (grade === 0) {
      // Mentor rejected the project/synopsis:
      // 1. Do NOT forward to Super Mentor.
      // 2. Mark team rejected by mentor.
      // 3. Immediately push Grade 0 to LMS with mentor's remarks.
      // 4. Mark submission as GRADED so team can see rejection & submit new idea.
      await prisma.team.update({
        where: { id: submission.teamId },
        data: {
          superMentorStatus: "REJECTED",
          superMentorFeedback: `Rejected by Mentor: ${parsedMentorGrade.cleanRemarks || "Project idea/synopsis needs revision"}`,
          superMentorReviewedAt: new Date(),
        },
      });

      await prisma.submission.update({
        where: { id: submissionId },
        data: { status: "GRADED" },
      });

      pushGradeToMoodleForTeam(
        submission.teamId,
        submission.phaseId,
        0,
        parsedMentorGrade.cleanRemarks || "Rejected by Mentor",
        submissionId
      );

      return res.json({
        message: "Submission rejected by mentor. Grade 0 synced to LMS. Team can now submit a new idea.",
        mentorGrade: parsedMentorGrade,
      });
    } else {
      // Mentor approved the project (Grade 1):
      // 1. Do NOT sync to LMS yet!
      // 2. Forward to Super Mentor for quality check.
      // 3. Mark team superMentorStatus = PENDING.
      await prisma.team.update({
        where: { id: submission.teamId },
        data: {
          superMentorStatus: "PENDING",
          superMentorFeedback: null,
          superMentorReviewedAt: null,
        },
      });

      await prisma.submission.update({
        where: { id: submissionId },
        data: { status: "AWAITING_SUPER_MENTOR" },
      });

      return res.json({
        message: "Submission approved by mentor and forwarded to Super Mentor for validation.",
        mentorGrade: parsedMentorGrade,
      });
    }
  } catch (error) {
    next(error);
  }
};

// Helper to enforce Evaluation Timelines
const checkTimelineAccess = async (phaseId, isEdit = false) => {
  const timeline = await prisma.evaluationTimeline.findUnique({ where: { phaseId } });
  if (!timeline) return; // No timeline defined, open by default

  const now = new Date();
  if (timeline.isLocked) {
    const err = new Error("Grading is currently locked by the Administrator.");
    err.status = 403;
    throw err;
  }

  const end = (isEdit && timeline.editEndDate) ? timeline.editEndDate : timeline.endDate;
  if (now < timeline.startDate || now > end) {
    const err = new Error(isEdit ? "Grade editing timeline has expired." : "Grading timeline has expired or has not yet started.");
    err.status = 403;
    throw err;
  }
};

// @desc    Evaluate a student's phase submission as an Evaluator
// @route   POST /api/faculty/evaluator/evaluate/:phaseId/:studentId
// @access  Private/Faculty
const evaluateStudent = async (req, res, next) => {
  try {
    const { phaseId, studentId } = req.params;
    const { marksData } = req.body;
    const facultyId = req.user.facultyProfileId;

    if (!marksData) {
      res.status(400);
      throw new Error("Marks data is required.");
    }

    // Calculate total marks from the JSON marksData object
    let totalMarks = 0;
    Object.values(marksData).forEach((mark) => {
      if (mark !== "AB" && !isNaN(Number(mark))) {
        totalMarks += Number(mark);
      }
    });

    const existingEval = await prisma.evaluation.findUnique({
      where: {
        phaseId_studentId_evaluatorId: { phaseId, studentId, evaluatorId: facultyId },
      },
    });

    await checkTimelineAccess(phaseId, !!existingEval);

    const evaluation = await prisma.evaluation.upsert({
      where: {
        phaseId_studentId_evaluatorId: {
          phaseId,
          studentId,
          evaluatorId: facultyId,
        },
      },
      update: { marksData, totalMarks, evaluatedAt: new Date() },
      create: {
        phaseId,
        studentId,
        evaluatorId: facultyId,
        marksData,
        totalMarks,
      },
    });

    try {
      await prisma.activityLog.create({
        data: {
          entityType: 'EVALUATION',
          entityId: evaluation.id,
          action: existingEval ? 'GRADE_EDITED' : 'GRADED',
          userId: req.user.id,
          metadata: { 
            studentId, 
            phaseId,
            totalMarks
          }
        }
      });
    } catch (logErr) {
      console.error('Failed to log evaluation activity:', logErr);
    }

    res.json({ message: "Evaluation submitted successfully", evaluation });
  } catch (error) {
    next(error);
  }
};

const getTeamEvaluations = async (req, res, next) => {
  try {
    const { phaseId, teamId } = req.params;
    const facultyId = req.user.facultyProfileId;

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { members: true },
    });

    if (!team) return res.json([]);

    const studentIds = team.members.map((m) => m.studentId);

    const evaluations = await prisma.evaluation.findMany({
      where: {
        phaseId,
        evaluatorId: facultyId,
        studentId: { in: studentIds },
      },
    });

    res.json(evaluations);
  } catch (error) {
    next(error);
  }
};

const finishTeamEvaluation = async (req, res, next) => {
  try {
    const { phaseId, teamId } = req.params;
    const { remarks, projectLevel } = req.body;
    const facultyId = req.user.facultyProfileId;

    const teamPhaseEvaluator = await prisma.teamPhaseEvaluator.findUnique({
      where: {
        teamId_phaseId: {
          teamId,
          phaseId,
        },
      },
    });

    if (!teamPhaseEvaluator || teamPhaseEvaluator.evaluatorId !== facultyId) {
      res.status(403);
      throw new Error("Not authorized to evaluate this team phase.");
    }

    const isEdit = teamPhaseEvaluator.status === "EVALUATED";
    await checkTimelineAccess(phaseId, isEdit);

    const updated = await prisma.teamPhaseEvaluator.update({
      where: { id: teamPhaseEvaluator.id },
      data: {
        status: "EVALUATED",
        remarks,
      },
    });

    if (projectLevel) {
      await prisma.team.update({
        where: { id: teamId },
        data: { projectLevel },
      });
    }

    try {
      await prisma.activityLog.create({
        data: {
          entityType: 'EVALUATION',
          entityId: updated.id,
          action: isEdit ? 'TEAM_GRADE_EDITED' : 'TEAM_GRADED',
          userId: req.user.id,
          metadata: { 
            teamId, 
            phaseId,
            projectLevel: projectLevel || null
          }
        }
      });
    } catch (logErr) {
      console.error('Failed to log team evaluation finish:', logErr);
    }

    res.json({ message: "Team evaluation finished", evaluationState: updated });
  } catch (error) {
    next(error);
  }
};

const getPreviousPhaseRemarks = async (req, res, next) => {
  try {
    const { phaseNumber, teamId } = req.params;
    const currentPhaseNumber = parseInt(phaseNumber);

    if (currentPhaseNumber <= 1) {
      return res.json({ remarks: null });
    }

    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team) return res.json({ remarks: null });

    const previousPhase = await prisma.phase.findFirst({
      where: {
        pblId: team.pblId,
        phaseNumber: currentPhaseNumber - 1,
      },
    });

    if (!previousPhase) return res.json({ remarks: null });

    const teamPhaseEvaluator = await prisma.teamPhaseEvaluator.findUnique({
      where: {
        teamId_phaseId: {
          teamId,
          phaseId: previousPhase.id,
        },
      },
    });

    res.json({ remarks: teamPhaseEvaluator?.remarks || null });
  } catch (error) {
    next(error);
  }
};

const getPendingReevaluations = async (req, res, next) => {
  try {
    const facultyId = req.user.facultyProfileId;
    const reevaluations = await prisma.reevaluationAssignment.findMany({
      where: {
        evaluatorId: facultyId,
        status: "PENDING",
      },
      include: {
        student: {
          include: {
            user: true,
            teamMembers: {
              include: { team: { include: { pbl: true } } },
            },
          },
        },
        phase: true,
      },
    });
    res.json(reevaluations);
  } catch (error) {
    next(error);
  }
};

const submitReevaluationMarks = async (req, res, next) => {
  try {
    const facultyId = req.user.facultyProfileId;
    const { studentId, phaseId, marksData, totalMarks } = req.body;

    const assignment = await prisma.reevaluationAssignment.findUnique({
      where: { studentId_phaseId: { studentId, phaseId } },
    });

    if (!assignment || assignment.evaluatorId !== facultyId) {
      res.status(403);
      throw new Error("Not authorized to re-evaluate this student.");
    }

    // Upsert Evaluation
    const evaluation = await prisma.evaluation.upsert({
      where: {
        phaseId_studentId_evaluatorId: {
          phaseId,
          studentId,
          evaluatorId: facultyId,
        },
      },
      update: { marksData, totalMarks },
      create: {
        phaseId,
        studentId,
        evaluatorId: facultyId,
        marksData,
        totalMarks,
      },
    });

    // Update ReevaluationAssignment status
    await prisma.reevaluationAssignment.update({
      where: { id: assignment.id },
      data: { status: "EVALUATED" },
    });

    res.json({ message: "Re-evaluation marks saved successfully", evaluation });
  } catch (error) {
    next(error);
  }
};

// @desc    Log a mentor interaction/visit
// @route   POST /api/faculty/mentor/team/:teamId/interaction
// @access  Private/Faculty (Mentor only)
const logInteraction = async (req, res, next) => {
  try {
    const facultyId = req.user.facultyProfileId;
    const { teamId } = req.params;
    const { records } = req.body; // Array of { studentId, isPresent, remark }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { interactions: true },
    });

    if (!team) throw new Error("Team not found");
    if (team.mentorId !== facultyId)
      throw new Error("Not authorized to log interactions for this team.");

    if (team.interactions.length >= 8) {
      throw new Error(
        "Maximum number of interactions (8) has already been reached for this team.",
      );
    }

    const visitNumber = team.interactions.length + 1;

    const interaction = await prisma.interaction.create({
      data: {
        teamId,
        mentorId: facultyId,
        visitNumber,
        studentRecords: {
          create: records.map((r) => ({
            studentId: r.studentId,
            isPresent: r.isPresent,
            remark: r.remark || null,
          })),
        },
      },
      include: { studentRecords: true },
    });

    res
      .status(201)
      .json({ message: "Interaction logged successfully", interaction });
  } catch (error) {
    next(error);
  }
};

// @desc    Get interactions for a team
// @route   GET /api/faculty/team/:teamId/interactions (also exposed in admin routes)
// @access  Private/Faculty or Admin
const getInteractions = async (req, res, next) => {
  try {
    const { teamId } = req.params;

    const interactions = await prisma.interaction.findMany({
      where: { teamId },
      orderBy: { visitNumber: "asc" },
      include: {
        mentor: { include: { user: true } },
        studentRecords: { include: { student: { include: { user: true } } } },
      },
    });

    res.json(interactions);
  } catch (error) {
    next(error);
  }
};

// @desc    Update Faculty Venue and Schedule
// @route   PUT /api/faculty/venue
// @access  Private/Faculty
const updateVenue = async (req, res, next) => {
  try {
    const facultyId = req.user.facultyProfileId;
    const { venue, availableDate, availableTime } = req.body;
    if (!facultyId) {
      res.status(403);
      throw new Error("Not registered as a faculty member.");
    }

    const updated = await prisma.faculty.update({
      where: { id: facultyId },
      data: { venue, availableDate, availableTime },
    });

    res.json({ message: "Schedule updated successfully", venue: updated.venue, availableDate: updated.availableDate, availableTime: updated.availableTime });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Faculty Venue and Schedule
// @route   GET /api/faculty/venue
// @access  Private/Faculty
const getVenue = async (req, res, next) => {
  try {
    const facultyId = req.user.facultyProfileId;
    if (!facultyId) {
      res.status(403);
      throw new Error("Not registered as a faculty member.");
    }

    const faculty = await prisma.faculty.findUnique({
      where: { id: facultyId },
      select: { venue: true, availableDate: true, availableTime: true },
    });

    res.json({ venue: faculty?.venue || "", availableDate: faculty?.availableDate || null, availableTime: faculty?.availableTime || "" });
  } catch (error) {
    next(error);
  }
};

// @desc    Get teams assigned to this faculty as Super Mentor
// @route   GET /api/faculty/super-mentor/teams
// @access  Private/Faculty
const getSuperMentoredTeams = async (req, res, next) => {
  try {
    const facultyId = req.user.facultyProfileId;
    if (!facultyId) {
      res.status(403);
      throw new Error("Not registered as a faculty member.");
    }

    const teams = await prisma.team.findMany({
      where: { superMentorId: facultyId },
      include: {
        pbl: {
          include: {
            phases: true,
            pblFaculties: { include: { faculty: { include: { user: true } } } },
          },
        },
        leader: { include: { user: true } },
        mentor: { include: { user: true, pblFaculties: true } },
        members: {
          include: {
            student: { include: { user: true } },
          },
        },
        submissions: {
          include: {
            mentorGrades: { orderBy: { gradedAt: "desc" } },
          },
          orderBy: { submittedAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(attachParsedMentorGrades(teams));
  } catch (error) {
    next(error);
  }
};

// @desc    Approve or Reject a team project as Super Mentor
// @route   POST /api/faculty/super-mentor/review/:teamId
// @access  Private/Faculty
const reviewSuperMentorTeam = async (req, res, next) => {
  try {
    const { teamId } = req.params;
    const { action, feedback } = req.body; // action: 'APPROVE' or 'REJECT'
    const facultyId = req.user.facultyProfileId;

    if (!["APPROVE", "REJECT"].includes(action)) {
      res.status(400);
      throw new Error("Invalid action. Must be 'APPROVE' or 'REJECT'.");
    }

    if (action === "REJECT" && (!feedback || !feedback.trim())) {
      res.status(400);
      throw new Error("Feedback/remarks are mandatory when rejecting a project.");
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        submissions: {
          include: { mentorGrades: true },
          orderBy: { submittedAt: "desc" },
        },
      },
    });

    if (!team) {
      res.status(404);
      throw new Error("Team not found.");
    }

    if (team.superMentorId !== facultyId) {
      res.status(403);
      throw new Error("You are not assigned as the Super Mentor for this team.");
    }

    const latestSubmission = team.submissions?.[0];

    if (action === "APPROVE") {
      // Super Mentor APPROVES:
      // 1. Update team status to APPROVED
      // 2. Set submission status to GRADED
      // 3. Automatically sync Grade 1 to LMS (Moodle)
      const updatedTeam = await prisma.team.update({
        where: { id: teamId },
        data: {
          superMentorStatus: "APPROVED",
          superMentorFeedback: feedback ? feedback.trim() : null,
          superMentorReviewedAt: new Date(),
        },
        include: {
          pbl: true,
          leader: { include: { user: true } },
          mentor: { include: { user: true } },
          members: { include: { student: { include: { user: true } } } },
          submissions: { include: { mentorGrades: true } },
        },
      });

      if (latestSubmission) {
        await prisma.submission.update({
          where: { id: latestSubmission.id },
          data: { status: "GRADED" },
        });

        // Push Grade 1 to LMS
        const parsedGrade = latestSubmission.mentorGrades?.[0] ? parseMentorGradeRecord(latestSubmission.mentorGrades[0]) : null;
        const mentorRemark = parsedGrade?.cleanRemarks;
        const moodleFeedback = feedback?.trim()
          ? `Approved by Mentor & Super Mentor. Super Mentor Note: ${feedback.trim()}`
          : (mentorRemark ? `Approved by Mentor: ${mentorRemark}` : "Approved by Mentor & Super Mentor");

        pushGradeToMoodleForTeam(
          team.id,
          latestSubmission.phaseId,
          1,
          moodleFeedback,
          latestSubmission.id
        );
      }

      return res.json({
        message: "Project approved by Super Mentor! Grade 1 synced to LMS.",
        team: updatedTeam,
      });
    } else {
      // Super Mentor REJECTS:
      // 1. Update team status to REJECTED with feedback
      // 2. Update mentor grade to 0
      // 3. Automatically sync Grade 0 to LMS (Moodle)
      // 4. Mark submission as GRADED so team can resubmit new idea
      const updatedTeam = await prisma.team.update({
        where: { id: teamId },
        data: {
          superMentorStatus: "REJECTED",
          superMentorFeedback: feedback.trim(),
          superMentorReviewedAt: new Date(),
        },
        include: {
          pbl: true,
          leader: { include: { user: true } },
          mentor: { include: { user: true } },
          members: { include: { student: { include: { user: true } } } },
          submissions: { include: { mentorGrades: true } },
        },
      });

      if (latestSubmission) {
        if (team.mentorId) {
          const existingGrade = latestSubmission.mentorGrades?.[0];
          const parsedExisting = parseMentorGradeRecord(existingGrade);
          const studentMarksToKeep = parsedExisting?.studentMarks || {};

          const serializedRemarks = serializeMentorRemarks(
            `[Super Mentor Rejected]: ${feedback.trim()}`,
            studentMarksToKeep
          );

          await prisma.mentorGrade.upsert({
            where: {
              submissionId_mentorId: {
                submissionId: latestSubmission.id,
                mentorId: team.mentorId,
              },
            },
            update: {
              grade: 0,
              remarks: serializedRemarks,
              gradedAt: new Date(),
            },
            create: {
              submissionId: latestSubmission.id,
              mentorId: team.mentorId,
              grade: 0,
              remarks: serializedRemarks,
            },
          });
        }

        await prisma.submission.update({
          where: { id: latestSubmission.id },
          data: { status: "GRADED" },
        });

        // Push Grade 0 to LMS
        pushGradeToMoodleForTeam(
          team.id,
          latestSubmission.phaseId,
          0,
          `Rejected by Super Mentor: ${feedback.trim()}`,
          latestSubmission.id
        );
      }

      return res.json({
        message: "Project rejected by Super Mentor. Grade 0 synced to LMS. Team can now submit a new idea.",
        team: updatedTeam,
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Check if current faculty has any assigned Super Mentor teams
// @route   GET /api/faculty/super-mentor/check-role
// @access  Private/Faculty
const checkSuperMentorRole = async (req, res, next) => {
  try {
    const facultyId = req.user.facultyProfileId;
    if (!facultyId) {
      return res.json({ isSuperMentor: false, assignedCount: 0 });
    }

    const count = await prisma.team.count({
      where: { superMentorId: facultyId },
    });

    res.json({ isSuperMentor: count > 0, assignedCount: count });
  } catch (error) {
    next(error);
  }
};

const getTimelineWarnings = async (req, res, next) => {
  try {
    const facultyId = req.user.facultyProfileId;
    const now = new Date();
    // 4 days from now
    const fourDaysFromNow = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000);

    // Get active timelines ending soon (within 4 days) and not locked
    const timelines = await prisma.evaluationTimeline.findMany({
      where: {
        isLocked: false,
        endDate: {
          gte: now,
          lte: fourDaysFromNow,
        },
      },
      include: {
        phase: {
          include: { pbl: true }
        }
      }
    });

    if (timelines.length === 0) {
      return res.json({ warnings: [] });
    }

    const phaseIds = timelines.map(t => t.phaseId);

    // Find if the faculty has pending evaluations for these phases
    const pendingEvaluations = await prisma.teamPhaseEvaluator.findMany({
      where: {
        evaluatorId: facultyId,
        phaseId: { in: phaseIds },
        status: { in: ['PENDING', 'ASSIGNED'] } // 'ASSIGNED' is sometimes used instead of 'PENDING' based on other controllers. Actually, let's use 'PENDING' or status not equals 'EVALUATED'
      },
      include: {
        team: { select: { teamIdFormatted: true } }
      }
    });

    // We only care about those that are NOT 'EVALUATED'
    const actuallyPending = pendingEvaluations.filter(pe => pe.status !== 'EVALUATED');

    if (actuallyPending.length === 0) {
      return res.json({ warnings: [] });
    }

    // Group pending evaluations by phase
    const warnings = timelines.map(t => {
      const pendingForPhase = actuallyPending.filter(pe => pe.phaseId === t.phaseId);
      if (pendingForPhase.length > 0) {
        return {
          phaseId: t.phaseId,
          phaseNumber: t.phase.phaseNumber,
          pblSubject: t.phase.pbl.subject,
          endDate: t.endDate,
          pendingTeamsCount: pendingForPhase.length,
          pendingTeams: pendingForPhase.map(p => p.team.teamIdFormatted)
        };
      }
      return null;
    }).filter(w => w !== null);

    res.json({ warnings });
  } catch (error) {
    next(error);
  }
};
const exportEvaluatorMarks = async (req, res, next) => {
  try {
    const facultyId = req.user.facultyProfileId;
    const { phaseId } = req.params;

    const evaluations = await prisma.evaluation.findMany({
      where: {
        evaluatorId: facultyId,
        phaseId: phaseId
      },
      include: {
        student: true,
        phase: {
          include: { pbl: true }
        }
      }
    });

    const teams = await prisma.team.findMany({
      where: {
        members: {
          some: {
            id: { in: evaluations.map(e => e.studentId) }
          }
        }
      },
      include: { members: true }
    });

    const result = evaluations.map(ev => {
      const student = ev.student;
      const team = teams.find(t => t.members.some(m => m.id === student.id));
      
      return {
        team: team?.teamIdFormatted || 'N/A',
        studentName: student.name,
        rollNo: student.enrollmentNumber,
        marksData: ev.marksData,
        totalMarks: ev.totalMarks,
        evaluatedAt: ev.evaluatedAt
      };
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};
