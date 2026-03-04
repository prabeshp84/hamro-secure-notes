import { useState } from 'react';
import {
  generateKeyPair, exportKey, importKey,
  encryptData, decryptData,
  savePrivateKeyLocally, loadPrivateKeyLocally, clearPrivateKey
} from '../utils/crypto';
import { apiFetch } from '../utils/api';

export function useAuth() {
  const [token, setToken] = useState(null);
  const [keyPair, setKeyPair] = useState(null);

  const register = async (email, password) => {
    const keys = await generateKeyPair();
    const pubKey = await exportKey(keys.publicKey);
    const privKeyRaw = await exportKey(keys.privateKey);

    // FIX: Save encrypted private key in localStorage — never send to server
    await savePrivateKeyLocally(privKeyRaw, password);

    const res = await apiFetch('register', 'POST', { email, password, publicKey: pubKey });

    if (!res) throw new Error('Server offline');
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Registration failed');
    }
  };

  const login = async (email, password) => {
    const res = await apiFetch('login', 'POST', { email, password });
    if (!res) throw new Error('Server offline');
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Login failed');
    }

    const data = await res.json();

    // FIX: Load private key from localStorage (never from server)
    const privKeyRaw = await loadPrivateKeyLocally(password);

    const priv = await importKey(privKeyRaw, 'private');
    const pub = await importKey(data.publicKey, 'public');

    setToken(data.token);
    setKeyPair({ publicKey: pub, privateKey: priv });

    return data.token;
  };

  const logout = () => {
    setToken(null);
    setKeyPair(null);
    // FIX: Do NOT clear private key on logout — user needs it on next login
    // clearPrivateKey() would lock them out
  };

  return { token, keyPair, register, login, logout };
}
