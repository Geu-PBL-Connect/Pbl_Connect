const prisma = require("../config/db");
const { generateSignedUrl } = require("../services/s3Service");

const viewFile = async (req, res, next) => {
  try {
    const { submissionId } = req.params;

    const submission = await prisma.submission.findUnique({
      where: {
        id: submissionId,
      },
      include: {
        team: {
          include: {
            members: true,
          },
        },
      },
    });

    if (!submission) {
      return res.status(404).json({
        message: "Submission not found",
      });
    }

    // ADMIN
    if (req.user.role !== "ADMIN" && req.user.role !== "SUPER_ADMIN") {
      // STUDENT
      if (req.user.role === "STUDENT") {
        const isMember = submission.team.members.some(
          (m) => m.studentId === req.user.studentProfileId,
        );

        if (!isMember) {
          return res.status(403).json({
            message: "Unauthorized",
          });
        }
      }

      // FACULTY
      if (req.user.role === "FACULTY") {
        if (submission.team.mentorId !== req.user.facultyProfileId) {
          return res.status(403).json({
            message: "Unauthorized",
          });
        }
      }
    }

    const signedUrl = await generateSignedUrl(submission.synopsisUrl);

    return res.json({
      url: signedUrl,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  viewFile,
};
