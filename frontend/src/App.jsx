import { useState, useEffect, useRef } from 'react';
import { encryptData, decryptData, generateKeyPair, signData, verifySignature, exportKey, importKey } from './utils/crypto';

const API_URL = 'http://localhost:5000/api';

// --- NEW: CUSTOM HAMRO CYBER LOGO SVG ---
const HamroLogo = ({ className, style }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className={className} style={style}>
    {/* Shield Outline */}
    <path d="M50 5 L90 25 V50 C90 75 50 95 50 95 C50 95 10 75 10 50 V25 L50 5Z" fill="rgba(0,20,40,0.5)" stroke="var(--neon-blue)" strokeWidth="2"/>
    
    {/* Circuit 'H' Structure */}
    <g stroke="var(--neon-pink)" strokeWidth="4" strokeLinecap="round">
      {/* Left Pillar */}
      <line x1="35" y1="35" x2="35" y2="65" />
      {/* Right Pillar */}
      <line x1="65" y1="35" x2="65" y2="65" />
      {/* Center Connector */}
      <line x1="35" y1="50" x2="65" y2="50" stroke="var(--neon-blue)" />
    </g>
    
    {/* Circuit Nodes (Glowing Dots) */}
    <g fill="var(--neon-blue)">
      <circle cx="35" cy="35" r="4" /><circle cx="35" cy="50" r="3" /><circle cx="35" cy="65" r="4" />
      <circle cx="65" cy="35" r="4" /><circle cx="65" cy="50" r="3" /><circle cx="65" cy="65" r="4" />
      <circle cx="50" cy="50" r="4" fill="var(--neon-pink)" />
    </g>
    
    {/* Glitch lines for style */}
    <path d="M20 20 L30 20" stroke="var(--neon-blue)" strokeWidth="1" opacity="0.6"/>
    <path d="M70 80 L80 80" stroke="var(--neon-pink)" strokeWidth="1" opacity="0.6"/>
  </svg>
);

// --- Existing Icons ---
const LockIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>;
const UnlockIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>;
const SaveIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>;
const LogoutIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>;
const TrashIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;
const ShieldIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>;
const CodeIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>;

