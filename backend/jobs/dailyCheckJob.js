const cron = require("node-cron");
const { runAlertsForAllUsers } = require("../agent/alertAgent");

/**
 * Schedules the alert agent to run every day at 9:00 PM.
 * Cron format: minute hour day month weekday
 */
function startDailyCheckJob() {
  cron.schedule("0 21 * * *", async () => {
    console.log("Running daily spending check...");
    try {
      await runAlertsForAllUsers();
      console.log("Daily spending check completed.");
    } catch (err) {
      console.error("Daily spending check failed:", err.message);
    }
  });

  console.log("Daily check cron job scheduled (runs at 9:00 PM daily).");
}

module.exports = { startDailyCheckJob };