console.log("...Attempting to start server...");

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
app.use(express.json());
app.use(cors());
app.use(helmet());

// --- Database Connection ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ DB Error:', err));

// --- Schemas ---
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  // NEW: Store the User's Digital Identity (Keys)
  publicKey: { type: String },  
  privateKey: { type: String }
});

const NoteSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: String,
  ciphertext: { type: String, required: true },
  iv: { type: String, required: true },
  salt: { type: String, required: true },
  signature: { type: String } 
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);
const Note = mongoose.model('Note', NoteSchema);

// --- Middleware ---
const authenticate = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// --- Routes ---

// 1. Register (Updated to Save Keys)
app.post('/api/register', async (req, res) => {
  try {
    const { email, password, publicKey, privateKey } = req.body; // Accept keys from frontend
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    
    // Store keys along with user
    await User.create({ email, passwordHash, publicKey, privateKey });
    
    res.status(201).json({ message: "User created" });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "User already exists or Error" });
  }
});

// 2. Login (Updated to Return Keys)
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !await bcrypt.compare(password, user.passwordHash)) {
      return res.status(400).json({ error: "Invalid credentials" });
    }
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: '2h' });
    
    // Send the stored keys back to the client
    res.json({ 
      token, 
      publicKey: user.publicKey, 
      privateKey: user.privateKey 
    });
  } catch (e) {
    res.status(500).json({ error: "Server Error" });
  }
});

// 3. Save Encrypted Note
app.post('/api/notes', authenticate, async (req, res) => {
  try {
    const { title, ciphertext, iv, salt, signature } = req.body;
    const note = await Note.create({
      owner: req.user._id,
      title,
      ciphertext,
      iv,
      salt,
      signature 
    });
    res.status(201).json(note);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Get Encrypted Notes
app.get('/api/notes', authenticate, async (req, res) => {
  const notes = await Note.find({ owner: req.user._id }).sort({ createdAt: -1 });
  res.json(notes);
});

// 5. Delete Note
app.delete('/api/notes/:id', authenticate, async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!note) return res.status(404).json({ error: "Note not found or access denied" });
    res.json({ message: "Note deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));