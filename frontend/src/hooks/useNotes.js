import { useState, useCallback } from 'react';
import { apiFetch } from '../utils/api';
import { encryptData, decryptData, signData, verifySignature } from '../utils/crypto';

export function useNotes(token, keyPair) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchNotes = useCallback(async (authToken) => {
    setLoading(true);
    try {
      const res = await apiFetch('notes', 'GET', null, authToken || token);
      if (res && res.ok) {
        const data = await res.json();
        setNotes(data.map(n => ({ ...n, isDecrypted: false, isVerified: false })));
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  const decryptAll = async (vaultKey) => {
    if (!vaultKey) throw new Error('Enter your password');
    if (!keyPair?.publicKey) throw new Error('Login keys missing');

    let failCount = 0;
    let successCount = 0;

    const processed = await Promise.all(notes.map(async (n) => {
      if (n.isDecrypted) return n;
      try {
        const plain = await decryptData(n, vaultKey);
        const verified = n.signature
          ? await verifySignature(plain, n.signature, keyPair.publicKey)
          : false;
        successCount++;
        return { ...n, content: plain, isDecrypted: true, isVerified: verified };
      } catch {
        failCount++;
        return n;
      }
    }));

    setNotes(processed);
    if (failCount > 0 && successCount === 0) throw new Error('Incorrect password');
    return successCount;
  };

  const createNote = async (title, content, vaultKey) => {
    const encrypted = await encryptData(content, vaultKey);
    const signature = await signData(content, keyPair.privateKey);

    const res = await apiFetch('notes', 'POST', {
      title: title || 'Untitled',
      ...encrypted,
      signature
    }, token);

    if (!res || !res.ok) throw new Error('Failed to save note');
    await fetchNotes();
  };

  const updateNote = async (id, title, content, vaultKey) => {
    const encrypted = await encryptData(content, vaultKey);
    const signature = await signData(content, keyPair.privateKey);

    const res = await apiFetch(`notes/${id}`, 'PATCH', {
      title: title || 'Untitled',
      ...encrypted,
      signature
    }, token);

    if (!res || !res.ok) throw new Error('Failed to update note');
    await fetchNotes();
  };

  const deleteNote = async (id) => {
    const res = await apiFetch(`notes/${id}`, 'DELETE', null, token);
    if (!res || !res.ok) throw new Error('Failed to delete note');
    setNotes(prev => prev.filter(n => n._id !== id));
  };

  return { notes, loading, fetchNotes, decryptAll, createNote, updateNote, deleteNote };
}
