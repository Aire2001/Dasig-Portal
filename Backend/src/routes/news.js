const express = require('express');
const supabase = require('../lib/supabase');
const { verifyToken, requireRole, optionalAuth } = require('../middleware/auth');

const router = express.Router();

function isMember(user) {
  return user && (user.role === 'MEMBER' || user.role === 'ADMIN');
}

// GET /api/news — list with pagination, search, badge filter
router.get('/', optionalAuth, async (req, res) => {
  const { badge, search, page = 1, limit = 10 } = req.query;

  let query = supabase.from('news').select('*', { count: 'exact' });
  if (badge && badge !== 'All') query = query.eq('badge', badge);
  if (search) query = query.ilike('title', `%${search}%`);

  const offset = (Number(page) - 1) * Number(limit);
  query = query.order('date', { ascending: false }).range(offset, offset + Number(limit) - 1);

  const { data, error, count } = await query;
  if (error) return res.status(500).json({ error: error.message });

  const member = isMember(req.user);
  const list = data.map(a => {
    if (a.members_only && !member) {
      return { ...a, excerpt: 'This article is available to DASIG members only.', locked: true };
    }
    return { ...a, locked: false };
  });

  res.json({ data: list, total: count, page: Number(page), limit: Number(limit) });
});

// GET /api/news/:id
router.get('/:id', optionalAuth, async (req, res) => {
  const { data, error } = await supabase.from('news').select('*').eq('id', req.params.id).single();
  if (error) return res.status(404).json({ error: 'Article not found' });
  if (data.members_only && !isMember(req.user)) {
    return res.status(403).json({ error: 'Members only content' });
  }
  res.json(data);
});

// POST /api/news — create (ADMIN only)
router.post('/', verifyToken, requireRole('ADMIN'), async (req, res) => {
  const { icon, badge, date, title, excerpt, content, members_only } = req.body;
  if (!date || !title) return res.status(400).json({ error: 'date and title are required' });

  const { data, error } = await supabase.from('news').insert({
    icon: icon || '📰',
    badge: badge || 'News',
    date, title,
    excerpt: excerpt || null,
    content: content || null,
    members_only: members_only ?? false,
  }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// PUT /api/news/:id — update (ADMIN only)
router.put('/:id', verifyToken, requireRole('ADMIN'), async (req, res) => {
  const { icon, badge, date, title, excerpt, content, members_only } = req.body;
  const updates = {};
  if (icon !== undefined) updates.icon = icon;
  if (badge !== undefined) updates.badge = badge;
  if (date !== undefined) updates.date = date;
  if (title !== undefined) updates.title = title;
  if (excerpt !== undefined) updates.excerpt = excerpt;
  if (content !== undefined) updates.content = content;
  if (members_only !== undefined) updates.members_only = members_only;

  const { data, error } = await supabase.from('news').update(updates).eq('id', req.params.id).select().single();
  if (error) return res.status(404).json({ error: 'Article not found' });
  res.json(data);
});

// DELETE /api/news/:id — delete (ADMIN only)
router.delete('/:id', verifyToken, requireRole('ADMIN'), async (req, res) => {
  const { error } = await supabase.from('news').delete().eq('id', req.params.id);
  if (error) return res.status(404).json({ error: 'Article not found' });
  res.json({ message: 'Article deleted' });
});

module.exports = router;
