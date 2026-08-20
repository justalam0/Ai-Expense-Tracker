const cron = require("node-cron");
const { runWeeklySummaryForAllUsers } = require("../agent/weeklySummaryAgent");

/**
 * Schedules the weekly summary to run every Sunday at 8:00 PM.
 * Cron format: minute hour day month weekday (0 = Sunday)
 */
function startWeeklySummaryJob() {
  cron.schedule("0 20 * * 0", async () => {
    console.log("Running weekly summary job...");
    try {
      await runWeeklySummaryForAllUsers();
      console.log("Weekly summary job completed.");
    } catch (err) {
      console.error("Weekly summary job failed:", err.message);
    }
  });

  console.log("Weekly summary cron job scheduled (runs Sundays at 8:00 PM).");
}

module.exports = { startWeeklySummaryJob };