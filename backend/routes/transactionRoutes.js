const express = require("express");
const router = express.Router();
const {
  addTransaction,
  getTransactions,
  updateTransaction,
  deleteTransaction,
} = require("../controllers/transactionController");
const auth = require("../middleware/authMiddleware"); // assume you already have this
const { normalApiLimiter } = require("../middleware/rateLimiter");

router.use(normalApiLimiter);

router.post("/", auth, addTransaction);
router.get("/", auth, getTransactions);
router.put("/:id", auth, updateTransaction);
router.delete("/:id", auth, deleteTransaction);

module.exports = router;