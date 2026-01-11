const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true }, // bcrypt hash for auth only
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
