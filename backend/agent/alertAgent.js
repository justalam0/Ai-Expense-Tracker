const mongoose = require("mongoose");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const { sendEmail } = require("../services/emailService");

/**
 * Returns start and end of "today" as Date objects
 */
function getTodayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

/**
 * Checks if today's total spending exceeds the user's daily limit.
 */
async function checkDailyLimit(user) {
  const { start, end } = getTodayRange();

  const result = await Transaction.aggregate([
    {
      $match: {
        user: user._id,
        type: "expense",
        date: { $gte: start, $lte: end },
      },
    },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);

  const todaySpent = result[0]?.total || 0;

  if (todaySpent > user.dailyLimit) {
    await sendEmail(
      user.email,
      "⚠️ Daily Spending Limit Exceeded",
      `You've spent ₹${todaySpent} today, which exceeds your daily limit of ₹${user.dailyLimit}.`
    );
    return { alert: true, todaySpent, limit: user.dailyLimit };
  }

  return { alert: false, todaySpent, limit: user.dailyLimit };
}

/**
 * Compares today's spending per category against the user's average
 * daily spending in that category (based on last 30 days), and alerts
 * if today is unusually high (more than 3x the average).
 */
async function checkUnusualSpending(user) {
  const { start, end } = getTodayRange();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Today's spending per category
  const todayByCategory = await Transaction.aggregate([
    { $match: { user: user._id, type: "expense", date: { $gte: start, $lte: end } } },
    { $group: { _id: "$category", total: { $sum: "$amount" } } },
  ]);

  // Average daily spending per category over last 30 days
  const historicalByCategory = await Transaction.aggregate([
    { $match: { user: user._id, type: "expense", date: { $gte: thirtyDaysAgo, $lt: start } } },
    { $group: { _id: "$category", total: { $sum: "$amount" } } },
  ]);

  const historicalMap = {};
  historicalByCategory.forEach((h) => {
    historicalMap[h._id] = h.total / 30; // rough daily average
  });

  const unusualCategories = [];

  for (const todayCat of todayByCategory) {
    const avg = historicalMap[todayCat._id] || 0;
    if (avg > 0 && todayCat.total > avg * 3) {
      unusualCategories.push({
        category: todayCat._id,
        todaySpent: todayCat.total,
        dailyAverage: Math.round(avg),
      });
    }
  }

  if (unusualCategories.length > 0) {
    const message = unusualCategories
      .map(
        (u) =>
          `${u.category}: spent ₹${u.todaySpent} today vs your usual daily average of ₹${u.dailyAverage}`
      )
      .join("\n");

    await sendEmail(user.email, "⚠️ Unusual Spending Detected", message);
  }

  return unusualCategories;
}

/**
 * Runs both checks for a single user.
 */
async function runAlertsForUser(user) {
  const dailyLimitResult = await checkDailyLimit(user);
  const unusualSpending = await checkUnusualSpending(user);
  return { dailyLimitResult, unusualSpending };
}

/**
 * Runs alert checks for ALL users (used by the cron job).
 */
async function runAlertsForAllUsers() {
  const users = await User.find({});
  for (const user of users) {
    await runAlertsForUser(user);
  }
}

/**
 * Real-time check: compares a single new transaction's amount against
 * the user's historical average for that category (last 30 days).
 * Used right when a transaction is created, for instant feedback.
 */

async function checkTransactionAnomaly(userId, category, amount, excludeTransactionId) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const userObjectId = new mongoose.Types.ObjectId(userId);

  const history = await Transaction.aggregate([
    {
      $match: {
        user: userObjectId,
        type: "expense",
        category,
        date: { $gte: thirtyDaysAgo },
        _id: { $ne: excludeTransactionId },
      },
    },
    { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
  ]);

  if (!history[0] || history[0].count === 0) {
    return null;
  }

  const avgPerTransaction = history[0].total / history[0].count;

  if (amount > avgPerTransaction * 3 && amount > 500) {
    return {
      category,
      amount,
      averagePerTransaction: Math.round(avgPerTransaction),
      message: `⚠️ This ${category} expense of ₹${amount} is unusually high compared to your average of ₹${Math.round(avgPerTransaction)}.`,
    };
  }

  return null;
}

module.exports = {
  runAlertsForUser,
  runAlertsForAllUsers,
  checkTransactionAnomaly,
};