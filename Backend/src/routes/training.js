const express = require('express');
const supabase = require('../lib/supabase');
const { verifyToken, requireRole } = require('../middleware/auth');
const { sendTrainingEnrollmentEmail, sendTrainingCancellationEmail } = require('../lib/mailer');

const router = express.Router();

// GET /api/training — list with pagination, category filter, search
router.get('/', async (req, res) => {
  const { category, level, search, page = 1, limit = 100 } = req.query;

  let query = supabase
    .from('trainings')
    .select('*, enrollments:training_enrollments(count)', { count: 'exact' });
  if (category && category !== 'All') query = query.eq('category', category);
  if (level && level !== 'All') query = query.eq('level', level);
  if (search) query = query.ilike('title', `%${search}%`);

  const offset = (Number(page) - 1) * Number(limit);
  query = query.order('id').range(offset, offset + Number(limit) - 1);

  const { data, error, count } = await query;
  if (error) return res.status(500).json({ error: error.message });

  // Use actual enrollment count as enrolled
  const trainings = (data || []).map(t => ({
    ...t,
    enrolled: t.enrollments?.[0]?.count ?? t.enrolled,
    enrollments: undefined,
  }));

  res.json({ data: trainings, total: count, page: Number(page), limit: Number(limit) });
});

// GET /api/training/:id
router.get('/:id', async (req, res) => {
  const { data, error } = await supabase.from('trainings').select('*').eq('id', req.params.id).single();
  if (error) return res.status(404).json({ error: 'Training not found' });
  res.json(data);
});

// POST /api/training — create (ADMIN only)
router.post('/', verifyToken, requireRole('ADMIN'), async (req, res) => {
  const { icon, category, title, org, duration, level, total, description, schedule } = req.body;
  if (!category || !title || !org || !duration || !level || !total) {
    return res.status(400).json({ error: 'category, title, org, duration, level and total are required' });
  }
  const { data, error } = await supabase.from('trainings').insert({
    icon: icon || '📚',
    category, title, org, duration, level,
    enrolled: 0, total: Number(total),
    description: description || null,
    schedule: schedule || null,
  }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// PUT /api/training/:id — update (ADMIN only)
router.put('/:id', verifyToken, requireRole('ADMIN'), async (req, res) => {
  const { icon, category, title, org, duration, level, total, description, schedule } = req.body;
  const updates = {};
  if (icon !== undefined) updates.icon = icon;
  if (category !== undefined) updates.category = category;
  if (title !== undefined) updates.title = title;
  if (org !== undefined) updates.org = org;
  if (duration !== undefined) updates.duration = duration;
  if (level !== undefined) updates.level = level;
  if (total !== undefined) updates.total = Number(total);
  if (description !== undefined) updates.description = description;
  if (schedule !== undefined) updates.schedule = schedule || null;

  const { data, error } = await supabase.from('trainings').update(updates).eq('id', req.params.id).select().single();
  if (error) return res.status(404).json({ error: 'Training not found' });
  res.json(data);
});

// DELETE /api/training/:id — delete (ADMIN only)
router.delete('/:id', verifyToken, requireRole('ADMIN'), async (req, res) => {
  const { error } = await supabase.from('trainings').delete().eq('id', req.params.id);
  if (error) return res.status(404).json({ error: 'Training not found' });
  res.json({ message: 'Training deleted' });
});

// POST /api/training/:id/enroll — enroll user
router.post('/:id/enroll', verifyToken, async (req, res) => {
  const trainingId = Number(req.params.id);
  const { data: t } = await supabase.from('trainings').select('enrolled,total,title,org,duration,category,level,schedule').eq('id', trainingId).single();
  if (!t) return res.status(404).json({ error: 'Training not found' });
  if (t.enrolled >= t.total) return res.status(400).json({ error: 'Training is fully booked' });

  const { error: enErr } = await supabase.from('training_enrollments').insert({ training_id: trainingId, user_id: req.user.id });
  if (enErr) {
    const isDuplicate = enErr.code === '23505';
    return res.status(isDuplicate ? 409 : 500).json({
      error: isDuplicate ? 'Already enrolled in this training' : enErr.message,
    });
  }

  const { data: updated } = await supabase.from('trainings')
    .update({ enrolled: t.enrolled + 1 }).eq('id', trainingId).select('enrolled,total').single();
  if (!updated) return res.status(500).json({ error: 'Failed to update enrollment count' });

  // Send confirmation email (fire-and-forget — never blocks the response)
  sendTrainingEnrollmentEmail(req.user.email, req.user.name, t).catch(() => {});

  res.json({ message: 'Enrollment successful', trainingId, enrolled: updated.enrolled, total: updated.total });
});

// DELETE /api/training/:id/enroll — unenroll user
router.delete('/:id/enroll', verifyToken, async (req, res) => {
  const trainingId = Number(req.params.id);
  const { data: t } = await supabase.from('trainings')
    .select('enrolled,title,org,duration,level,schedule,category').eq('id', trainingId).single();
  if (!t) return res.status(404).json({ error: 'Training not found' });

  // Check enrollment exists first — Supabase DELETE silently succeeds with 0 rows
  const { data: existing } = await supabase.from('training_enrollments')
    .select('id').eq('training_id', trainingId).eq('user_id', req.user.id).single();
  if (!existing) return res.status(400).json({ error: 'Not enrolled in this training' });

  const { error } = await supabase.from('training_enrollments')
    .delete().eq('training_id', trainingId).eq('user_id', req.user.id);
  if (error) return res.status(500).json({ error: error.message });

  const { data: updated } = await supabase.from('trainings')
    .update({ enrolled: Math.max(0, t.enrolled - 1) }).eq('id', trainingId).select('enrolled').single();

  // Send cancellation email (fire-and-forget)
  sendTrainingCancellationEmail(req.user.email, req.user.name, t).catch(() => {});

  res.json({ message: 'Enrollment cancelled', enrolled: updated?.enrolled ?? 0 });
});

// GET /api/training/:id/enrollments — list enrollments (ADMIN only)
router.get('/:id/enrollments', verifyToken, requireRole('ADMIN'), async (req, res) => {
  const trainingId = Number(req.params.id);
  const { data, error } = await supabase.from('training_enrollments')
    .select('id, created_at, user_id, users(name, email, institution)')
    .eq('training_id', trainingId)
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

module.exports = router;
