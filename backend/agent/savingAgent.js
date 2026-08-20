const { askAI } = require("../services/aiService");
const { getCategoryBreakdown, getTotals } = require("./analytics");

/**
 * Generates 5 personalized savings suggestions based on the user's
 * actual category-wise spending and income/expense totals.
 */
async function generateSavingSuggestions(userId) {
  const breakdown = await getCategoryBreakdown(userId);
  const totals = await getTotals(userId);

  if (breakdown.length === 0) {
    return {
      suggestions: ["Not enough transaction data yet to generate suggestions."],
      breakdown,
      totals,
    };
  }

  const prompt = `
You are a personal finance advisor.

User's income: ₹${totals.income}
User's total expense: ₹${totals.expense}

Category-wise spending:
${breakdown.map((b) => `${b.category}: ₹${b.total} (${b.percentage}%)`).join("\n")}

Suggest exactly 5 specific, actionable savings tips based on this data.
Each tip should be one short sentence.
Return ONLY valid JSON in this exact format, nothing else:
{
  "suggestions": ["", "", "", "", ""]
}
`;

  const result = await askAI(prompt, true); // expect JSON

  if (!result || !Array.isArray(result.suggestions)) {
    return {
      suggestions: ["Unable to generate suggestions at this time."],
      breakdown,
      totals,
    };
  }

  return {
    suggestions: result.suggestions,
    breakdown,
    totals,
  };
}

module.exports = { generateSavingSuggestions };