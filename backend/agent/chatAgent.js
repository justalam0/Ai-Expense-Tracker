const Transaction = require("../models/Transaction");
const { getCategoryBreakdown, getTotals } = require("./analytics");
const { askAI } = require("../services/aiService");

/**
 * Fetches recent transactions (last 50) as context for the chatbot,
 * so it can answer specific questions like "How much did I spend on X?"
 */
async function getRecentTransactionsSummary(userId) {
  const transactions = await Transaction.find({ user: userId })
    .sort({ date: -1 })
    .limit(50)
    .select("type amount category description date -_id");

  return transactions
    .map(
      (t) =>
        `${t.date.toISOString().slice(0, 10)} | ${t.type} | ₹${t.amount} | ${t.category} | ${t.description}`
    )
    .join("\n");
}

/**
 * Answers a user's finance question using their real transaction data as context.
 */
async function answerFinanceQuestion(userId, userQuestion) {
  const [breakdown, totals, recentTransactions] = await Promise.all([
    getCategoryBreakdown(userId),
    getTotals(userId),
    getRecentTransactionsSummary(userId),
  ]);

  const prompt = `
You are a helpful personal finance assistant embedded in an expense tracker app.
Answer the user's question using ONLY the data provided below. Be concise, specific,
and use real numbers from the data. If the data doesn't contain enough information
to answer confidently, say so honestly instead of guessing.

User's Total Income: ₹${totals.income}
User's Total Expense: ₹${totals.expense}

Category-wise spending:
${breakdown.map((b) => `${b.category}: ₹${b.total} (${b.percentage}%)`).join("\n")}

Recent transactions (date | type | amount | category | description):
${recentTransactions || "No transactions found."}

User's question: "${userQuestion}"

Give a direct, helpful answer in 2-4 sentences. Do not use markdown formatting.
`;

  const answer = await askAI(prompt, false); // plain text response
  return answer;
}

module.exports = { answerFinanceQuestion };