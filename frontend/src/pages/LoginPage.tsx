import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { FlameMark } from '../components/FlameMark';
import api from '../lib/api';
import { useAuthStore } from '../store/auth';

const DEMOS = [
  { label: 'Admin', username: 'admin' },
  { label: 'Director', username: 'director' },
  { label: 'LLW Attendant', username: 'llw01.attendant' },
  { label: 'BT Attendant', username: 'bt01.attendant' },
];

export function LoginPage() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('Password123!');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const setSession = useAuthStore((s) => s.setSession);
  const navigate = useNavigate();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/login', { username, password });
      setSession(data.accessToken, data.user);
      navigate('/');
    } catch {
      setError('Invalid username or password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <section className="login-hero" aria-label="Haroti Holdings brand">
        <div className="login-hero-content">
          <FlameMark size={64} />
          <h1>Haroti Holdings</h1>
          <p className="lede">
            Central command for LPG across Salima, Lilongwe and Blantyre —
            stock, sales, cash and cylinders in one flame-lit view.
          </p>
        </div>
        <div className="login-metrics">
          <div className="login-metric">
            <strong>8</strong>
            <span>Active stations</span>
          </div>
          <div className="login-metric">
            <strong>3</strong>
            <span>Operating districts</span>
          </div>
          <div className="login-metric">
            <strong>24/7</strong>
            <span>Offline-ready POS</span>
          </div>
        </div>
      </section>

      <section className="login-panel">
        <form className="login-card" onSubmit={onSubmit}>
          <FlameMark size={44} />
          <h2>Sign in</h2>
          <p>Access the LPG operations console for your role and station.</p>
          {error && <div className="error">{error}</div>}
          <div className="form-grid">
            <label>
              Username
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </label>
            <button className="btn btn-accent" disabled={loading}>
              {loading ? 'Signing in…' : 'Enter operations'}
            </button>
          </div>
          <div className="demo-row">
            {DEMOS.map((d) => (
              <button
                key={d.username}
                type="button"
                onClick={() => {
                  setUsername(d.username);
                  setPassword('Password123!');
                }}
              >
                {d.label}
              </button>
            ))}
          </div>
        </form>
      </section>
    </div>
  );
}
