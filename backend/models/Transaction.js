const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["income", "expense"], required: true },
    amount: { type: Number, required: true },
    description: { type: String, required: true }, // e.g. "Paid ₹450 at Dominos"
    category: { type: String, default: "Uncategorized" }, // filled by AI agent later
    confidence: { type: Number, default: null }, // AI confidence score
    source: { type: String, default: "manual" }, // manual / ai / import
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Transaction", transactionSchema);