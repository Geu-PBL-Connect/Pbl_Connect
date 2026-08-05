const express = require("express");
const router = express.Router();

const { protect } = require("../middlewares/auth");
const { viewFile, viewMoodleFile } = require("../controllers/fileController");

// Portal (JWT)
router.get("/view/:submissionId", protect, viewFile);

// Moodle (Signed URL)
router.get("/moodle/:submissionId/:signature", viewMoodleFile);

module.exports = router;
