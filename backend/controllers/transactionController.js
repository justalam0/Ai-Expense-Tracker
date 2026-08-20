const Transaction = require("../models/Transaction");
const { categorizeTransaction } = require("../agent/categorizer");
const { checkOverspend } = require("../agent/budgetAgent");
const { checkTransactionAnomaly } = require("../agent/alertAgent");

// Create transaction (category left blank -> AI agent will fill it in Module 2)
exports.addTransaction = async (req, res) => {
  try {
    const { type, amount, description, category, date } = req.body;

    let finalCategory = category;
    let confidence = null;
    let source = "manual";

    if (!category) {
      const aiResult = await categorizeTransaction(description, type);
      finalCategory = aiResult.category;
      confidence = aiResult.confidence;
      source = "ai";
    }

    const transactionDate = date ? new Date(date) : new Date();

    const transaction = await Transaction.create({
      user: req.user.id,
      type,
      amount,
      description,
      category: finalCategory || "Uncategorized",
      confidence,
      source,
      date: transactionDate,
    });

    let budgetWarning = null;
    let anomalyWarning = null;

    // Only check budget and anomalies for expenses
    if (type === "expense") {
      const month = transactionDate.toISOString().slice(0, 7); // "2026-07"

      // Sum all expenses in this category for this month (including the one just added)
      const categoryTotalResult = await Transaction.aggregate([
        {
          $match: {
            user: transaction.user,
            type: "expense",
            category: finalCategory,
            date: {
              $gte: new Date(`${month}-01`),
              $lt: new Date(new Date(`${month}-01`).setMonth(new Date(`${month}-01`).getMonth() + 1)),
            },
          },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]);

      const categoryTotal = categoryTotalResult[0]?.total || 0;

      budgetWarning = await checkOverspend(req.user.id, month, finalCategory, categoryTotal);
      anomalyWarning = await checkTransactionAnomaly(req.user.id, finalCategory, amount, transaction._id);
    }

    res.status(201).json({ transaction, budgetWarning, anomalyWarning });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user.id }).sort({ date: -1 });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateTransaction = async (req, res) => {
  try {
    const { description, amount, type, category, date } = req.body;

    // First, get the existing transaction to know its current values
    const existing = await Transaction.findOne({ _id: req.params.id, user: req.user.id });

    if (!existing) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    const updateData = { ...req.body };

    // Determine the final type (new one if provided, else existing)
    const finalType = type || existing.type;

    // Re-categorize automatically ONLY if:
    // - description changed
    // - it's an expense
    // - user did NOT manually specify a category in this update
    const descriptionChanged = description && description !== existing.description;

    if (descriptionChanged && !category) {
      const aiResult = await categorizeTransaction(description, finalType);
      updateData.category = aiResult.category;
      updateData.confidence = aiResult.confidence;
      updateData.source = "ai";
    }

    const updated = await Transaction.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      updateData,
      { new: true }
    );

    // Re-check budget overspend and anomaly using the (possibly new) category and amount
    let budgetWarning = null;
    let anomalyWarning = null;

    if (updated.type === "expense") {
      const transactionDate = new Date(updated.date);
      const month = transactionDate.toISOString().slice(0, 7);

      const categoryTotalResult = await Transaction.aggregate([
        {
          $match: {
            user: updated.user,
            type: "expense",
            category: updated.category,
            date: {
              $gte: new Date(`${month}-01`),
              $lt: new Date(new Date(`${month}-01`).setMonth(new Date(`${month}-01`).getMonth() + 1)),
            },
          },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]);

      const categoryTotal = categoryTotalResult[0]?.total || 0;

      budgetWarning = await checkOverspend(req.user.id, month, updated.category, categoryTotal);
      anomalyWarning = await checkTransactionAnomaly(req.user.id, updated.category, updated.amount, updated._id);
    }

    res.json({ transaction: updated, budgetWarning, anomalyWarning });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteTransaction = async (req, res) => {
  try {
    await Transaction.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};