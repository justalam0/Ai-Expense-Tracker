const mongoose = require("mongoose");
const {
  getCategoryBreakdown,
  getTotals,
  getMonthlyTotals,
  predictNextMonth,
  generateInsights,
} = require("../agent/analytics");
const { generateSavingSuggestions } = require("../agent/savingAgent");
const { generateMonthlyReport } = require("../agent/reportGenerator");
const { streamReportPDF } = require("../services/pdfService");
const { answerFinanceQuestion } = require("../agent/chatAgent");

const { runAlertsForUser } = require("../agent/alertAgent");
const User = require("../models/User");
const { sendWeeklySummaryEmail } = require("../agent/weeklySummaryAgent");

exports.getReport = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const [breakdown, totals, monthlyTotals] = await Promise.all([
      getCategoryBreakdown(userId),
      getTotals(userId),
      getMonthlyTotals(userId, 6),
    ]);

    const prediction = predictNextMonth(monthlyTotals);
    const insights = await generateInsights(breakdown, totals, prediction);

    res.json({
      totals,
      categoryBreakdown: breakdown,
      monthlyTrend: monthlyTotals,
      prediction,
      insights,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getSuggestions = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const result = await generateSavingSuggestions(userId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMonthlyReport = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const report = await generateMonthlyReport(userId);
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMonthlyReportPDF = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const report = await generateMonthlyReport(userId);
    streamReportPDF(report, res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.chatWithAgent = async (req, res) => {
  try {
    const { question } = req.body;

    if (!question || question.trim() === "") {
      return res.status(400).json({ error: "question is required" });
    }

    const answer = await answerFinanceQuestion(req.user.id, question);
    res.json({ question, answer });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.testAlerts = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const result = await runAlertsForUser(user);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.testWeeklySummary = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const summary = await sendWeeklySummaryEmail(user);
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};