const Ticket = require('../models/Ticket');
const Article = require('../models/Article');
const AgentSuggestion = require('../models/AgentSuggestion');
const AuditLog = require('../models/AuditLog');
const Config = require('../models/Config');
const llm = require('./llmStub');
const { v4: uuid } = require('uuid');

async function triageTicket(ticketId, traceId = uuid()) {
  const start = Date.now();
  const ticket = await Ticket.findById(ticketId);
  if (!ticket) throw new Error('Ticket not found');
  const config = await Config.findOne() || { autoCloseEnabled: true, confidenceThreshold: 0.78 };

  // Log start
  await logAudit(ticketId, traceId, 'system', 'TRIAGE_STARTED', {});

  // Step 1: Classify
  const { predictedCategory, confidence: classifyConf } = await llm.classify(ticket.description);
  ticket.category = predictedCategory;
  await ticket.save();
  await logAudit(ticketId, traceId, 'system', 'AGENT_CLASSIFIED', { category: predictedCategory, confidence: classifyConf });

  // Step 2: Retrieve KB (keyword search)
  const keywords = ticket.description.split(' ').filter(w => w.length > 3);
  const articles = await Article.find({
    status: 'published',
    $or: [
      { title: { $regex: keywords.join('|'), $options: 'i' } },
      { body: { $regex: keywords.join('|'), $options: 'i' } },
      { tags: { $in: keywords.map(k => new RegExp(k, 'i')) } }
    ]
  }).limit(3);
  await logAudit(ticketId, traceId, 'system', 'KB_RETRIEVED', { articleIds: articles.map(a => a._id) });

  // Step 3: Draft
  const { draftReply, citations } = await llm.draft(ticket.description, articles);
  await logAudit(ticketId, traceId, 'system', 'DRAFT_GENERATED', { draftReply });

  // Create suggestion
  const suggestion = await AgentSuggestion.create({
    ticketId,
    predictedCategory,
    articleIds: citations,
    draftReply,
    confidence: classifyConf, // Simple, use classify conf
    autoClosed: false,
    modelInfo: { provider: 'stub', model: 'heuristic', promptVersion: '1.0', latencyMs: Date.now() - start }
  });

  // Step 4: Decision
  ticket.agentSuggestionId = suggestion._id;
  ticket.status = 'triaged';
  let action = 'ASSIGNED_TO_HUMAN';
  if (config.autoCloseEnabled && classifyConf >= config.confidenceThreshold) {
    suggestion.autoClosed = true;
    await suggestion.save();
    ticket.status = 'resolved';
    action = 'AUTO_CLOSED';
    // Simulate reply: update ticket or add field
  }
  await ticket.save();
  await logAudit(ticketId, traceId, 'system', action, { confidence: classifyConf });

  // TODO: Notifications (console.log for now)
  console.log(`Ticket ${ticketId} triaged: ${action}`);
}

async function logAudit(ticketId, traceId, actor, action, meta) {
  await AuditLog.create({ ticketId, traceId, actor, action, meta, timestamp: new Date() });
}

module.exports = { triageTicket };