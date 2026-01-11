import React, { useState } from 'react';
import { apiPost } from '../api';

export default function Login({ onLogin, onRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function submit(e) {
    e.preventDefault();
    const res = await apiPost('/auth/login', { email, password });
    if (res.token) onLogin(res);
    else alert(res.error || 'Login failed');
  }

  return (
    <div style={{maxWidth:600, margin:'20px auto'}}>
      <h2>Login</h2>
      <form onSubmit={submit}>
        <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input type="password" placeholder="Login Password" value={password} onChange={e=>setPassword(e.target.value)} />
        <div style={{marginTop:8}}>
          <button type="submit">Login</button>
          <button type="button" onClick={onRegister} style={{marginLeft:8}}>Register</button>
        </div>
      </form>
    </div>
  );
}
