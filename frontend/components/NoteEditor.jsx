import React, { useState, useEffect } from 'react';
import { encryptText, decryptText } from '../crypto';
import { apiPut } from '../api';

export default function NoteEditor({ onSave, openNote, onDelete, token, onAfterUpdate }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [password, setPassword] = useState('');
  const [decrypted, setDecrypted] = useState('');
  const [clientFetchedAt, setClientFetchedAt] = useState(null); // ISO string

  useEffect(()=> {
    if (openNote) {
      setTitle(openNote.title || '');
      setBody(''); // will be filled after decrypt
      setDecrypted('');
      setPassword('');
      setClientFetchedAt(openNote.updatedAt ? new Date(openNote.updatedAt).toISOString() : new Date().toISOString());
    } else {
      setTitle(''); setBody(''); setPassword(''); setDecrypted(''); setClientFetchedAt(null);
    }
  }, [openNote]);

  async function handleSave(e) {
    e && e.preventDefault();
    if (!password) { alert('Enter encryption password (client-side only)'); return; }
    const plaintext = openNote ? (decrypted || body) : body;
    if (!plaintext) { alert('Empty note'); return; }

    const { ciphertextB64, ivB64, saltB64 } = await encryptText(plaintext, password);

    if (openNote) {
      // update via PUT with optimistic lock
      const payload = {
        title: title || 'Untitled',
        ciphertext: ciphertextB64,
        iv: ivB64,
        salt: saltB64,
        lastKnownUpdatedAt: clientFetchedAt
      };
      const jwt = token || localStorage.getItem('token');
      const res = await apiPut(`/notes/${openNote._id}`, payload, jwt);
      if (res.updatedAt) {
        alert('Updated');
        if (onAfterUpdate) onAfterUpdate();
      } else if (res.error && res.serverNote) {
        // conflict: show simple prompt
        const ok = confirm('This note was changed on another device. Overwrite?');
        if (ok) {
          // resend without lastKnownUpdatedAt to force overwrite
          const payload2 = { title: title || 'Untitled', ciphertext: ciphertextB64, iv: ivB64, salt: saltB64 };
          const res2 = await apiPut(`/notes/${openNote._id}`, payload2, jwt);
          if (res2.updatedAt) {
            alert('Updated (forced)');
            if (onAfterUpdate) onAfterUpdate();
          } else alert(res2.error || 'Force update failed');
        } else {
          alert('Update cancelled. Please refresh notes to get latest.');
        }
      } else {
        alert(res.error || 'Update failed');
      }
    } else {
      await onSave({ title: title || 'Untitled', ciphertext: ciphertextB64, iv: ivB64, salt: saltB64 });
    }
    setTitle(''); setBody(''); setPassword(''); setDecrypted(''); setClientFetchedAt(null);
  }

  async function handleDecrypt(e) {
    e && e.preventDefault();
    if (!openNote) return;
    if (!password) { alert('Enter encryption password'); return; }
    try {
      const pt = await decryptText(openNote.ciphertext, openNote.iv, openNote.salt, password);
      setDecrypted(pt);
      setBody(pt);
    } catch (err) {
      alert('Decryption failed — wrong password or corrupted data.');
    }
  }

  return (
    <div>
      <input placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)} />
      {!openNote && <textarea rows={6} placeholder="Write your note..." value={body} onChange={e=>setBody(e.target.value)} />}
      {openNote && <div style={{marginBottom:8}}>{decrypted ? <textarea rows={6} value={decrypted} onChange={e=>setDecrypted(e.target.value)} /> : 'Encrypted content — decrypt to view.'}</div>}
      <input type="password" placeholder="Encryption password (client-side only)" value={password} onChange={e=>setPassword(e.target.value)} />
      <div style={{marginTop:8}}>
        {!openNote && <button onClick={handleSave}>Encrypt & Save</button>}
        {openNote && <button onClick={handleDecrypt}>Decrypt</button>}
        {openNote && decrypted && <button onClick={handleSave} style={{marginLeft:8}}>Encrypt & Update</button>}
        {onDelete && <button onClick={onDelete} style={{marginLeft:8}}>Delete</button>}
      </div>
    </div>
  );
}