function App() {
  const [view, setView] = useState('auth'); 
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Data State
  const [creds, setCreds] = useState({ email: '', password: '' });
  const [vaultKey, setVaultKey] = useState(''); 
  const [token, setToken] = useState(null);
  const [notes, setNotes] = useState([]);
  
  // Note Input State
  const [newTitle, setNewTitle] = useState('');
  const [newNote, setNewNote] = useState('');
  
  // PKI State
  const [keyPair, setKeyPair] = useState(null);

  // UI State
  const [toast, setToast] = useState({ show: false, msg: '', type: 'info' });
  
  // Cursor Refs
  const dotRef = useRef(null);
  const outlineRef = useRef(null);

  // --- CURSOR LOGIC ---
  useEffect(() => {
    const moveCursor = (e) => {
      const { clientX: x, clientY: y } = e;
      if (dotRef.current) {
        dotRef.current.style.left = `${x}px`;
        dotRef.current.style.top = `${y}px`;
      }
      if (outlineRef.current) {
        outlineRef.current.animate({
          left: `${x}px`,
          top: `${y}px`
        }, { duration: 500, fill: "forwards" });
      }
    };
    const mouseDown = () => document.body.classList.add('mousedown');
    const mouseUp = () => document.body.classList.remove('mousedown');

    window.addEventListener('mousemove', moveCursor);
    window.addEventListener('mousedown', mouseDown);
    window.addEventListener('mouseup', mouseUp);

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      window.removeEventListener('mousedown', mouseDown);
      window.removeEventListener('mouseup', mouseUp);
    };
  }, []);

  // --- HELPERS ---
  const showToast = (msg, type = 'info') => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ ...toast, show: false }), 3000);
  };

  const api = async (endpoint, method, body) => {
    try {
      const res = await fetch(`${API_URL}/${endpoint}`, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '' 
        },
        body: body ? JSON.stringify(body) : null
      });
      return res;
    } catch (e) {
      showToast("❌ Server Offline", "error");
      return null;
    }
  };

  const fetchNotes = async (authToken) => {
    const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` };
    try {
      const res = await fetch(`${API_URL}/notes`, { headers });
      if(res.ok) {
        const data = await res.json();
        setNotes(data.map(n => ({...n, isDecrypted: false, isVerified: false})));
      }
    } catch (e) { console.error(e); }
  };

  // --- SECURE AUTH HANDLER ---
  const handleAuth = async (e) => {
    e.preventDefault();
    
    if (isRegistering) {
      showToast("⚙️ Generating Secure Identity...", "info");
      const keys = await generateKeyPair();
      const pubKey = await exportKey(keys.publicKey);
      const privKeyRaw = await exportKey(keys.privateKey);
      const wrappedPrivKey = await encryptData(privKeyRaw, creds.password);
      const privKeyStorage = JSON.stringify(wrappedPrivKey);

      const res = await api('register', 'POST', { 
        ...creds, 
        publicKey: pubKey, 
        privateKey: privKeyStorage 
      });
      
      if (res && res.ok) { 
        showToast("✅ Identity Saved.", "success"); 
        setIsRegistering(false); 
      } else {
        showToast("⚠️ Registration Failed", "error");
      }

    } else {
      const res = await api('login', 'POST', creds);
      if (res) {
        if (!res.ok) { showToast("⛔ Invalid Credentials", "error"); return; }
        const data = await res.json();
        if (data.token) {
          setToken(data.token);
          if (data.publicKey && data.privateKey) {
            try {
              const pub = await importKey(data.publicKey, "public");
              const encryptedPrivKey = JSON.parse(data.privateKey);
              const privKeyRaw = await decryptData(encryptedPrivKey, creds.password);
              const priv = await importKey(privKeyRaw, "private");
              setKeyPair({ publicKey: pub, privateKey: priv });
              showToast("🔓 Identity Decrypted & Loaded", "success");
            } catch (err) {
              console.error(err);
              showToast("❌ Key Decryption Failed", "error");
            }
          } else {
            showToast("⚠️ No Keys Found", "error");
          }
          setView('dashboard'); 
          fetchNotes(data.token); 
        }
      }
    }
  };

  const handleLogout = () => {
    setToken(null);
    setNotes([]);
    setVaultKey('');
    setKeyPair(null);
    setCreds({ email: '', password: '' });
    setView('auth');
    showToast("👋 Session Terminated", "info");
  };

  const handleDecryptAll = async () => {
    if (!vaultKey) return showToast("⚠️ Enter Password First", "error");
    if (!keyPair) return showToast("⚠️ Keys Missing. Re-login.", "error");
    showToast("🔄 Decrypting...", "info");
    
    const processed = await Promise.all(notes.map(async (n) => {
      if (n.isDecrypted) return n; 
      try {
        const plain = await decryptData(n, vaultKey);
        let verified = false;
        if (n.signature && keyPair.publicKey) {
          verified = await verifySignature(plain, n.signature, keyPair.publicKey);
        }
        return { ...n, content: plain, isDecrypted: true, isVerified: verified };
      } catch {
        return { ...n, isDecrypted: false }; 
      }
    }));
    setNotes(processed);
    const successCount = processed.filter(n => n.isDecrypted).length;
    if (successCount > 0) showToast(`✅ ${successCount} Notes Unlocked`, "success");
    else showToast("❌ Wrong Password", "error");
  };

  const handleSave = async () => {
    if (!newNote.trim()) return;
    if (!vaultKey) return showToast("⚠️ Enter Encryption Password!", "error");
    if (!keyPair) return showToast("⚠️ Keys Missing", "error");
    
    const titleToSave = newTitle.trim() || "Secure Doc " + new Date().toLocaleTimeString();
    const encrypted = await encryptData(newNote, vaultKey);
    const signature = await signData(newNote, keyPair.privateKey);
    
    await api('notes', 'POST', { 
      title: titleToSave, 
      ...encrypted,
      signature: signature 
    });
    
    setNotes([{ 
      _id: Date.now(), 
      title: titleToSave, 
      content: newNote, 
      isDecrypted: true,
      isVerified: true, 
      ciphertext: encrypted.ciphertext 
    }, ...notes]);
    
    setNewNote('');
    setNewTitle('');
    showToast("✍️ Signed & Encrypted", "success");
  };

  const handleDelete = async (id) => {
    if(!confirm("⚠️ PERMANENT DELETE?")) return;
    const res = await api(`notes/${id}`, 'DELETE');
    if (res && res.ok) {
      setNotes(notes.filter(n => n._id !== id)); 
      showToast("🗑️ Record Purged", "error"); 
    }
  };

  const renderToast = () => (
    toast.show && (
      <div className={`cyber-toast ${toast.type}`}>
        {toast.msg}
      </div>
    )
  );

  const CreditFooter = () => (
    <div className="credit-footer">
      <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <CodeIcon /> 
        SYSTEM ARCHITECT: 
        <span style={{ color: 'var(--neon-blue)', fontWeight: 'bold', textShadow: '0 0 10px var(--neon-blue)' }}>
          PRABESH PAUDEL
        </span>
      </span>
    </div>
  );

  // --- VIEWS ---

  if (view === 'auth') return (
    <div className="container" style={{maxWidth: '450px'}}>
      <div ref={dotRef} className="cursor-dot"></div>
      <div ref={outlineRef} className="cursor-outline"></div>
      {renderToast()}

      <div className="glass-panel" style={{textAlign: 'center'}}>
        {/* --- LOGO ADDED HERE --- */}
        <HamroLogo className="cyber-logo" style={{ width: '100px', height: '100px', margin: '0 auto 20px', display:'block' }} />

        <h1 className="glitch-title" data-text="HAMRO SECURE NOTES" style={{marginBottom:'1rem'}}>HAMRO SECURE NOTES</h1>
        
        <div style={{textAlign:'center', marginBottom:'1.5rem', color:'var(--neon-blue)'}}>
          <p style={{fontSize:'0.7rem', marginTop:5, opacity:0.8, letterSpacing:'2px'}}>ZERO KNOWLEDGE ARCHITECTURE</p>
        </div>
        <form onSubmit={handleAuth} style={{textAlign:'left'}}>
          <input placeholder="DIGITAL IDENTITY (EMAIL)" value={creds.email} onChange={e => setCreds({...creds, email: e.target.value})} required />
          <input type="password" placeholder="PASSPHRASE" value={creds.password} onChange={e => setCreds({...creds, password: e.target.value})} required />
          <button>{isRegistering ? 'GENERATE KEYS & REGISTER' : 'AUTHENTICATE'}</button>
        </form>
        <button className="secondary" onClick={() => setIsRegistering(!isRegistering)}>
          {isRegistering ? "<< BACK TO LOGIN" : "CREATE NEW IDENTITY >>"}
        </button>
      </div>
      
      <CreditFooter />
    </div>
  );

  return (
    <div className="container">
      <div ref={dotRef} className="cursor-dot"></div>
      <div ref={outlineRef} className="cursor-outline"></div>
      {renderToast()}
      
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:30}}>
        {/* --- HEADER WITH MINI LOGO --- */}
        <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
            <HamroLogo className="cyber-logo" style={{width:'40px', height:'40px'}} />
            <h2 style={{fontFamily:'var(--font-tech)', letterSpacing:'2px', fontSize:'1.3rem'}}>
              HAMRO VAULT // <span style={{color:'var(--neon-blue)'}}>ONLINE</span>
            </h2>
        </div>

        <button onClick={handleLogout} style={{width:'auto', padding: '0.5rem 1rem', fontSize: '0.8rem', background: 'rgba(255,0,0,0.1)', borderColor: 'var(--neon-pink)', color: 'var(--neon-pink)', display: 'flex', alignItems: 'center', gap: '8px'}}>
          TERMINATE <LogoutIcon />
        </button>
      </div>

      <div className="glass-panel" style={{marginBottom: 30, padding: '1.5rem', border: '1px solid var(--neon-green)'}}>
        <div style={{display:'flex', gap:'10px', alignItems:'center', flexWrap:'wrap'}}>
          <div style={{flex: 1}}>
            <label style={{color:'var(--neon-green)', fontSize:'0.8rem', fontWeight:'bold', display:'block', marginBottom:5}}>
              MASTER KEY (FOR DECRYPTION)
            </label>
            <input type="password" placeholder="ENTER PASSPHRASE..." value={vaultKey} onChange={e => setVaultKey(e.target.value)} style={{margin:0, borderColor: 'var(--neon-green)'}} />
          </div>
          <button onClick={handleDecryptAll} style={{width:'auto', marginTop:'18px', background: 'rgba(0, 255, 65, 0.1)', borderColor: 'var(--neon-green)', color: 'var(--neon-green)'}}>
             <UnlockIcon/> DECRYPT & VERIFY
          </button>
        </div>
      </div>
      
      <div className="glass-panel" style={{marginBottom: 30}}>
        <input 
          type="text" 
          placeholder="SUBJECT / HEADING..." 
          value={newTitle} 
          onChange={e => setNewTitle(e.target.value)} 
          style={{marginBottom: '10px', fontWeight: 'bold', borderLeft: '3px solid var(--neon-blue)'}}
        />
        <textarea placeholder="ENTER CLASSIFIED DATA..." value={newNote} onChange={e => setNewNote(e.target.value)} />
        <div style={{textAlign: 'right'}}>
          <button onClick={handleSave} style={{width:'auto', display:'inline-flex', alignItems:'center', gap:10, padding:'0.8rem 2rem'}}>
            <SaveIcon/> SIGN & ENCRYPT
          </button>
        </div>
      </div>

      <div className="vault-grid">
        {notes.map(n => (
          <div key={n._id} className="note-card">
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'0.5rem'}}>
              <h4 style={{color:'var(--neon-blue)', fontFamily:'var(--font-tech)', fontSize:'1.1rem', textTransform:'uppercase'}}>{n.title}</h4>
              <button onClick={() => handleDelete(n._id)} style={{width: 'auto', padding: '4px 8px', background:'transparent', border:'none', color:'#666', cursor:'pointer'}} title="Purge Data">
                <TrashIcon />
              </button>
            </div>
            
            <div style={{fontFamily:'monospace', fontSize:'0.9rem', color: n.isDecrypted ? '#fff' : 'var(--neon-pink)', wordBreak:'break-all'}}>
              {n.isDecrypted ? (
                <div style={{animation: 'fadeIn 0.5s'}}>
                   {n.content}
                   <div style={{marginTop: 15, paddingTop: 10, borderTop: '1px solid #333', fontSize: '0.7rem', color: n.isVerified ? 'var(--neon-green)' : 'var(--neon-pink)', display: 'flex', alignItems: 'center', gap: 5}}>
                      <ShieldIcon /> 
                      {n.isVerified ? "DIGITAL SIGNATURE VERIFIED" : "WARNING: SIGNATURE INVALID"}
                   </div>
                </div>
              ) : (
                 <div style={{opacity:0.7}}>
                   <div style={{display:'flex', alignItems:'center', gap:5, marginBottom:5, color:'var(--neon-pink)'}}>
                      <LockIcon /> <strong>ENCRYPTED BLOB</strong>
                   </div>
                   <span style={{fontSize:'0.7rem'}}>{n.ciphertext.substring(0,60)}...</span>
                 </div>
              )}
            </div>
          </div>
        ))}
        {notes.length === 0 && <p style={{color:'#666', gridColumn:'1/-1', textAlign:'center', fontFamily:'var(--font-tech)'}}>NO SECURE RECORDS FOUND.</p>}
      </div>
      
      <CreditFooter />
    </div>
  );
}

export default App;