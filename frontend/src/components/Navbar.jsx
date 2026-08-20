import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/transactions", label: "Transactions" },
  { to: "/budget", label: "Budget" },
  { to: "/chat", label: "Assistant" },
  { to: "/reports", label: "Reports" },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  return (
    <div className="navbar">
      <Link to="/dashboard" className="navbar-brand">
        <span className="navbar-brand-mark">₹</span>
        FinTrack
      </Link>
      <div className="navbar-links">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={`navbar-link ${location.pathname === item.to ? "active" : ""}`}
          >
            {item.label}
          </Link>
        ))}
      </div>
      <div className="navbar-user">
        <button 
          onClick={() => setIsDark(!isDark)} 
          className="btn btn-ghost btn-sm"
          title="Toggle Theme"
          style={{ fontSize: "16px", padding: "4px 8px" }}
        >
          {isDark ? "☀️" : "🌙"}
        </button>
        <span style={{ fontSize: 14, color: "var(--text-muted)" }}>{user?.name}</span>
        <button onClick={logout} className="btn btn-ghost btn-sm">Logout</button>
      </div>
    </div>
  );
}