const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const {
  login,
  requestOtp,
  verifyOtp,
  createPassword,
  forceChangePassword,
} = require("../controllers/authController");
const { protect } = require("../middlewares/auth");

// Strict Rate Limiting for Auth to prevent brute-force attacks
const authLimiter = rateLimit({
  windowMs: 5 * 1000, // 5 seconds
  max: 10, // limit each IP to 10 requests per windowMs for login/otp
  message: {
    message:
      "Too many login attempts from this IP, please try again after 5 seconds.",
  },
});

router.post("/login", authLimiter, login);
router.post("/request-otp", authLimiter, requestOtp);
router.post("/verify-otp", authLimiter, verifyOtp);
router.post("/create-password", authLimiter, createPassword);
router.post("/force-change-password", protect, forceChangePassword);

module.exports = router;
