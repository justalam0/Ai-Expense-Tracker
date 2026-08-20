const mongoose = require("mongoose");
const {
  getCategoryBreakdown,
  getTotals,
  getMonthlyTotals,
  predictNextMonth,
} = require("./analytics");
const { askAI } = require("../services/aiService");

/**
 * Builds a complete monthly financial report combining
 * totals, category breakdown, prediction, and an AI health summary.
 */
async function generateMonthlyReport(userId) {
  const [breakdown, totals, monthlyTotals] = await Promise.all([
    getCategoryBreakdown(userId),
    getTotals(userId),
    getMonthlyTotals(userId, 6),
  ]);

  const prediction = predictNextMonth(monthlyTotals);

  const highestCategory = breakdown.length > 0 ? breakdown[0].category : "N/A";
  const lowestCategory = breakdown.length > 0 ? breakdown[breakdown.length - 1].category : "N/A";
  const potentialSavings = Math.max(totals.income - totals.expense, 0);

  const prompt = `
You are a financial health analyst.

Total Income: ₹${totals.income}
Total Expense: ₹${totals.expense}
Highest spending category: ${highestCategory}
Lowest spending category: ${lowestCategory}
Potential savings: ₹${potentialSavings}
Predicted next month expense: ₹${prediction.predictedAmount}

In exactly one short sentence, rate the user's overall financial health as
one of: "Excellent", "Good", "Average", "Needs Attention", "Critical",
followed by a brief reason. Return ONLY valid JSON in this exact format:
{
  "healthRating": "",
  "reason": ""
}
`;

  const healthResult = await askAI(prompt, true);

  return {
    generatedAt: new Date(),
    totals,
    highestCategory,
    lowestCategory,
    potentialSavings,
    categoryBreakdown: breakdown,
    monthlyTrend: monthlyTotals,
    prediction,
    financialHealth: healthResult || { healthRating: "Unknown", reason: "Could not be determined" },
  };
}

module.exports = { generateMonthlyReport };