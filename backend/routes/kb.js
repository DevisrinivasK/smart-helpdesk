const express = require('express');
const router = express.Router();
const Article = require('../models/Article');
const auth = require('../middleware/auth');
const z = require('zod');

const articleSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  tags: z.array(z.string()),
  status: z.enum(['draft', 'published'])
});

// GET /api/kb?query=... (search published articles)
router.get('/', async (req, res) => {
  const { query } = req.query;
  let filter = { status: 'published' };
  if (query) {
    filter.$or = [
      { title: { $regex: query, $options: 'i' } },
      { body: { $regex: query, $options: 'i' } },
      { tags: { $in: [new RegExp(query, 'i')] } }
    ];
  }
  try {
    const articles = await Article.find(filter);
    res.json(articles);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/kb (admin only)
router.post('/', auth(['admin']), async (req, res) => {
  try {
    const data = articleSchema.parse(req.body);
    const article = await Article.create(data);
    res.status(201).json(article);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/kb/:id (admin only)
router.put('/:id', auth(['admin']), async (req, res) => {
  try {
    const data = articleSchema.partial().parse(req.body); // Partial for updates
    const article = await Article.findByIdAndUpdate(req.params.id, data, { new: true });
    if (!article) return res.status(404).json({ error: 'Article not found' });
    res.json(article);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/kb/:id (admin only)
router.delete('/:id', auth(['admin']), async (req, res) => {
  try {
    const article = await Article.findByIdAndDelete(req.params.id);
    if (!article) return res.status(404).json({ error: 'Article not found' });
    res.sendStatus(204);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;