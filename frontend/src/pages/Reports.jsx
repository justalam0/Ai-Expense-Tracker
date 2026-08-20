import { useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";
import Navbar from "../components/Navbar";

export default function Reports() {
  const [report, setReport] = useState(null);
  const [suggestions, setSuggestions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [reportRes, suggestionsRes] = await Promise.all([
        axiosInstance.get("/agent/monthly-report"),
        axiosInstance.get("/agent/suggestions"),
      ]);
      setReport(reportRes.data);
      setSuggestions(suggestionsRes.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const res = await axiosInstance.get("/agent/monthly-report/pdf", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "monthly-report.pdf");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError("Failed to download PDF");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <div className="centered-page">Loading reports...</div>;

  if (error) {
    return (
      <div className="centered-page">
        <p style={{ color: "var(--danger)" }}>{error}</p>
        <button className="btn btn-primary" onClick={fetchData}>Retry</button>
      </div>
    );
  }

  return (
    <div className="page">
      <Navbar />
      <h1 className="page-title">Reports</h1>
      <p className="page-subtitle">Your monthly financial health, at a glance</p>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Monthly Financial Report</h3>
          <button onClick={handleDownloadPDF} disabled={downloading} className="btn btn-primary">
            {downloading ? "Downloading..." : "Download PDF"}
          </button>
        </div>

        <div className="stat-grid">
          <div className="stat-card" style={{ "--accent": "#10b981" }}>
            <p className="stat-label">Total Income</p>
            <p className="stat-value">₹{report.totals.income.toLocaleString("en-IN")}</p>
          </div>
          <div className="stat-card" style={{ "--accent": "#dc2626" }}>
            <p className="stat-label">Total Expense</p>
            <p className="stat-value">₹{report.totals.expense.toLocaleString("en-IN")}</p>
          </div>
          <div className="stat-card" style={{ "--accent": "#4338ca" }}>
            <p className="stat-label">Potential Savings</p>
            <p className="stat-value">₹{report.potentialSavings.toLocaleString("en-IN")}</p>
          </div>
          <div className="stat-card" style={{ "--accent": "#f59e0b" }}>
            <p className="stat-label">Highest Category</p>
            <p className="stat-value">{report.highestCategory}</p>
          </div>
          <div className="stat-card" style={{ "--accent": "#0ea5e9" }}>
            <p className="stat-label">Lowest Category</p>
            <p className="stat-value">{report.lowestCategory}</p>
          </div>
          <div className="stat-card" style={{ "--accent": "#8b5cf6" }}>
            <p className="stat-label">Predicted Next Month</p>
            <p className="stat-value">₹{report.prediction.predictedAmount.toLocaleString("en-IN")}</p>
          </div>
        </div>

        <div className="alert alert-success" style={{ marginBottom: 0 }}>
          <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)" }}>Financial Health</p>
          <p style={{ margin: "4px 0", fontSize: 20, fontWeight: 800, color: "var(--success)" }}>
            {report.financialHealth.healthRating}
          </p>
          <p style={{ margin: 0 }}>{report.financialHealth.reason}</p>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h3 className="card-title">Savings Suggestions</h3></div>
        {suggestions?.suggestions?.length > 0 ? (
          <ul style={{ paddingLeft: 20, margin: 0, lineHeight: 1.9 }}>
            {suggestions.suggestions.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        ) : (
          <p className="empty-state">No suggestions available yet.</p>
        )}
      </div>
    </div>
  );
}