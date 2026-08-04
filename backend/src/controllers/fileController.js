const prisma = require("../config/db");
const crypto = require("crypto");
const { generateSignedUrl } = require("../services/s3Service");

const SECRET = process.env.JWT_SECRET;

// Portal (JWT)
const viewFile = async (req, res, next) => {
  try {
    const { submissionId } = req.params;

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        team: {
          include: {
            members: true,
          },
        },
      },
    });

    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    // ADMIN
    if (req.user.role !== "ADMIN" && req.user.role !== "SUPER_ADMIN") {
      // STUDENT
      if (req.user.role === "STUDENT") {
        const isMember = submission.team.members.some(
          (m) => m.studentId === req.user.studentProfileId,
        );

        if (!isMember) {
          return res.status(403).json({ message: "Unauthorized" });
        }
      }

      // FACULTY
      if (req.user.role === "FACULTY") {
        if (submission.team.mentorId !== req.user.facultyProfileId) {
          return res.status(403).json({ message: "Unauthorized" });
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

// Moodle (No JWT)
const viewMoodleFile = async (req, res) => {
  try {
    const { submissionId, signature } = req.params;

    const expected = crypto
      .createHmac("sha256", SECRET)
      .update(submissionId)
      .digest("hex");

    if (signature !== expected) {
      return res.status(403).json({
        message: "Invalid signature",
      });
    }

    const submission = await prisma.submission.findUnique({
      where: {
        id: submissionId,
      },
    });

    if (!submission) {
      return res.status(404).json({
        message: "Submission not found",
      });
    }

    const signedUrl = await generateSignedUrl(submission.synopsisUrl);

    return res.redirect(signedUrl);
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Server Error",
    });
  }
};

module.exports = {
  viewFile,
  viewMoodleFile,
};
