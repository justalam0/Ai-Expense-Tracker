const { generateBudget, saveBudget } = require("../agent/budgetAgent");
const Budget = require("../models/Budget");

// Create/update a budget for the current month
exports.createBudget = async (req, res) => {
  try {
    const { monthlyIncome, savingsGoal, month } = req.body;

    if (!monthlyIncome || savingsGoal === undefined) {
      return res.status(400).json({ error: "monthlyIncome and savingsGoal are required" });
    }

    // Default to current year-month if not provided, e.g. "2026-07"
    const targetMonth = month || new Date().toISOString().slice(0, 7);

    const limits = await generateBudget(monthlyIncome, savingsGoal);
    const budget = await saveBudget(req.user.id, targetMonth, limits, savingsGoal);

    res.status(201).json(budget);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get the budget for a given month (defaults to current month)
exports.getBudget = async (req, res) => {
  try {
    const month = req.query.month || new Date().toISOString().slice(0, 7);

    const budget = await Budget.findOne({ user: req.user.id, month });

    if (!budget) {
      return res.status(404).json({ error: "No budget found for this month" });
    }

    res.json(budget);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};