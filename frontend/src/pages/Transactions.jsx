import { useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";
import Navbar from "../components/Navbar";
import { getCategoryColor } from "../utils/categoryColors";

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [type, setType] = useState("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [warnings, setWarnings] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [editAmount, setEditAmount] = useState("");
  const [editDescription, setEditDescription] = useState("");

  useEffect(() => { fetchTransactions(); }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axiosInstance.get("/transactions");
      setTransactions(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setWarnings(null);
    setError("");
    try {
      const res = await axiosInstance.post("/transactions", { type, amount: Number(amount), description });
      setAmount("");
      setDescription("");
      setWarnings({ budgetWarning: res.data.budgetWarning, anomalyWarning: res.data.anomalyWarning });
      fetchTransactions();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to add transaction");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this transaction?")) return;
    try {
      await axiosInstance.delete(`/transactions/${id}`);
      fetchTransactions();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete transaction");
    }
  };

  const startEdit = (t) => {
    setEditingId(t._id);
    setEditAmount(t.amount);
    setEditDescription(t.description);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditAmount("");
    setEditDescription("");
  };

  const saveEdit = async (id) => {
    try {
      const res = await axiosInstance.put(`/transactions/${id}`, {
        amount: Number(editAmount),
        description: editDescription,
      });
      setWarnings({ budgetWarning: res.data.budgetWarning, anomalyWarning: res.data.anomalyWarning });
      cancelEdit();
      fetchTransactions();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update transaction");
    }
  };

  return (
    <div className="page">
      <Navbar />
      <h1 className="page-title">Transactions</h1>
      <p className="page-subtitle">Add, categorize, and manage your income and expenses</p>

      <div className="card">
        <form onSubmit={handleAdd} className="form-row" style={{ marginBottom: 0 }}>
          <select value={type} onChange={(e) => setType(e.target.value)} className="input" style={{ maxWidth: 130 }}>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
          <input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            className="input"
            style={{ maxWidth: 140 }}
          />
          <input
            type="text"
            placeholder="Description (e.g. Paid ₹450 at Dominos)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            className="input"
            style={{ flex: 2, minWidth: 220 }}
          />
          <button type="submit" disabled={submitting} className="btn btn-primary">
            {submitting ? "Adding..." : "Add"}
          </button>
        </form>
      </div>

      {warnings?.budgetWarning && <div className="alert">{warnings.budgetWarning.message}</div>}
      {warnings?.anomalyWarning && <div className="alert">{warnings.anomalyWarning.message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        {loading ? (
          <p className="empty-state">Loading...</p>
        ) : transactions.length === 0 ? (
          <p className="empty-state">No transactions yet. Add one above.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Category</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t._id}>
                  <td>{new Date(t.date).toLocaleDateString()}</td>
                  <td>
                    <span className={`badge ${t.type === "income" ? "badge-income" : "badge-expense"}`}>
                      {t.type}
                    </span>
                  </td>
                  <td>
                    <span
                      className="category-badge"
                      style={{
                        background: `${getCategoryColor(t.category, t.type)}1a`,
                        color: getCategoryColor(t.category, t.type),
                      }}
                    >
                      <span className="category-dot" style={{ background: getCategoryColor(t.category, t.type) }} />
                      {t.category}
                    </span>
                  </td>
                  <td>
                    {editingId === t._id ? (
                      <input
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className="input"
                      />
                    ) : (
                      t.description
                    )}
                  </td>
                  <td>
                    {editingId === t._id ? (
                      <input
                        type="number"
                        value={editAmount}
                        onChange={(e) => setEditAmount(e.target.value)}
                        className="input"
                        style={{ width: 90 }}
                      />
                    ) : (
                      `₹${t.amount.toLocaleString("en-IN")}`
                    )}
                  </td>
                  <td>
                    {editingId === t._id ? (
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => saveEdit(t._id)} className="btn btn-primary btn-sm">Save</button>
                        <button onClick={cancelEdit} className="btn btn-ghost btn-sm">Cancel</button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => startEdit(t)} className="btn btn-ghost btn-sm">Edit</button>
                        <button onClick={() => handleDelete(t._id)} className="btn btn-ghost btn-sm">Delete</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}