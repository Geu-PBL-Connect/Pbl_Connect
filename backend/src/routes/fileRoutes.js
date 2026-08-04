const express = require("express");
const router = express.Router();

const { protect } = require("../middlewares/auth");
const { viewFile } = require("../controllers/fileController");

router.get("/view/:submissionId", protect, viewFile);

module.exports = router;
