import { useState } from 'react';

const TrashIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;
const ShieldIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>;
const EditIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;

export function NoteCard({ note, isEditing, onEdit, onDelete, showToast }) {
  // FIX: Inline confirmation state instead of native confirm() (blocked on some mobile browsers)
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDeleteClick = () => {
    if (confirmDelete) {
      onDelete(note._id);
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  const handleEditClick = () => {
    if (!note.isDecrypted) return showToast('Decrypt notes first to edit', 'error');
    onEdit(note);
  };

  return (
    <div
      className="note-card"
      style={{ borderColor: isEditing ? 'var(--neon-green)' : '' }}
    >
      <h4 style={{ marginBottom: '0.75rem', color: '#fff' }}>{note.title || 'Untitled'}</h4>

      <div style={{ fontSize: '0.9rem', color: note.isDecrypted ? '#ccc' : 'var(--neon-pink)', wordBreak: 'break-all', lineHeight: 1.5 }}>
        {note.isDecrypted ? (
          <>
            <p style={{ whiteSpace: 'pre-wrap' }}>{note.content}</p>
            <div style={{ marginTop: '10px', fontSize: '0.7rem', color: note.isVerified ? 'var(--neon-green)' : '#ff4444', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ShieldIcon /> {note.isVerified ? 'SIGNATURE VERIFIED' : 'INVALID SIGNATURE'}
            </div>
          </>
        ) : (
          <span style={{ opacity: 0.6 }}>ENCRYPTED DATA...</span>
        )}
      </div>

      <div style={{ marginTop: '15px', display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button
          onClick={handleDeleteClick}
          className="icon-btn"
          style={{
            padding: '6px 10px',
            color: confirmDelete ? '#000' : 'var(--neon-pink)',
            borderColor: 'var(--neon-pink)',
            background: confirmDelete ? 'var(--neon-pink)' : 'transparent',
            fontSize: '0.75rem',
            width: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
          title={confirmDelete ? 'Click again to confirm delete' : 'Delete note'}
        >
          <TrashIcon /> {confirmDelete ? 'CONFIRM?' : ''}
        </button>

        <button
          onClick={handleEditClick}
          className="icon-btn"
          style={{
            padding: '6px 10px',
            color: 'var(--neon-blue)',
            borderColor: 'var(--neon-blue)',
            background: 'transparent',
            width: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
          title="Edit note"
        >
          <EditIcon />
        </button>
      </div>

      <div style={{ marginTop: '8px', fontSize: '0.65rem', color: '#444', fontFamily: 'var(--font-tech)' }}>
        {new Date(note.createdAt).toLocaleDateString()}
      </div>
    </div>
  );
}
