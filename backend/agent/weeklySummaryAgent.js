const Transaction = require("../models/Transaction");
const User = require("../models/User");
const { askAI } = require("../services/aiService");
const { sendEmail } = require("../services/emailService");

/**
 * Returns start (7 days ago) and end (now) as Date objects
 */
function getWeekRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 7);
  start.setHours(0, 0, 0, 0);
  return { start, end };
}

/**
 * Builds a weekly summary for a single user:
 * total expenses, category breakdown, highest category, and AI recommendations.
 */
async function generateWeeklySummary(user) {
  const { start, end } = getWeekRange();

  const transactions = await Transaction.find({
    user: user._id,
    date: { $gte: start, $lte: end },
  });

  const expenses = transactions.filter((t) => t.type === "expense");
  const income = transactions.filter((t) => t.type === "income");

  const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);
  const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);

  const categoryTotals = {};
  expenses.forEach((t) => {
    categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
  });

  const breakdown = Object.entries(categoryTotals)
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);

  const highestCategory = breakdown.length > 0 ? breakdown[0].category : "N/A";
  const savings = totalIncome - totalExpense;

  let recommendations = "Not enough data this week to generate recommendations.";

  if (expenses.length > 0) {
    const prompt = `
You are a personal finance assistant. Here is the user's spending for the last 7 days:

Total Income: ₹${totalIncome}
Total Expense: ₹${totalExpense}
Savings: ₹${savings}
Category breakdown: ${breakdown.map((b) => `${b.category}: ₹${b.total}`).join(", ")}

Write a short weekly summary (3-4 sentences) highlighting spending patterns
and one practical recommendation for next week. Plain text, no markdown.
`;
    recommendations = await askAI(prompt, false);
  }

  return {
    weekStart: start,
    weekEnd: end,
    totalIncome,
    totalExpense,
    savings,
    highestCategory,
    breakdown,
    recommendations,
  };
}

/**
 * Generates the summary and emails it to the user.
 */
async function sendWeeklySummaryEmail(user) {
  const summary = await generateWeeklySummary(user);

  const emailBody = `
Weekly Finance Summary (${summary.weekStart.toDateString()} - ${summary.weekEnd.toDateString()})

Total Income: ₹${summary.totalIncome}
Total Expense: ₹${summary.totalExpense}
Savings: ₹${summary.savings}
Highest Spending Category: ${summary.highestCategory}

Category Breakdown:
${summary.breakdown.map((b) => `${b.category}: ₹${b.total}`).join("\n")}

Recommendations:
${summary.recommendations}
`;

  await sendEmail(user.email, "📊 Your Weekly Finance Summary", emailBody);
  return summary;
}

/**
 * Runs the weekly summary for all users (used by the cron job).
 */
async function runWeeklySummaryForAllUsers() {
  const users = await User.find({});
  for (const user of users) {
    await sendWeeklySummaryEmail(user);
  }
}

module.exports = { generateWeeklySummary, sendWeeklySummaryEmail, runWeeklySummaryForAllUsers };