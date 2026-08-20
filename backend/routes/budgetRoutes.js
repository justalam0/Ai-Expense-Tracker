const express = require("express");
const router = express.Router();
const { createBudget, getBudget } = require("../controllers/budgetController");
const auth = require("../middleware/authMiddleware");
const { normalApiLimiter } = require("../middleware/rateLimiter");

router.use(normalApiLimiter);

router.post("/", auth, createBudget);
router.get("/", auth, getBudget);

module.exports = router;