const express = require('express');
const supabase = require('../lib/supabase');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/partnerships — list (MEMBER+ only)
router.get('/', verifyToken, async (req, res) => {
  const { type, search, page = 1, limit = 100 } = req.query;
  const isMember = req.user.role === 'MEMBER' || req.user.role === 'ADMIN';
  if (!isMember) return res.status(403).json({ error: 'Members only' });

  let query = supabase.from('partnerships').select('*', { count: 'exact' });

  if (type && type !== 'All') query = query.eq('type', type);
  if (search) query = query.ilike('partner_name', `%${search}%`);

  const offset = (Number(page) - 1) * Number(limit);
  query = query.order('created_at', { ascending: false }).range(offset, offset + Number(limit) - 1);

  const { data, error, count } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json({ data, total: count, page: Number(page), limit: Number(limit) });
});

// GET /api/partnerships/:id (MEMBER+ only)
router.get('/:id', verifyToken, async (req, res) => {
  const isMember = req.user.role === 'MEMBER' || req.user.role === 'ADMIN';
  if (!isMember) return res.status(403).json({ error: 'Members only' });

  const { data, error } = await supabase.from('partnerships').select('*').eq('id', req.params.id).single();
  if (error) return res.status(404).json({ error: 'Partnership not found' });
  res.json(data);
});

// POST /api/partnerships — create (ADMIN only)
router.post('/', verifyToken, requireRole('ADMIN'), async (req, res) => {
  const { partner_name, type, description, start_date, end_date, contact_person, contact_email, status } = req.body;
  if (!partner_name || !type || !start_date) {
    return res.status(400).json({ error: 'partner_name, type and start_date are required' });
  }
  const { data, error } = await supabase.from('partnerships').insert({
    partner_name, type,
    description: description || null,
    start_date, end_date: end_date || null,
    contact_person: contact_person || null,
    contact_email: contact_email || null,
    status: status || 'Active',
    created_by: req.user.id,
  }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// PUT /api/partnerships/:id — update (ADMIN only)
router.put('/:id', verifyToken, requireRole('ADMIN'), async (req, res) => {
  const { partner_name, type, description, start_date, end_date, contact_person, contact_email, status } = req.body;
  const updates = {};
  if (partner_name !== undefined) updates.partner_name = partner_name;
  if (type !== undefined) updates.type = type;
  if (description !== undefined) updates.description = description;
  if (start_date !== undefined) updates.start_date = start_date;
  if (end_date !== undefined) updates.end_date = end_date;
  if (contact_person !== undefined) updates.contact_person = contact_person;
  if (contact_email !== undefined) updates.contact_email = contact_email;
  if (status !== undefined) updates.status = status;
  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase.from('partnerships').update(updates).eq('id', req.params.id).select().single();
  if (error) return res.status(404).json({ error: 'Partnership not found' });
  res.json(data);
});

// DELETE /api/partnerships/:id (ADMIN only)
router.delete('/:id', verifyToken, requireRole('ADMIN'), async (req, res) => {
  const { error } = await supabase.from('partnerships').delete().eq('id', req.params.id);
  if (error) return res.status(404).json({ error: 'Partnership not found' });
  res.json({ message: 'Partnership deleted' });
});

module.exports = router;
