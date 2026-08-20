const { askAI } = require("../services/aiService");
const Budget = require("../models/Budget");

/**
 * Uses AI to split monthly income into a category-wise budget,
 * respecting the user's savings goal.
 */
async function generateBudget(monthlyIncome, savingsGoal) {
  const availableToSpend = monthlyIncome - savingsGoal;

  const prompt = `
You are a personal budgeting assistant.

User's monthly income: ₹${monthlyIncome}
Desired monthly savings: ₹${savingsGoal}
Amount available to allocate across expense categories: ₹${availableToSpend}

Split the available amount across these categories:
Food, Travel, Shopping, Bills, Medical, Entertainment, Rent, Groceries, Other

Return ONLY valid JSON in this exact format, nothing else:
{
  "Food": 0,
  "Travel": 0,
  "Shopping": 0,
  "Bills": 0,
  "Medical": 0,
  "Entertainment": 0,
  "Rent": 0,
  "Groceries": 0,
  "Other": 0
}

The values must be numbers (not strings) and must sum up to approximately ₹${availableToSpend}.
`;

  const result = await askAI(prompt, true); // expect JSON

  if (!result) {
    throw new Error("AI failed to generate budget");
  }

  return result;
}

/**
 * Saves (or updates) a budget for a given user + month
 */
async function saveBudget(userId, month, limits, savingsGoal) {
  const budget = await Budget.findOneAndUpdate(
    { user: userId, month },
    { user: userId, month, limits, savingsGoal },
    { upsert: true, new: true }
  );

  return budget;
}

/**
 * Checks if adding this expense would exceed the category's budget limit.
 * Returns null if no budget exists yet, or if within limit.
 * Returns a warning object if exceeded.
 */
async function checkOverspend(userId, month, category, currentCategoryTotal) {
  const budget = await Budget.findOne({ user: userId, month });

  if (!budget || !budget.limits || !budget.limits.get(category)) {
    return null; // no budget set for this category, nothing to check
  }

  const limit = budget.limits.get(category);

  if (currentCategoryTotal > limit) {
    return {
      category,
      limit,
      spent: currentCategoryTotal,
      exceededBy: currentCategoryTotal - limit,
      message: `⚠️ ${category} budget exceeded by ₹${currentCategoryTotal - limit}.`,
    };
  }

  return null;
}

module.exports = { generateBudget, saveBudget, checkOverspend };