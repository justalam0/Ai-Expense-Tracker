const express = require("express");
const router = express.Router();
const {
  getReport,
  getSuggestions,
  getMonthlyReport,
  getMonthlyReportPDF,
  chatWithAgent,
  testAlerts,
  testWeeklySummary,
} = require("../controllers/agentController");
const auth = require("../middleware/authMiddleware");
const { aiLimiter, reportLimiter } = require("../middleware/rateLimiter");

router.get("/report", auth, aiLimiter, getReport);
router.get("/suggestions", auth, aiLimiter, getSuggestions);
router.get("/monthly-report", auth, reportLimiter, getMonthlyReport);
router.get("/monthly-report/pdf", auth, reportLimiter, getMonthlyReportPDF);
router.post("/chat", auth, aiLimiter, chatWithAgent);
router.get("/test-alerts", auth, aiLimiter, testAlerts);
router.get("/test-weekly-summary", auth, aiLimiter, testWeeklySummary);

module.exports = router;