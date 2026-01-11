import React, { useEffect, useState } from 'react';
import { apiGet, apiPost, apiDelete, apiPut } from '../api';
import NoteEditor from '../components/NoteEditor';

export default function Dashboard({ token, user, onLogout }) {
  const [notes, setNotes] = useState([]);
  const [selected, setSelected] = useState(null);

  async function load() {
    const res = await apiGet('/notes', token);
    setNotes(res || []);
  }

  useEffect(()=> { load(); }, []);

  // Poll every 15 seconds
  useEffect(()=> {
    const id = setInterval(() => { load(); }, 15000);
    return () => clearInterval(id);
  }, []);

  async function onCreate(payload) {
    const res = await apiPost('/notes', payload, token);
    if (res.id) {
      await load();
      alert('Saved');
    } else alert(res.error || 'Save failed');
  }

  async function openNote(id) {
    const res = await apiGet(`/notes/${id}`, token);
    if (res && !res.error) setSelected(res);
    else alert(res.error || 'Failed to fetch note');
  }

  async function onDelete(id) {
    if (!confirm('Delete note?')) return;
    const res = await apiDelete(`/notes/${id}`, token);
    if (res.ok) {
      alert('Deleted');
      setSelected(null);
      await load();
    } else alert(res.error || 'Delete failed');
  }

  // update handled inside NoteEditor via apiPut; after update, refresh list
  async function onAfterUpdate() {
    await load();
    setSelected(null);
  }

  return (
    <div style={{maxWidth:900, margin:'12px auto'}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <h2>Secure Notes — {user.email}</h2>
        <div>
          <button onClick={onLogout}>Logout</button>
        </div>
      </div>

      <section style={{display:'flex', gap:20}}>
        <div style={{flex:1}}>
          <h3>Create Note</h3>
          <NoteEditor onSave={onCreate} token={token} onAfterUpdate={onAfterUpdate} />
        </div>

        <div style={{flex:1}}>
          <h3>Your Notes</h3>
          {notes.map(n=>(
            <div key={n._id} style={{border:'1px solid #ddd', padding:8, marginBottom:6}}>
              <strong>{n.title}</strong>
              <div style={{fontSize:12, color:'#666'}}>{new Date(n.updatedAt).toLocaleString()}</div>
              <div style={{marginTop:6}}>
                <button onClick={()=>openNote(n._id)}>Open</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {selected && (
        <section style={{marginTop:20}}>
          <h3>Open Note: {selected.title}</h3>
          <div style={{marginBottom:6}}>Enter encryption password to decrypt. (Password is not sent to server.)</div>
          <NoteEditor openNote={selected} token={token} onDelete={()=>onDelete(selected._id)} onAfterUpdate={onAfterUpdate} />
        </section>
      )}
    </div>
  );
}
