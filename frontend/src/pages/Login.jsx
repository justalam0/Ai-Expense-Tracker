import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await axiosInstance.post("/auth/login", { email, password });
      login(res.data.user, res.data.token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    }
  };

  return (
    <div className="centered-page">
      <div className="auth-card">
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
          <span className="navbar-brand-mark">₹</span>
          <span style={{ fontWeight: 700, fontSize: 17 }}>FinTrack</span>
        </div>
        <h2 style={{ margin: "0 0 4px 0" }}>Welcome back</h2>
        <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 20 }}>Log in to your account</p>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="input"
            style={{ display: "block", width: "100%", marginBottom: 12 }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="input"
            style={{ display: "block", width: "100%", marginBottom: 16 }}
          />
          {error && <p style={{ color: "var(--danger)", fontSize: 14 }}>{error}</p>}
          <button type="submit" className="btn btn-primary btn-block">Login</button>
        </form>
        <p style={{ fontSize: 14, marginTop: 18, textAlign: "center" }}>
          Don't have an account? <Link to="/signup">Sign Up</Link>
        </p>
      </div>
    </div>
  );
}