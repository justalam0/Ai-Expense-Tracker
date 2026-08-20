const mongoose = require("mongoose");

const budgetSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    month: { type: String, required: true }, // e.g. "2026-07"
    limits: {
      type: Map,
      of: Number, // { Food: 9000, Travel: 4000, ... }
    },
    savingsGoal: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Budget", budgetSchema);