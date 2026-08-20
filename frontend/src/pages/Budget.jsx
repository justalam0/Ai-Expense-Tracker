import { useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";
import Navbar from "../components/Navbar";

export default function Budget() {
  const [budget, setBudget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [savingsGoal, setSavingsGoal] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchBudget(); }, []);

  const fetchBudget = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axiosInstance.get("/budget");
      setBudget(res.data);
    } catch (err) {
      if (err.response?.status === 404) setBudget(null);
      else setError(err.response?.data?.error || "Failed to load budget");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBudget = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await axiosInstance.post("/budget", {
        monthlyIncome: Number(monthlyIncome),
        savingsGoal: Number(savingsGoal),
      });
      setBudget(res.data);
      setMonthlyIncome("");
      setSavingsGoal("");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create budget");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page">
      <Navbar />
      <h1 className="page-title">Budget</h1>
      <p className="page-subtitle">Let AI split your income into a category-wise plan</p>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <p className="empty-state">Loading...</p>
      ) : (
        <>
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">{budget ? "Update This Month's Budget" : "Set Up This Month's Budget"}</h3>
            </div>
            <form onSubmit={handleCreateBudget} className="form-row">
              <input
                type="number"
                placeholder="Monthly Income"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(e.target.value)}
                required
                className="input"
              />
              <input
                type="number"
                placeholder="Savings Goal"
                value={savingsGoal}
                onChange={(e) => setSavingsGoal(e.target.value)}
                required
                className="input"
              />
              <button type="submit" disabled={submitting} className="btn btn-primary">
                {submitting ? "Generating..." : "Generate Budget"}
              </button>
            </form>
            <p style={{ color: "var(--text-muted)", fontSize: 13, margin: 0 }}>
              AI will automatically split your available amount (income − savings goal) across categories.
            </p>
          </div>

          {budget && (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Budget for {budget.month}</h3>
                <span className="badge badge-income">Savings Goal: ₹{budget.savingsGoal?.toLocaleString("en-IN")}</span>
              </div>
              <div className="stat-grid" style={{ marginBottom: 0 }}>
                {Object.entries(budget.limits || {}).map(([category, limit]) => (
                  <div key={category} className="stat-card" style={{ "--accent": "#4338ca" }}>
                    <p className="stat-label">{category}</p>
                    <p className="stat-value">₹{limit.toLocaleString("en-IN")}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!budget && (
            <p className="empty-state">No budget set for this month yet. Fill the form above to generate one.</p>
          )}
        </>
      )}
    </div>
  );
}