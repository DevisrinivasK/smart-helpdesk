const mongoose = require('mongoose');
const auditSchema = new mongoose.Schema({
  ticketId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket' },
  traceId: String,
  actor: { type: String, enum: ['system', 'agent', 'user'] },
  action: String,
  meta: Object,
  timestamp: { type: Date, default: Date.now }
});
module.exports = mongoose.model('AuditLog', auditSchema);