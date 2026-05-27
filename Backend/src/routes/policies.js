const express = require('express');
const supabase = require('../lib/supabase');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/policies — list policies (MEMBER+ full, GUEST sees public only)
router.get('/', verifyToken, async (req, res) => {
  const { category, search, page = 1, limit = 10 } = req.query;
  const isMember = req.user.role === 'MEMBER' || req.user.role === 'ADMIN';

  let query = supabase.from('policies').select('*', { count: 'exact' });

  if (!isMember) query = query.eq('members_only', false);
  if (category && category !== 'All') query = query.eq('category', category);
  if (search) query = query.ilike('title', `%${search}%`);

  const archived = req.query.archived === 'true';
  query = query.eq('archived', archived);

  const offset = (Number(page) - 1) * Number(limit);
  query = query.order('effective_date', { ascending: false }).range(offset, offset + Number(limit) - 1);

  const { data, error, count } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json({ data, total: count, page: Number(page), limit: Number(limit) });
});

// GET /api/policies/:id
router.get('/:id', verifyToken, async (req, res) => {
  const { data, error } = await supabase.from('policies').select('*').eq('id', req.params.id).single();
  if (error) return res.status(404).json({ error: 'Policy not found' });
  const isMember = req.user.role === 'MEMBER' || req.user.role === 'ADMIN';
  if (data.members_only && !isMember) return res.status(403).json({ error: 'Members only content' });
  res.json(data);
});

// POST /api/policies — create (ADMIN only)
router.post('/', verifyToken, requireRole('ADMIN'), async (req, res) => {
  const { title, category, content, effective_date, members_only } = req.body;
  if (!title || !category || !content || !effective_date) {
    return res.status(400).json({ error: 'title, category, content and effective_date are required' });
  }
  const { data, error } = await supabase.from('policies').insert({
    title, category, content,
    effective_date,
    members_only: members_only ?? false,
    archived: false,
    created_by: req.user.id,
  }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// PUT /api/policies/:id — update (ADMIN only)
router.put('/:id', verifyToken, requireRole('ADMIN'), async (req, res) => {
  const { title, category, content, effective_date, members_only } = req.body;
  const updates = {};
  if (title !== undefined) updates.title = title;
  if (category !== undefined) updates.category = category;
  if (content !== undefined) updates.content = content;
  if (effective_date !== undefined) updates.effective_date = effective_date;
  if (members_only !== undefined) updates.members_only = members_only;
  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase.from('policies').update(updates).eq('id', req.params.id).select().single();
  if (error) return res.status(404).json({ error: 'Policy not found' });
  res.json(data);
});

// PATCH /api/policies/:id/archive — archive/unarchive (ADMIN only)
router.patch('/:id/archive', verifyToken, requireRole('ADMIN'), async (req, res) => {
  const { archived = true } = req.body;
  const { data, error } = await supabase.from('policies')
    .update({ archived, updated_at: new Date().toISOString() })
    .eq('id', req.params.id).select().single();
  if (error) return res.status(404).json({ error: 'Policy not found' });
  res.json({ message: archived ? 'Policy archived' : 'Policy restored', policy: data });
});

// DELETE /api/policies/:id (ADMIN only)
router.delete('/:id', verifyToken, requireRole('ADMIN'), async (req, res) => {
  const { error } = await supabase.from('policies').delete().eq('id', req.params.id);
  if (error) return res.status(404).json({ error: 'Policy not found' });
  res.json({ message: 'Policy deleted' });
});

module.exports = router;
