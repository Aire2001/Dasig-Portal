const express = require('express');
const supabase = require('../lib/supabase');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/funding — list funding opportunities (public with optional auth)
router.get('/', async (req, res) => {
  const { category, search, status, page = 1, limit = 100 } = req.query;

  let query = supabase.from('funding_opportunities').select('*', { count: 'exact' });

  if (category && category !== 'All') query = query.eq('category', category);
  if (status && status !== 'All') query = query.eq('status', status);
  if (search) query = query.ilike('title', `%${search}%`);

  const offset = (Number(page) - 1) * Number(limit);
  query = query.order('deadline', { ascending: true }).range(offset, offset + Number(limit) - 1);

  const { data, error, count } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json({ data, total: count, page: Number(page), limit: Number(limit) });
});

// GET /api/funding/:id
router.get('/:id', async (req, res) => {
  const { data, error } = await supabase.from('funding_opportunities').select('*').eq('id', req.params.id).single();
  if (error) return res.status(404).json({ error: 'Funding opportunity not found' });
  res.json(data);
});

// POST /api/funding — create (ADMIN only)
router.post('/', verifyToken, requireRole('ADMIN'), async (req, res) => {
  const { title, category, provider, amount, deadline, description, eligibility, status } = req.body;
  if (!title || !category || !provider || !deadline) {
    return res.status(400).json({ error: 'title, category, provider and deadline are required' });
  }
  const { data, error } = await supabase.from('funding_opportunities').insert({
    title, category, provider,
    amount: amount || null,
    deadline,
    description: description || null,
    eligibility: eligibility || null,
    status: status || 'Open',
    created_by: req.user.id,
  }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// PUT /api/funding/:id — update (ADMIN only)
router.put('/:id', verifyToken, requireRole('ADMIN'), async (req, res) => {
  const { title, category, provider, amount, deadline, description, eligibility, status } = req.body;
  const updates = {};
  if (title !== undefined) updates.title = title;
  if (category !== undefined) updates.category = category;
  if (provider !== undefined) updates.provider = provider;
  if (amount !== undefined) updates.amount = amount;
  if (deadline !== undefined) updates.deadline = deadline;
  if (description !== undefined) updates.description = description;
  if (eligibility !== undefined) updates.eligibility = eligibility;
  if (status !== undefined) updates.status = status;
  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase.from('funding_opportunities').update(updates).eq('id', req.params.id).select().single();
  if (error) return res.status(404).json({ error: 'Funding opportunity not found' });
  res.json(data);
});

// DELETE /api/funding/:id (ADMIN only)
router.delete('/:id', verifyToken, requireRole('ADMIN'), async (req, res) => {
  const { error } = await supabase.from('funding_opportunities').delete().eq('id', req.params.id);
  if (error) return res.status(404).json({ error: 'Funding opportunity not found' });
  res.json({ message: 'Funding opportunity deleted' });
});

module.exports = router;
