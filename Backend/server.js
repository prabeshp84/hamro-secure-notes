require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
app.use(express.json());
const allowedOrigins = [
  "http://localhost:5173",
  process.env.CORS_ORIGIN
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // allow REST tools / curl (no origin)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true
}));
app.use(helmet());

// --- Rate Limiting ---
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,                 // requests per IP
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api", apiLimiter);

// --- Required Environment Validation ---
const requiredEnvs = ["MONGO_URI", "JWT_SECRET"];
const missing = requiredEnvs.filter((k) => !process.env[k]);

if (missing.length) {
  console.error(`❌ Missing environment variables: ${missing.join(", ")}`);
  process.exit(1);
}
// --- Database Connection ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ DB Error:', err));

// --- Schemas ---
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  publicKey: { type: String },  
  privateKey: { type: String } // Encrypted Blob
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
  jwt.verify(token, process.env.JWT_SECRET, { issuer: "hamro-secure-notes" }, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // per IP
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api", apiLimiter);

const requireFields = (fields, body) => {
  const missing = fields.filter((f) => body[f] === undefined || body[f] === null || body[f] === "");
  return missing;
};

// --- Routes ---
app.post('/api/register', async (req, res) => {
  try {
    const missing = requireFields(["email", "password", "publicKey", "privateKey"], req.body);
    if (missing.length) return res.status(400).json({ error: `Missing: ${missing.join(", ")}` });
    const { email, password, publicKey, privateKey } = req.body;
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    // Store the encrypted private key blob
    await User.create({ email, passwordHash, publicKey, privateKey });
    res.status(201).json({ message: "User created" });
  } catch (err) {
    console.error("❌ REGISTER ERROR:", err);
    res.status(400).json({ error: "User already exists or Error" });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const missing = requireFields(["email", "password"], req.body);
    if (missing.length) return res.status(400).json({ error: `Missing: ${missing.join(", ")}` });
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !await bcrypt.compare(password, user.passwordHash)) {
      return res.status(400).json({ error: "Invalid credentials" });
    }
    const token = jwt.sign(
      { _id: user._id },
      process.env.JWT_SECRET,
      {
        expiresIn: "2h",
        algorithm: "HS256",
        issuer: "hamro-secure-notes"
      }
    );
    // Send back keys so client can unwrap them
    const includeKeys = req.query.includeKeys === "true";
    const rateLimit = require("express-rate-limit");
    res.json({
      token,
      publicKey: user.publicKey,
      privateKey: includeKeys ? user.privateKey : undefined
    });
  } catch (e) {
    console.error("LOGIN CRASH:", e);
    res.status(500).json({ error: "Server Error" });
  }
});

app.post('/api/notes', authenticate, async (req, res) => {
  try {
    const missing = requireFields(["ciphertext", "iv", "salt"], req.body);
    if (missing.length) return res.status(400).json({ error: `Missing: ${missing.join(", ")}` });
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

app.get('/api/notes', authenticate, async (req, res) => {
  const notes = await Note.find({ owner: req.user._id }).sort({ createdAt: -1 });
  res.json(notes);
});

app.delete('/api/notes/:id', authenticate, async (req, res) => {
  try {
    await Note.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    res.json({ message: "Note deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
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
        ...(signature !== undefined && { signature }),
      },
      { new: true } // return updated note
    );

    if (!updated) return res.status(404).json({ error: "Note not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

const rateLimit = require("express-rate-limit");

const PORT = process.env.PORT || 5000;

// --- Global Error Handler ---
app.use((err, req, res, next) => {
  console.error("❌ Unhandled Error:", err.message);
  res.status(500).json({ error: "Internal Server Error" });
});
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));


