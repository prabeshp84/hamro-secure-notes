require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');

const app = express();

// FIX: Limit payload size to prevent large ciphertext abuse
app.use(express.json({ limit: '50kb' }));

/* ---------------- CORS ---------------- */
const allowedOrigins = [
  'http://localhost:5173',
  process.env.CORS_ORIGIN
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

app.use(helmet());

/* ---------------- RATE LIMITING ---------------- */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limit on auth routes to prevent brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts, please try again later.' }
});

app.use('/api', apiLimiter);
app.use('/api/login', authLimiter);
app.use('/api/register', authLimiter);

/* ---------------- REQUIRED ENV VARIABLES ---------------- */
const requiredEnvs = ['MONGO_URI', 'JWT_SECRET'];
const missing = requiredEnvs.filter((k) => !process.env[k]);

if (missing.length) {
  console.error(`Missing environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

/* ---------------- DATABASE CONNECTION ---------------- */
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => {
    console.error('DB Error:', err);
    process.exit(1);
  });

/* ---------------- SCHEMAS ---------------- */
const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email format']
  },
  passwordHash: { type: String, required: true },
  // FIX: publicKey only — private key is NEVER stored server-side (zero-knowledge)
  publicKey: { type: String }
}, { timestamps: true });

const NoteSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, maxlength: [200, 'Title too long'], default: 'Untitled' },
  ciphertext: { type: String, required: true },
  iv: { type: String, required: true },
  salt: { type: String, required: true },
  signature: { type: String }
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);
const Note = mongoose.model('Note', NoteSchema);

/* ---------------- MIDDLEWARE ---------------- */
const authenticate = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, { issuer: 'hamro-secure-notes' }, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

const requireFields = (fields, body) =>
  fields.filter((f) => body[f] === undefined || body[f] === null || body[f] === '');

/* ---------------- AUTH ROUTES ---------------- */
app.post('/api/register', async (req, res) => {
  try {
    const miss = requireFields(['email', 'password', 'publicKey'], req.body);
    if (miss.length) return res.status(400).json({ error: `Missing: ${miss.join(', ')}` });

    const { email, password, publicKey } = req.body;

    if (password.length < 8)
      return res.status(400).json({ error: 'Password must be at least 8 characters' });

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // FIX: Only store publicKey — private key stays on the client
    await User.create({ email: email.toLowerCase().trim(), passwordHash, publicKey });

    res.status(201).json({ message: 'User created' });

  } catch (err) {
    // FIX: Generic message — don't reveal if email already exists
    console.error('REGISTER ERROR:', err.code === 11000 ? 'Duplicate email' : err.message);
    res.status(400).json({ error: 'Registration failed. Please try again.' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const miss = requireFields(['email', 'password'], req.body);
    if (miss.length) return res.status(400).json({ error: `Missing: ${miss.join(', ')}` });

    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // FIX: Constant-time comparison to prevent timing attacks
    const dummyHash = '$2a$12$invalidhashfortimingprotectionpadding.invalid00';
    const isValid = await bcrypt.compare(password, user ? user.passwordHash : dummyHash);

    if (!user || !isValid)
      return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { _id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '2h', algorithm: 'HS256', issuer: 'hamro-secure-notes' }
    );

    res.json({
      token,
      publicKey: user.publicKey
      // FIX: privateKey is NEVER returned — it lives only on the client
    });

  } catch (e) {
    console.error('LOGIN ERROR:', e.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

/* ---------------- NOTES ROUTES ---------------- */
app.post('/api/notes', authenticate, async (req, res) => {
  try {
    const miss = requireFields(['ciphertext', 'iv', 'salt'], req.body);
    if (miss.length) return res.status(400).json({ error: `Missing: ${miss.join(', ')}` });

    const { title, ciphertext, iv, salt, signature } = req.body;
    const note = await Note.create({
      owner: req.user._id,
      title: title || 'Untitled',
      ciphertext, iv, salt, signature
    });

    res.status(201).json(note);
  } catch (err) {
    console.error('CREATE NOTE ERROR:', err.message);
    res.status(500).json({ error: 'Failed to create note' });
  }
});

// FIX: Added missing try/catch
app.get('/api/notes', authenticate, async (req, res) => {
  try {
    const notes = await Note.find({ owner: req.user._id }).sort({ createdAt: -1 });
    res.json(notes);
  } catch (err) {
    console.error('FETCH NOTES ERROR:', err.message);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

app.patch('/api/notes/:id', authenticate, async (req, res) => {
  try {
    const { title, ciphertext, iv, salt, signature } = req.body;
    const updated = await Note.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      {
        ...(title !== undefined && { title }),
        ...(ciphertext !== undefined && { ciphertext }),
        ...(iv !== undefined && { iv }),
        ...(salt !== undefined && { salt }),
        ...(signature !== undefined && { signature })
      },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ error: 'Note not found' });
    res.json(updated);
  } catch (err) {
    console.error('UPDATE NOTE ERROR:', err.message);
    res.status(500).json({ error: 'Failed to update note' });
  }
});

app.delete('/api/notes/:id', authenticate, async (req, res) => {
  try {
    const deleted = await Note.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!deleted) return res.status(404).json({ error: 'Note not found' });
    res.json({ message: 'Note deleted' });
  } catch (err) {
    console.error('DELETE NOTE ERROR:', err.message);
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

/* ---------------- HEALTH CHECK ---------------- */
app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

/* ---------------- 404 HANDLER ---------------- */
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

/* ---------------- GLOBAL ERROR HANDLER ---------------- */
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.message);
  res.status(500).json({ error: 'Internal Server Error' });
});

/* ---------------- START SERVER ---------------- */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
