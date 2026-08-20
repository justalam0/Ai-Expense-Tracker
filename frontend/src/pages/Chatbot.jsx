import { useState, useRef, useEffect } from "react";
import axiosInstance from "../api/axiosInstance";
import Navbar from "../components/Navbar";

export default function Chatbot() {
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hi! Ask me anything about your finances — spending, savings, budget, or affordability." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    const question = input.trim();
    if (!question) return;

    setMessages((prev) => [...prev, { role: "user", text: question }]);
    setInput("");
    setLoading(true);
    setError("");

    try {
      const res = await axiosInstance.post("/agent/chat", { question });
      setMessages((prev) => [...prev, { role: "assistant", text: res.data.answer }]);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to get a response");
      setMessages((prev) => [...prev, { role: "assistant", text: "Sorry, I couldn't process that. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <Navbar />
      <h1 className="page-title">Finance Assistant</h1>
      <p className="page-subtitle">Ask questions about your real spending data</p>

      <div className="card" style={{ display: "flex", flexDirection: "column", height: 480, maxWidth: 720, padding: 0 }}>
        <div style={{ flex: 1, padding: 20, display: "flex", flexDirection: "column", gap: 10, overflowY: "auto" }}>
          {messages.map((m, i) => (
            <div key={i} className={`chat-bubble ${m.role === "user" ? "user" : "assistant"}`}>
              {m.text}
            </div>
          ))}
          {loading && <div className="chat-bubble assistant">Thinking...</div>}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSend} style={{ display: "flex", gap: 10, padding: 15, borderTop: "1px solid var(--border)" }}>
          <input
            type="text"
            placeholder="e.g. Where did I spend the most this month?"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="input"
            style={{ flex: 1 }}
            disabled={loading}
          />
          <button type="submit" disabled={loading || !input.trim()} className="btn btn-primary">Send</button>
        </form>

        {error && <p style={{ color: "var(--danger)", padding: "0 15px 15px" }}>{error}</p>}
      </div>

      <div style={{ marginTop: 15, display: "flex", gap: 10, flexWrap: "wrap", maxWidth: 720 }}>
        {[
          "Where did I spend the most this month?",
          "How much did I spend on food?",
          "Am I saving enough money?",
          "Can I afford something worth ₹10000 right now?",
        ].map((q) => (
          <button key={q} onClick={() => setInput(q)} className="suggestion-chip" type="button">
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}