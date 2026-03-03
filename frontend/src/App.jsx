import { useState, useEffect, useRef } from 'react';
import { encryptData, decryptData, generateKeyPair, signData, verifySignature, exportKey, importKey } from './utils/crypto';

const API_URL = 'http://localhost:5000/api';

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

const LockIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>;
const UnlockIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>;
const SaveIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>;
const LogoutIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>;
const TrashIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;
const ShieldIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>;
// NEW: Edit Icon
const EditIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;

function App() {
  const [view, setView] = useState('auth'); 
  const [isRegistering, setIsRegistering] = useState(false);
  const [creds, setCreds] = useState({ email: '', password: '' });
  const [vaultKey, setVaultKey] = useState(''); 
  const [token, setToken] = useState(null);
  const [notes, setNotes] = useState([]);
  
  // New State for Editing
  const [newTitle, setNewTitle] = useState('');
  const [newNote, setNewNote] = useState('');
  const [editingId, setEditingId] = useState(null); // Tracks which note ID we are editing

  const [keyPair, setKeyPair] = useState(null);
  const [toast, setToast] = useState({ show: false, msg: '', type: 'info' });

  const showToast = (msg, type = 'info') => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ ...toast, show: false }), 3000);
  };

  const api = async (endpoint, method, body) => {
    try {
      const res = await fetch(`${API_URL}/${endpoint}`, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' },
        body: body ? JSON.stringify(body) : null
      });
      return res;
    } catch (e) { showToast("❌ Server Offline", "error"); return null; }
  };

  const fetchNotes = async (authToken) => {
    const res = await fetch(`${API_URL}/notes`, { headers: { 'Authorization': `Bearer ${authToken}` } });
    if(res.ok) {
      const data = await res.json();
      setNotes(data.map(n => ({...n, isDecrypted: false, isVerified: false})));
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    if (isRegistering) {
      showToast("⚙️ Generating Identity...", "info");
      const keys = await generateKeyPair();
      const pubKey = await exportKey(keys.publicKey);
      const privKeyRaw = await exportKey(keys.privateKey);
      const wrappedPrivKey = await encryptData(privKeyRaw, creds.password); 
      const res = await api('register', 'POST', { ...creds, publicKey: pubKey, privateKey: JSON.stringify(wrappedPrivKey) });
      if (res && res.ok) { showToast("✅ Identity Saved.", "success"); setIsRegistering(false); }
      else showToast("⚠️ Registration Failed", "error");
    } else {
      const res = await api('login', 'POST', creds);
      if (res && res.ok) {
        const data = await res.json();
        setToken(data.token);
        try {
          const encryptedPrivKey = JSON.parse(data.privateKey);
          const privKeyRaw = await decryptData(encryptedPrivKey, creds.password); 
          const priv = await importKey(privKeyRaw, "private");
          const pub = await importKey(data.publicKey, "public");
          setKeyPair({ publicKey: pub, privateKey: priv });
          showToast("🔓 Identity Loaded", "success");
          setView('dashboard'); fetchNotes(data.token);
        } catch (err) { showToast("❌ Decryption Failed", "error"); }
      } else showToast("⛔ Invalid Credentials", "error");
    }
  };

  const handleLogout = () => { setToken(null); setNotes([]); setVaultKey(''); setKeyPair(null); setCreds({ email: '', password: '' }); setView('auth'); };

  const handleDecryptAll = async () => {
    if (!vaultKey) return showToast("⚠️ Enter Password", "error");
    showToast("🔄 Decrypting...", "info");
    
    let failCount = 0;
    let successCount = 0;

    const processed = await Promise.all(notes.map(async (n) => {
      if (n.isDecrypted) return n;
      try {
        const plain = await decryptData(n, vaultKey);
        let verified = false;
        if (n.signature && keyPair?.publicKey) verified = await verifySignature(plain, n.signature, keyPair.publicKey);
        successCount++;
        return { ...n, content: plain, isDecrypted: true, isVerified: verified };
      } catch {
        failCount++;
        return n;
      }
    }));
    
    setNotes(processed);
    if (failCount > 0 && successCount === 0) showToast("❌ Incorrect Password", "error");
    else if (successCount > 0) showToast(`🔓 Decrypted ${successCount} notes`, "success");
  };

  // --- NEW: Handle Start Editing ---
  const handleStartEdit = (note) => {
    if (!note.isDecrypted) return showToast("🔒 Decrypt first to edit", "error");
    setNewTitle(note.title);
    setNewNote(note.content); // Use the decrypted content
    setEditingId(note._id);
    showToast("✏️ Editing Mode Active", "info");
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setNewTitle('');
    setNewNote('');
    setEditingId(null);
  };

  // --- UPDATED: Handle Save or Update ---
  const handleSave = async () => {
    if (!newNote.trim() || !vaultKey || !keyPair) return showToast("⚠️ Check Inputs/Keys", "error");
    
    // 1. Re-encrypt with the current vault key
    const encrypted = await encryptData(newNote, vaultKey);
    const signature = await signData(newNote, keyPair.privateKey);

    if (editingId) {
      // --- UPDATE MODE ---
      const res = await api(`notes/${editingId}`, 'PUT', { title: newTitle || "Doc", ...encrypted, signature });
      if (res && res.ok) {
        showToast("✅ Note Updated", "success");
        setEditingId(null);
      }
    } else {
      // --- CREATE MODE ---
      const res = await api('notes', 'POST', { title: newTitle || "Doc", ...encrypted, signature });
      if (res && res.ok) showToast("✍️ Note Created", "success");
    }

    setNewNote(''); 
    setNewTitle(''); 
    fetchNotes(token); // Refresh list
  };

  const handleDelete = async (id) => {
    if(confirm("⚠️ Delete?")) { await api(`notes/${id}`, 'DELETE'); setNotes(notes.filter(n => n._id !== id)); }
  };

  const Toast = () => (
    toast.show && (
      <div style={{
        position: 'fixed', top: '20px', right: '20px', 
        background: toast.type === 'error' ? 'var(--neon-pink)' : 'var(--neon-blue)',
        color: '#000', padding: '1rem', borderRadius: '8px', 
        fontWeight: 'bold', zIndex: 1000, boxShadow: '0 0 15px currentColor'
      }}>
        {toast.msg}
      </div>
    )
  );

  if (view === 'auth') return (
    <div className="container" style={{maxWidth: '450px'}}>
      <Toast />
      <div className="glass-panel" style={{textAlign: 'center'}}>
        <HamroLogo className="cyber-logo" style={{ width: '100px', margin: '0 auto 20px', display:'block' }} />
        <h1 className="glitch-title">HAMRO SECURE NOTES</h1>
        <form onSubmit={handleAuth}>
          <input placeholder="EMAIL" value={creds.email} onChange={e => setCreds({...creds, email: e.target.value})} required />
          <input type="password" placeholder="PASSWORD" value={creds.password} onChange={e => setCreds({...creds, password: e.target.value})} required />
          <button>{isRegistering ? 'REGISTER' : 'LOGIN'}</button>
        </form>
        <button className="secondary" onClick={() => setIsRegistering(!isRegistering)}>{isRegistering ? "BACK" : "CREATE ACCOUNT"}</button>
      </div>
    </div>
  );

  return (
    <div className="container">
      <Toast />
      <div style={{display:'flex', justifyContent:'space-between', marginBottom:30}}>
        <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
            <HamroLogo style={{width:'40px'}} /> 
            <h2>HAMRO SECURE NOTES</h2>
        </div>
        <button onClick={handleLogout} style={{width:'auto', color:'var(--neon-pink)'}}>TERMINATE <LogoutIcon /></button>
      </div>
      
      <div className="glass-panel" style={{marginBottom: 30, padding: '1.5rem'}}>
        <input type="password" placeholder="ENTER DECRYPTION PASSWORD..." value={vaultKey} onChange={e => setVaultKey(e.target.value)} />
        <button onClick={handleDecryptAll}><UnlockIcon/> DECRYPT & VERIFY</button>
      </div>

      {/* EDITOR PANEL */}
      <div className="glass-panel" style={{marginBottom: 30, border: editingId ? '1px solid var(--neon-green)' : '1px solid var(--glass-border)'}}>
        {editingId && <div style={{color:'var(--neon-green)', marginBottom:10}}>✏️ EDITING MODE ACTIVE</div>}
        <input placeholder="TITLE..." value={newTitle} onChange={e => setNewTitle(e.target.value)} />
        <textarea placeholder="DATA..." value={newNote} onChange={e => setNewNote(e.target.value)} />
        
        <div style={{display: 'flex', gap: '10px'}}>
            <button onClick={handleSave} style={{background: editingId ? 'rgba(0, 255, 65, 0.2)' : ''}}>
                <SaveIcon/> {editingId ? "UPDATE ENCRYPTED" : "SAVE ENCRYPTED"}
            </button>
            
            {editingId && (
                <button onClick={handleCancelEdit} style={{background: 'rgba(255, 0, 85, 0.2)', color: 'var(--neon-pink)', borderColor: 'var(--neon-pink)'}}>
                    CANCEL
                </button>
            )}
        </div>
      </div>

      <div className="vault-grid">
        {notes.map(n => (
          <div key={n._id} className="note-card" style={{borderColor: editingId === n._id ? 'var(--neon-green)' : ''}}>
            <h4>{n.title}</h4>
            <div style={{fontSize:'0.9rem', color: n.isDecrypted ? '#fff' : 'var(--neon-pink)', wordBreak:'break-all'}}>
              {n.isDecrypted ? (
                <>
                   {n.content}
                   <div style={{marginTop:10, fontSize:'0.7rem', color: n.isVerified ? 'var(--neon-green)' : 'red'}}>
                      <ShieldIcon /> {n.isVerified ? "VERIFIED" : "INVALID SIG"}
                   </div>
                </>
              ) : <span>ENCRYPTED DATA...</span>}
            </div>
            
            <div style={{marginTop:15, display:'flex', gap:'10px'}}>
                {/* DELETE BUTTON */}
                <button onClick={() => handleDelete(n._id)} className="icon-btn" style={{padding: '5px'}}><TrashIcon/></button>
                
                {/* EDIT BUTTON - Only visible if Decrypted */}
                {n.isDecrypted && (
                    <button onClick={() => handleStartEdit(n)} className="icon-btn" style={{padding: '5px', color: 'var(--neon-green)', borderColor: 'var(--neon-green)'}}>
                        <EditIcon/>
                    </button>
                )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
export default App;