const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');
const AuditLog = require('../models/AuditLog');
const auth = require('../middleware/auth');
const { v4: uuid } = require('uuid');
const z = require('zod');
// Agent logic - we'll import later
const { triageTicket } = require('../agent/triage');

const ticketSchema = z.object({
  title: z.string(),
  description: z.string(),
  category: z.enum(['billing', 'tech', 'shipping', 'other']).optional()
});

router.post('/', auth(['user']), async (req, res) => {
  const data = ticketSchema.parse(req.body);
  const traceId = uuid();
  const ticket = await Ticket.create({
    ...data,
    createdBy: req.user.id,
    status: 'open'
  });
  await AuditLog.create({ ticketId: ticket._id, traceId, actor: 'user', action: 'TICKET_CREATED', meta: { userId: req.user.id } });
  // Enqueue triage (simple async for now)
  setImmediate(() => triageTicket(ticket._id, traceId).catch(console.error));
  res.status(201).json(ticket);
});

router.get('/', auth(), async (req, res) => {
  const filter = req.user.role === 'user' ? { createdBy: req.user.id } : {};
  if (req.query.status) filter.status = req.query.status;
  const tickets = await Ticket.find(filter).populate('createdBy assignee');
  res.json(tickets);
});

router.get('/:id', auth(), async (req, res) => {
  const ticket = await Ticket.findById(req.params.id).populate('createdBy assignee agentSuggestionId');
  if (!ticket) return res.status(404).json({ error: 'Not found' });
  // Check access: owner, assignee, or admin/agent
  if (req.user.role !== 'admin' && req.user.role !== 'agent' && ticket.createdBy._id.toString() !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  res.json(ticket);
});

router.post('/:id/reply', auth(['agent']), async (req, res) => {
  const { reply } = req.body; // For now, simple string; later add to conversation
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Not found' });
  // Update status to resolved, add reply (simplify: store in meta or add field)
  ticket.status = 'resolved';
  ticket.updatedAt = new Date();
  await ticket.save();
  await AuditLog.create({ ticketId: ticket._id, traceId: uuid(), actor: 'agent', action: 'REPLY_SENT', meta: { reply } });
  res.json(ticket);
});

router.post('/:id/assign', auth(['admin', 'agent']), async (req, res) => {
  const { assigneeId } = req.body;
  const ticket = await Ticket.findByIdAndUpdate(req.params.id, { assignee: assigneeId }, { new: true });
  if (!ticket) return res.status(404).json({ error: 'Not found' });
  await AuditLog.create({ ticketId: ticket._id, traceId: uuid(), actor: 'agent', action: 'ASSIGNED_TO_HUMAN', meta: { assigneeId } });
  res.json(ticket);
});

module.exports = router;