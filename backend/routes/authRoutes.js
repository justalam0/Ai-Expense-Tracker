const express = require("express");
const router = express.Router();
const { signup, login, verifyOTP } = require("../controllers/authController");
const { loginLimiter, registerLimiter } = require("../middleware/rateLimiter");

router.post("/signup", registerLimiter, signup);
router.post("/verify-otp", registerLimiter, verifyOTP);
router.post("/login", loginLimiter, login);

module.exports = router;