const mongoose = require('mongoose');
const articleSchema = new mongoose.Schema({
  title: String,
  body: String,
  tags: [String],
  status: { type: String, enum: ['draft', 'published'] },
  updatedAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Article', articleSchema);