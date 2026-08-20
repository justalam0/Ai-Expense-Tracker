const Transaction = require("../models/Transaction");
const { askAI } = require("../services/aiService");

/**
 * Returns category-wise spending breakdown with percentages
 * e.g. [{ category: "Food", total: 12000, percentage: 28.5 }, ...]
 */
async function getCategoryBreakdown(userId) {
  const results = await Transaction.aggregate([
    { $match: { user: userId, type: "expense" } },
    { $group: { _id: "$category", total: { $sum: "$amount" } } },
    { $sort: { total: -1 } },
  ]);

  const grandTotal = results.reduce((sum, r) => sum + r.total, 0);

  return results.map((r) => ({
    category: r._id,
    total: r.total,
    percentage: grandTotal > 0 ? Number(((r.total / grandTotal) * 100).toFixed(1)) : 0,
  }));
}

/**
 * Returns total income and total expense for the user (all-time)
 */
async function getTotals(userId) {
  const results = await Transaction.aggregate([
    { $match: { user: userId } },
    { $group: { _id: "$type", total: { $sum: "$amount" } } },
  ]);

  const totals = { income: 0, expense: 0 };
  results.forEach((r) => {
    totals[r._id] = r.total;
  });

  return totals;
}

/**
 * Returns last N months' expense totals grouped by year-month
 * e.g. [{ month: "2026-02", total: 22000 }, { month: "2026-03", total: 24500 }, ...]
 */
async function getMonthlyTotals(userId, months = 6) {
  const results = await Transaction.aggregate([
    { $match: { user: userId, type: "expense" } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m", date: "$date" } },
        total: { $sum: "$amount" },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const formatted = results.map((r) => ({ month: r._id, total: r.total }));
  return formatted.slice(-months); // keep only the most recent N months
}

/**
 * Predicts next month's expense using Simple Moving Average
 * Takes the last 3 months (or fewer if not available) and averages them
 */
function predictNextMonth(monthlyTotals) {
  if (!monthlyTotals || monthlyTotals.length === 0) {
    return { predictedAmount: 0, basis: "no_data" };
  }

  const recent = monthlyTotals.slice(-3); // last up to 3 months
  const sum = recent.reduce((acc, m) => acc + m.total, 0);
  const average = sum / recent.length;

  return {
    predictedAmount: Math.round(average),
    basis: `average_of_last_${recent.length}_months`,
  };
}

/**
 * Uses AI to turn raw numbers into natural language insights
 */
async function generateInsights(breakdown, totals, prediction) {
  const prompt = `
You are a personal finance analyst.

Here is the user's spending data:

Category breakdown:
${breakdown.map((b) => `${b.category}: ₹${b.total} (${b.percentage}%)`).join("\n")}

Total Income: ₹${totals.income}
Total Expense: ₹${totals.expense}
Predicted next month expense: ₹${prediction.predictedAmount}

Write 3-5 short, clear bullet-point insights about their spending habits,
in plain simple English. Do not use markdown formatting, just plain sentences separated by newlines.
`;

  const insights = await askAI(prompt, false); // false = plain text, not JSON
  return insights;
}

module.exports = {
  getCategoryBreakdown,
  getTotals,
  getMonthlyTotals,
  predictNextMonth,
  generateInsights,
};