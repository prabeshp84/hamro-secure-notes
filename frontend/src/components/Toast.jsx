export function Toast({ toast }) {
  if (!toast.show) return null;
  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      background: toast.type === 'error' ? 'var(--neon-pink)' : 'var(--neon-blue)',
      color: '#000',
      padding: '1rem 1.5rem',
      borderRadius: '8px',
      fontWeight: 'bold',
      zIndex: 1000,
      boxShadow: '0 0 20px currentColor',
      fontFamily: 'var(--font-tech)',
      fontSize: '0.9rem',
      maxWidth: '320px',
      wordBreak: 'break-word'
    }}>
      {toast.msg}
    </div>
  );
}
