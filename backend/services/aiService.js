const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generic function every agent will call.
 * @param {string} prompt - the instruction/prompt to send
 * @param {boolean} expectJson - if true, tries to parse response as JSON
 */
async function askAI(prompt, expectJson = false) {
  // const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });
  const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash-lite" });
  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  if (expectJson) {
    try {
      const cleaned = text.replace(/```json|```/g, "").trim();
      return JSON.parse(cleaned);
    } catch (err) {
      console.error("AI JSON parse failed:", text);
      return null;
    }
  }

  return text;
}

module.exports = { askAI };