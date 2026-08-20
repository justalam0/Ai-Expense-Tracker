require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");
const transactionRoutes = require("./routes/transactionRoutes");
const authRoutes = require("./routes/authRoutes");
const agentRoutes = require("./routes/agentRoutes");
const budgetRoutes = require("./routes/budgetRoutes");
const { startDailyCheckJob } = require("./jobs/dailyCheckJob");
const { startWeeklySummaryJob } = require("./jobs/weeklySummaryJob");
const cors = require("cors");

const app = express();
connectDB();



app.use(cors());

app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/agent", agentRoutes);
app.use("/api/budget", budgetRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startDailyCheckJob();
  startWeeklySummaryJob();
});