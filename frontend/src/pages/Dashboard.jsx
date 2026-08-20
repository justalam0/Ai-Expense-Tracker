import { useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";
import Navbar from "../components/Navbar";
import { getCategoryColor, PALETTE } from "../utils/categoryColors";
import {
  Tooltip, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
} from "recharts";

const ICONS = {
  income: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" />
    </svg>
  ),
  expense: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="7" y1="7" x2="17" y2="17" /><polyline points="17 7 17 17 7 17" />
    </svg>
  ),
  savings: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="13" rx="2" /><path d="M16 13h.01" /><path d="M2 9V6a2 2 0 0 1 2-2h13" />
    </svg>
  ),
  predicted: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" />
    </svg>
  ),
};

// Returns the Monday of the week a given date falls in, as "YYYY-MM-DD"
function getWeekStart(dateStr) {
  const d = new Date(dateStr);
  const day = d.getDay(); // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day; // shift to Monday
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

// Builds trend data for income and expense
function buildTrendData(transactions, mode) {
  const totals = {};

  transactions.forEach((t) => {
    let key;
    if (mode === "daily") {
      key = t.date.slice(0, 10); // YYYY-MM-DD
    } else if (mode === "weekly") {
      key = getWeekStart(t.date);
    } else if (mode === "monthly") {
      key = t.date.slice(0, 7); // YYYY-MM
    } else if (mode === "yearly") {
      key = t.date.slice(0, 4); // YYYY
    }

    if (!totals[key]) totals[key] = { key, expense: 0, income: 0 };
    if (t.type === "expense") totals[key].expense += t.amount;
    if (t.type === "income") totals[key].income += t.amount;
  });

  let sorted = Object.values(totals).sort((a, b) => a.key.localeCompare(b.key));
  
  // Limit data points to keep chart readable
  if (mode === "daily") sorted = sorted.slice(-14);
  else if (mode === "weekly") sorted = sorted.slice(-12);
  else if (mode === "monthly") sorted = sorted.slice(-12);

  return sorted;
}

export default function Dashboard() {
  const [report, setReport] = useState(null);
  const [allTransactions, setAllTransactions] = useState([]);
  const [viewMode, setViewMode] = useState("monthly"); // "daily" | "weekly" | "monthly" | "yearly"
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError("");
    try {
      const [reportRes, transactionsRes] = await Promise.all([
        axiosInstance.get("/agent/report"),
        axiosInstance.get("/transactions"),
      ]);
      setReport(reportRes.data);
      setAllTransactions(transactionsRes.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="centered-page">Loading dashboard...</div>;

  if (error) {
    return (
      <div className="centered-page">
        <p style={{ color: "var(--danger)" }}>{error}</p>
        <button className="btn btn-primary" onClick={fetchDashboardData}>Retry</button>
      </div>
    );
  }

  const { totals, categoryBreakdown, prediction, insights } = report;

  const insightPoints = (insights || "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const trendData = buildTrendData(allTransactions, viewMode);

  return (
    <div className="page">
      <Navbar />
      <h1 className="page-title">Overview</h1>
      <p className="page-subtitle">Your finances at a glance</p>

      <div className="stat-grid">
        <StatCard label="Total Income" value={totals.income} color="#10b981" icon={ICONS.income} />
        <StatCard label="Total Expense" value={totals.expense} color="#dc2626" icon={ICONS.expense} />
        <StatCard label="Savings" value={totals.income - totals.expense} color="#4338ca" icon={ICONS.savings} />
        <StatCard label="Predicted Next Month" value={prediction.predictedAmount} color="#f59e0b" icon={ICONS.predicted} />
      </div>

      <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
        <div className="card" style={{ flex: 1, minWidth: 340 }}>
          <div className="card-header"><h3 className="card-title">Spending by Category</h3></div>
          {categoryBreakdown.length === 0 ? (
            <p className="empty-state">No expense data yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {categoryBreakdown.map((cat) => {
                const color = getCategoryColor(cat.category);
                return (
                  <div key={cat.category}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 14 }}>
                      <span style={{ fontWeight: 600 }}>{cat.category}</span>
                      <span style={{ color: "var(--text-muted)" }}>
                        ₹{cat.total.toLocaleString("en-IN")} · {cat.percentage}%
                      </span>
                    </div>
                    <div style={{ background: "var(--bg)", borderRadius: 999, height: 8, overflow: "hidden" }}>
                      <div
                        style={{
                          width: `${cat.percentage}%`,
                          height: "100%",
                          borderRadius: 999,
                          background: color,
                          transition: "width 0.4s ease",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="card" style={{ flex: 2, minWidth: 400 }}>
          <div className="card-header">
            <h3 className="card-title">Cash Flow Trend</h3>
            <div style={{ display: "flex", gap: 4, background: "var(--bg)", padding: 4, borderRadius: 999 }}>
              {["daily", "weekly", "monthly", "yearly"].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className="btn btn-sm"
                  style={{
                    background: viewMode === mode ? "var(--chip-bg, #fff)" : "transparent",
                    color: viewMode === mode ? "var(--primary)" : "var(--text-muted)",
                    boxShadow: viewMode === mode ? "var(--shadow)" : "none",
                    textTransform: "capitalize",
                  }}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {trendData.length === 0 ? (
            <p className="empty-state">No trend data yet.</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={360}>
                <LineChart data={trendData} margin={{ top: 20, right: 30, left: 15, bottom: 60 }}>
                  <XAxis 
                    dataKey="key" 
                    stroke="#9ca3af" 
                    fontSize={12} 
                    angle={-45} 
                    textAnchor="end"
                    axisLine={{ strokeWidth: 3, stroke: '#9ca3af' }}
                    tickLine={{ strokeWidth: 3, stroke: '#9ca3af' }}
                    tickSize={8}
                    dy={15}
                    dx={-5}
                  />
                  <YAxis 
                    stroke="#9ca3af" 
                    fontSize={13} 
                    axisLine={{ strokeWidth: 3, stroke: '#9ca3af' }}
                    tickLine={{ strokeWidth: 3, stroke: '#9ca3af' }}
                    tickSize={8}
                  />
                  <Tooltip />
                  <Line 
                    name="Income" 
                    type="linear" 
                    dataKey="income" 
                    stroke="#0ea5e9" 
                    strokeWidth={4} 
                    dot={{ r: 6, fill: '#0ea5e9', strokeWidth: 0 }} 
                    activeDot={{ r: 8, fill: '#0ea5e9', strokeWidth: 0 }} 
                  />
                  <Line 
                    name="Expense" 
                    type="linear" 
                    dataKey="expense" 
                    stroke="#e11d48" 
                    strokeWidth={4} 
                    dot={{ r: 6, fill: '#e11d48', strokeWidth: 0 }} 
                    activeDot={{ r: 8, fill: '#e11d48', strokeWidth: 0 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
              {trendData.length === 1 && (
                <p className="empty-state" style={{ textAlign: "center", marginTop: -10 }}>
                  Add more transactions over time to see the full trend.
                </p>
              )}
            </>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h3 className="card-title">AI Insights</h3></div>
        {insightPoints.length === 0 ? (
          <p className="empty-state">No insights available yet.</p>
        ) : (
          <div className="insight-list">
            {insightPoints.map((point, i) => (
              <div key={i} className="insight-item">
                <span className="insight-number" style={{ background: PALETTE[i % PALETTE.length] }}>
                  {i + 1}
                </span>
                <p className="insight-text">{point}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color, icon }) {
  return (
    <div className="stat-card" style={{ "--accent": color }}>
      <div className="stat-card-icon" style={{ "--accent": color }}>{icon}</div>
      <p className="stat-label">{label}</p>
      <p className="stat-value">₹{value?.toLocaleString("en-IN") || 0}</p>
    </div>
  );
}