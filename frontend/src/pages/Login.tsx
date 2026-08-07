import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Key, Mail, Lock, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      // Success, call global login context
      login(data.id, data.token, data.name, data.email, data.role);
    } catch (err: any) {
      setError(err.message || 'Unable to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleSeedLogin = (seedEmail: string) => {
    setEmail(seedEmail);
    setPassword('password');
    // We let the user click "Sign In" or we can trigger it.
    // Triggering next tick:
    setTimeout(() => {
      const form = document.querySelector('form');
      if (form) {
        form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      }
    }, 100);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo">
            <Shield size={28} />
          </div>
          <h1 className="auth-title">Project KEYSTONE</h1>
          <p className="auth-subtitle">Field Service Management Platform</p>
        </div>

        {error && (
          <div className="alert alert-danger">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail
                size={18}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
              />
              <input
                id="email"
                type="email"
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="name@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={18}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
              />
              <input
                id="password"
                type="password"
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="••••••••"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Signing In...
              </>
            ) : (
              <>
                <Key size={18} />
                Sign In
              </>
            )}
          </button>
        </form>

        <div className="seed-logins-box">
          <div className="seed-logins-title">Quick Demo Logins</div>
          <div className="seed-buttons-grid">
            <button
              type="button"
              className="btn-seed"
              onClick={() => handleSeedLogin('manager@gmail.com')}
              disabled={loading}
            >
              Mohit
              <span className="seed-role-badge">Manager</span>
            </button>
            <button
              type="button"
              className="btn-seed"
              onClick={() => handleSeedLogin('dispatcher@gmail.com')}
              disabled={loading}
            >
              Abhishek
              <span className="seed-role-badge">Dispatcher</span>
            </button>
            <button
              type="button"
              className="btn-seed"
              onClick={() => handleSeedLogin('tech1@gmail.com')}
              disabled={loading}
            >
              naman
              <span className="seed-role-badge">Technician</span>
            </button>
            <button
              type="button"
              className="btn-seed"
              onClick={() => handleSeedLogin('client@keystone.com')}
              disabled={loading}
            >
              saurav
              <span className="seed-role-badge">Customer</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
