import { useState } from 'react';

const HamroLogo = ({ className, style }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className={className} style={style}>
    <path d="M50 5 L90 25 V50 C90 75 50 95 50 95 C50 95 10 75 10 50 V25 L50 5Z" fill="rgba(0,20,40,0.5)" stroke="var(--neon-blue)" strokeWidth="2"/>
    <g stroke="var(--neon-pink)" strokeWidth="4" strokeLinecap="round">
      <line x1="35" y1="35" x2="35" y2="65" />
      <line x1="65" y1="35" x2="65" y2="65" />
      <line x1="35" y1="50" x2="65" y2="50" stroke="var(--neon-blue)" />
    </g>
    <g fill="var(--neon-blue)">
      <circle cx="35" cy="35" r="4" /><circle cx="35" cy="50" r="3" /><circle cx="35" cy="65" r="4" />
      <circle cx="65" cy="35" r="4" /><circle cx="65" cy="50" r="3" /><circle cx="65" cy="65" r="4" />
      <circle cx="50" cy="50" r="4" fill="var(--neon-pink)" />
    </g>
  </svg>
);

export function AuthForm({ onAuth, showToast }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [creds, setCreds] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const hasLocalKey = !!localStorage.getItem('hamro_enc_privkey');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      await onAuth(creds.email, creds.password, isRegistering);
    } catch (err) {
      showToast(err.message || 'Auth failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '450px' }}>
      <div className="glass-panel" style={{ textAlign: 'center' }}>
        <HamroLogo className="cyber-logo" style={{ width: '100px', margin: '0 auto 20px', display: 'block' }} />
        <h1 className="glitch-title">HAMRO SECURE NOTES</h1>

        {isRegistering && hasLocalKey && (
          <div style={{
            background: 'rgba(255, 165, 0, 0.15)',
            border: '1px solid orange',
            borderRadius: '6px',
            padding: '0.75rem',
            marginBottom: '1rem',
            color: 'orange',
            fontSize: '0.8rem',
            fontFamily: 'var(--font-tech)'
          }}>
            ⚠️ A key already exists on this device. Registering a new account will replace it.
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <input
            placeholder="EMAIL"
            type="email"
            value={creds.email}
            onChange={e => setCreds({ ...creds, email: e.target.value })}
            required
            disabled={loading}
          />
          <input
            type="password"
            placeholder={isRegistering ? 'PASSWORD (min 8 chars)' : 'PASSWORD'}
            value={creds.password}
            onChange={e => setCreds({ ...creds, password: e.target.value })}
            minLength={isRegistering ? 8 : undefined}
            required
            disabled={loading}
          />
          <button type="submit" disabled={loading}>
            {loading
              ? (isRegistering ? '⚙️ GENERATING KEYS...' : '🔓 LOGGING IN...')
              : (isRegistering ? 'REGISTER' : 'LOGIN')}
          </button>
        </form>

        <button className="secondary" onClick={() => setIsRegistering(!isRegistering)} disabled={loading}>
          {isRegistering ? 'BACK TO LOGIN' : 'CREATE ACCOUNT'}
        </button>

        {!isRegistering && (
          <p style={{ marginTop: '1rem', fontSize: '0.75rem', color: '#666', fontFamily: 'var(--font-tech)' }}>
            🔐 Your private key is stored locally on this device
          </p>
        )}
      </div>
    </div>
  );
}
