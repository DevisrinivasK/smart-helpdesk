const express = require('express');
const router = express.Router();
const Article = require('../models/Article');
const auth = require('../middleware/auth');
const z = require('zod');

const articleSchema = z.object({
  title: z.string(),
  body: z.string(),
  tags: z.array(z.string()),
  status: z.enum(['draft', 'published'])
});

// Search (simple keyword)
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
  const articles = await Article.find(filter);
  res.json(articles);
});

router.post('/', auth(['admin']), async (req, res) => {
  const data = articleSchema.parse(req.body);
  const article = await Article.create(data);
  res.status(201).json(article);
});

router.put('/:id', auth(['admin']), async (req, res) => {
  const data = articleSchema.partial().parse(req.body);
  const article = await Article.findByIdAndUpdate(req.params.id, data, { new: true });
  if (!article) return res.status(404).json({ error: 'Not found' });
  res.json(article);
});

router.delete('/:id', auth(['admin']), async (req, res) => {
  await Article.findByIdAndDelete(req.params.id);
  res.sendStatus(204);
});

module.exports = router;