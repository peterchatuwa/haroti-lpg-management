import { useMutation } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../lib/api';
import { useAuthStore } from '../store/auth';

export function AcceptInvitePage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');

  const accept = useMutation({
    mutationFn: () => api.post('/auth/accept-invite', { token, password }),
    onSuccess: (res) => {
      setSession(res.data.accessToken, res.data.user);
      navigate('/', { replace: true });
    },
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Could not accept invite';
      setError(message);
    },
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    accept.mutate();
  };

  if (!token) {
    return (
      <div className="login-shell">
        <div className="login-panel" style={{ margin: '4rem auto', maxWidth: 480 }}>
          <h2>Invalid invite link</h2>
          <p className="muted">This invite link is missing or malformed.</p>
          <Link to="/login" className="btn btn-primary">
            Go to staff login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="login-shell">
      <div className="login-panel" style={{ margin: '4rem auto', maxWidth: 480 }}>
        <h2>Set up your Haroti Gas account</h2>
        <p className="muted" style={{ marginBottom: '1.5rem' }}>
          Choose a password to activate your staff account.
        </p>
        {error && <div className="panel warn-panel">{error}</div>}
        <form className="stack" onSubmit={onSubmit}>
          <label>
            New password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
              autoComplete="new-password"
            />
          </label>
          <label>
            Confirm password
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              minLength={8}
              required
              autoComplete="new-password"
            />
          </label>
          <button className="btn btn-primary" type="submit" disabled={accept.isPending}>
            Activate account
          </button>
        </form>
      </div>
    </div>
  );
}
