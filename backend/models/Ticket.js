const mongoose = require('mongoose');
const ticketSchema = new mongoose.Schema({
  title: String,
  description: String,
  category: { type: String, enum: ['billing', 'tech', 'shipping', 'other'], default: 'other' },
  status: { type: String, enum: ['open', 'triaged', 'waiting_human', 'resolved', 'closed'], default: 'open' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  agentSuggestionId: { type: mongoose.Schema.Types.ObjectId, ref: 'AgentSuggestion' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Ticket', ticketSchema);