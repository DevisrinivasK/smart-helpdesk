const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password_hash: String,
  role: { type: String, enum: ['admin', 'agent', 'user'] },
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('User', userSchema);