const mongoose = require('mongoose');
const suggestionSchema = new mongoose.Schema({
  ticketId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket' },
  predictedCategory: String,
  articleIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Article' }],
  draftReply: String,
  confidence: Number,
  autoClosed: Boolean,
  modelInfo: { provider: String, model: String, promptVersion: String, latencyMs: Number },
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('AgentSuggestion', suggestionSchema);