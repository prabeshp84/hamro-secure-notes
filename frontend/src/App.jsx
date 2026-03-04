import { useState, useCallback } from 'react';
import { useAuth } from './hooks/useAuth';
import { useNotes } from './hooks/useNotes';
import { AuthForm } from './components/AuthForm';
import { NoteCard } from './components/NoteCard';
import { NoteEditor } from './components/NoteEditor';
import { Toast } from './components/Toast';

const HamroLogo = ({ style }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" style={style}>
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

const UnlockIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>;
const LogoutIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;

export default function App() {
  const { token, keyPair, register, login, logout } = useAuth();
  const { notes, loading: notesLoading, fetchNotes, decryptAll, createNote, updateNote, deleteNote } = useNotes(token, keyPair);

  const [toast, setToast] = useState({ show: false, msg: '', type: 'info' });
  const [vaultKey, setVaultKey] = useState('');
  const [decryptLoading, setDecryptLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [editingId, setEditingId] = useState(null);

  const showToast = useCallback((msg, type = 'info') => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 3500);
  }, []);

  // --- AUTH ---
  const handleAuth = async (email, password, isRegistering) => {
    if (isRegistering) {
      showToast('⚙️ Generating keys...', 'info');
      await register(email, password);
      showToast('✅ Account created! Please log in.', 'success');
    } else {
      showToast('🔓 Authenticating...', 'info');
      const tok = await login(email, password);
      await fetchNotes(tok);
      showToast('✅ Welcome back!', 'success');
    }
  };

  const handleLogout = () => {
    logout();
    setVaultKey('');
    setTitle('');
    setContent('');
    setEditingId(null);
  };

  // --- DECRYPT ---
  const handleDecryptAll = async () => {
    if (!vaultKey) return showToast('⚠️ Enter your password first', 'error');
    setDecryptLoading(true);
    try {
      const count = await decryptAll(vaultKey);
      showToast(`🔓 Decrypted ${count} note${count !== 1 ? 's' : ''}`, 'success');
    } catch (err) {
      showToast(`❌ ${err.message}`, 'error');
    } finally {
      setDecryptLoading(false);
      // FIX: Clear vaultKey from state after decryption — don't hold password in memory
      setVaultKey('');
    }
  };

  // --- NOTES ---
  const handleSave = async () => {
    if (!content.trim()) return showToast('⚠️ Note content is empty', 'error');
    if (!vaultKey) return showToast('⚠️ Enter your password to encrypt', 'error');
    if (!keyPair) return showToast('⚠️ Keys not loaded', 'error');

    setSaveLoading(true);
    try {
      if (editingId) {
        await updateNote(editingId, title, content, vaultKey);
        showToast('✅ Note updated', 'success');
        setEditingId(null);
      } else {
        await createNote(title, content, vaultKey);
        showToast('✍️ Note saved', 'success');
      }
      setTitle('');
      setContent('');
      setVaultKey('');
    } catch (err) {
      showToast(`❌ ${err.message}`, 'error');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleStartEdit = (note) => {
    setTitle(note.title);
    setContent(note.content);
    setEditingId(note._id);
    showToast('✏️ Editing mode active', 'info');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setTitle('');
    setContent('');
    setEditingId(null);
  };

  const handleDelete = async (id) => {
    try {
      await deleteNote(id);
      showToast('🗑️ Note deleted', 'info');
    } catch (err) {
      showToast(`❌ ${err.message}`, 'error');
    }
  };

  // --- RENDER ---
  if (!token) {
    return (
      <>
        <Toast toast={toast} />
        <AuthForm onAuth={handleAuth} showToast={showToast} />
      </>
    );
  }

  return (
    <div className="container">
      <Toast toast={toast} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <HamroLogo style={{ width: '36px' }} />
          <h2 style={{ fontFamily: 'var(--font-tech)', letterSpacing: '2px' }}>HAMRO SECURE NOTES</h2>
        </div>
        <button onClick={handleLogout} style={{ width: 'auto', color: 'var(--neon-pink)', borderColor: 'var(--neon-pink)', display: 'flex', alignItems: 'center', gap: '6px', padding: '0.5rem 1rem' }}>
          LOGOUT <LogoutIcon />
        </button>
      </div>

      {/* Decrypt Panel */}
      <div className="glass-panel" style={{ marginBottom: 30 }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <input
            type="password"
            placeholder="ENTER PASSWORD TO DECRYPT / ENCRYPT..."
            value={vaultKey}
            onChange={e => setVaultKey(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleDecryptAll()}
            style={{ flex: 1, marginBottom: 0, minWidth: '200px' }}
          />
          <button
            onClick={handleDecryptAll}
            disabled={decryptLoading}
            style={{ width: 'auto', padding: '1rem', display: 'flex', alignItems: 'center', gap: '8px', opacity: decryptLoading ? 0.6 : 1 }}
          >
            <UnlockIcon /> {decryptLoading ? 'DECRYPTING...' : 'DECRYPT ALL'}
          </button>
        </div>
      </div>

      {/* Note Editor */}
      <NoteEditor
        title={title}
        setTitle={setTitle}
        content={content}
        setContent={setContent}
        editingId={editingId}
        onSave={handleSave}
        onCancel={handleCancelEdit}
        loading={saveLoading}
        vaultKey={vaultKey}
        setVaultKey={setVaultKey}
      />

      {/* Notes Grid */}
      {notesLoading ? (
        <div style={{ textAlign: 'center', color: 'var(--neon-blue)', fontFamily: 'var(--font-tech)', padding: '2rem' }}>
          LOADING VAULT...
        </div>
      ) : notes.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#444', fontFamily: 'var(--font-tech)', padding: '3rem' }}>
          NO NOTES YET. CREATE YOUR FIRST ENCRYPTED NOTE ABOVE.
        </div>
      ) : (
        <div className="vault-grid">
          {notes.map(n => (
            <NoteCard
              key={n._id}
              note={n}
              isEditing={editingId === n._id}
              onEdit={handleStartEdit}
              onDelete={handleDelete}
              showToast={showToast}
            />
          ))}
        </div>
      )}
    </div>
  );
}
