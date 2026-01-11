import React, { useState } from 'react';
import { apiPost } from '../api';

export default function Register({ onRegistered, onBack }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function submit(e) {
    e.preventDefault();
    const res = await apiPost('/auth/register', { email, password });
    if (res.token) onRegistered(res);
    else alert(res.error || 'Register failed');
  }

  return (
    <div style={{maxWidth:600, margin:'20px auto'}}>
      <h2>Register</h2>
      <form onSubmit={submit}>
        <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input type="password" placeholder="Login Password (used for account only)" value={password} onChange={e=>setPassword(e.target.value)} />
        <div style={{marginTop:8}}>
          <button type="submit">Register</button>
          <button type="button" onClick={onBack} style={{marginLeft:8}}>Back</button>
        </div>
      </form>
    </div>
  );
}
