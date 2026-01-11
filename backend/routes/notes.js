const express = require('express');
const Note = require('../models/Note');
const auth = require('../middleware/auth');
const router = express.Router();

// Create note
router.post('/', auth, async (req, res) => {
  try {
    const { title, ciphertext, iv, salt, meta } = req.body;
    if (!ciphertext || !iv || !salt) return res.status(400).json({ error: 'Missing fields' });
    const note = new Note({ owner: req.user.id, title: title || 'Untitled', ciphertext, iv, salt, meta: meta || {} });
    await note.save();
    res.json({ id: note._id, createdAt: note.createdAt, updatedAt: note.updatedAt });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// List notes (only metadata)
router.get('/', auth, async (req, res) => {
  try {
    const notes = await Note.find({ owner: req.user.id }, '_id title createdAt updatedAt meta').sort({ updatedAt: -1 });
    res.json(notes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get a single note (ciphertext + iv + salt)
router.get('/:id', auth, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ error: 'Not found' });
    if (note.owner.toString() !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    res.json({
      _id: note._id,
      title: note.title,
      ciphertext: note.ciphertext,
      iv: note.iv,
      salt: note.salt,
      meta: note.meta,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update note (with optimistic lock)
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, ciphertext, iv, salt, meta, lastKnownUpdatedAt } = req.body;
    if (!ciphertext || !iv || !salt) return res.status(400).json({ error: 'Missing fields' });
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ error: 'Not found' });
    if (note.owner.toString() !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    // Optimistic lock: if client provided lastKnownUpdatedAt and it doesn't match current, return 409 conflict
    if (lastKnownUpdatedAt) {
      const clientTS = new Date(lastKnownUpdatedAt).toISOString();
      const serverTS = note.updatedAt.toISOString();
      if (clientTS !== serverTS) {
        return res.status(409).json({
          error: 'Conflict',
          serverNote: {
            _id: note._id,
            title: note.title,
            ciphertext: note.ciphertext,
            iv: note.iv,
            salt: note.salt,
            meta: note.meta,
            createdAt: note.createdAt,
            updatedAt: note.updatedAt
          }
        });
      }
    }

    note.title = title || note.title;
    note.ciphertext = ciphertext;
    note.iv = iv;
    note.salt = salt;
    note.meta = meta || note.meta;
    await note.save();

    res.json({ id: note._id, updatedAt: note.updatedAt });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete note
router.delete('/:id', auth, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ error: 'Not found' });
    if (note.owner.toString() !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    await note.remove();
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
