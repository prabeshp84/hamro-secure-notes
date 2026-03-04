const SaveIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>;

export function NoteEditor({ title, setTitle, content, setContent, editingId, onSave, onCancel, loading }) {
  return (
    <div
      className="glass-panel"
      style={{
        marginBottom: 30,
        border: editingId ? '1px solid var(--neon-green)' : '1px solid var(--glass-border)'
      }}
    >
      {editingId && (
        <div style={{ color: 'var(--neon-green)', marginBottom: '10px', fontSize: '0.85rem', fontFamily: 'var(--font-tech)' }}>
          ✏️ EDITING MODE ACTIVE
        </div>
      )}

      <input
        placeholder="TITLE..."
        value={title}
        onChange={e => setTitle(e.target.value)}
        maxLength={200}
        disabled={loading}
      />
      <textarea
        placeholder="DATA..."
        value={content}
        onChange={e => setContent(e.target.value)}
        disabled={loading}
        style={{ minHeight: '120px', resize: 'vertical' }}
      />

      <div style={{ display: 'flex', gap: '10px' }}>
        {/* FIX: Button disabled during save to prevent duplicate submissions */}
        <button
          onClick={onSave}
          disabled={loading}
          style={{ background: editingId ? 'rgba(0, 255, 65, 0.2)' : '', opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
        >
          <SaveIcon /> {loading ? 'SAVING...' : (editingId ? 'UPDATE ENCRYPTED' : 'SAVE ENCRYPTED')}
        </button>

        {editingId && (
          <button
            onClick={onCancel}
            disabled={loading}
            style={{ background: 'rgba(255, 0, 85, 0.2)', color: 'var(--neon-pink)', borderColor: 'var(--neon-pink)' }}
          >
            CANCEL
          </button>
        )}
      </div>
    </div>
  );
}
