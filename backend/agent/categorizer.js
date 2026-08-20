const { askAI } = require("../services/aiService");

const EXPENSE_CATEGORIES = [
  "Food",
  "Travel",
  "Shopping",
  "Bills",
  "Medical",
  "Entertainment",
  "Rent",
  "Groceries",
  "Other",
];

const INCOME_CATEGORIES = [
  "Salary",
  "Bonus",
  "Investment",
  "Freelance",
  "Other Income",
];

/**
 * Takes a transaction description and type, returns { category, confidence }
 */
async function categorizeTransaction(description, type = "expense") {
  const categoriesList = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const fallback = type === "income" ? "Other Income" : "Other";

  const prompt = `
You are a financial categorization assistant.

Categorize the following ${type} transaction into EXACTLY ONE of these categories:
${categoriesList.join(", ")}

Transaction description: "${description}"

If it is "Going Bank" or implies going somewhere, consider it "Travel" if it's an expense.

Return ONLY valid JSON in this exact format, nothing else:
{
  "category": "",
  "confidence": 0.0
}

confidence should be a number between 0 and 1 representing how sure you are.
`;

  const result = await askAI(prompt, true); // true = expect JSON

  // Fallback in case AI fails or returns something unexpected
  if (!result || !result.category || !categoriesList.includes(result.category)) {
    return { category: fallback, confidence: 0.3 };
  }

  return {
    category: result.category,
    confidence: result.confidence ?? 0.5,
  };
}

module.exports = { categorizeTransaction };