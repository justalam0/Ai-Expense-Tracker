import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';

export default function Signup() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const res = await axiosInstance.post('/auth/signup', { name, email, password });
      setMessage(res.data.message);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axiosInstance.post('/auth/verify-otp', { email, otp });
      login(res.data.user, res.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="centered-page">
      <div className="auth-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <span className="navbar-brand-mark">₹</span>
          <span style={{ fontWeight: 700, fontSize: 17 }}>FinTrack</span>
        </div>
        
        {step === 1 ? (
          <>
            <h2 style={{ margin: '0 0 4px 0' }}>Create your account</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>Start tracking smarter</p>
            <form onSubmit={handleSignup}>
              <input
                type="text"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="input"
                style={{ display: 'block', width: '100%', marginBottom: 12 }}
              />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input"
                style={{ display: 'block', width: '100%', marginBottom: 12 }}
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input"
                style={{ display: 'block', width: '100%', marginBottom: 16 }}
              />
              {error && <p style={{ color: 'var(--danger)', fontSize: 14 }}>{error}</p>}
              <button type="submit" disabled={loading} className="btn btn-primary btn-block">
                {loading ? 'Sending OTP...' : 'Sign Up'}
              </button>
            </form>
            <p style={{ fontSize: 14, marginTop: 18, textAlign: 'center' }}>
              Already have an account? <Link to="/login">Login</Link>
            </p>
          </>
        ) : (
          <>
            <h2 style={{ margin: '0 0 4px 0' }}>Verify your email</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>
              {message || `We sent a 6-digit code to ${email}`}
            </p>
            <form onSubmit={handleVerify}>
              <input
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                className="input"
                maxLength={6}
                style={{ display: 'block', width: '100%', marginBottom: 16, textAlign: 'center', letterSpacing: 4, fontSize: 18 }}
              />
              {error && <p style={{ color: 'var(--danger)', fontSize: 14 }}>{error}</p>}
              <button type="submit" disabled={loading} className="btn btn-primary btn-block">
                {loading ? 'Verifying...' : 'Verify & Continue'}
              </button>
              <button 
                type="button" 
                onClick={() => setStep(1)} 
                className="btn btn-ghost btn-block" 
                style={{ marginTop: 10 }}
              >
                Back
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
