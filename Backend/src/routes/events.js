const express = require('express');
const supabase = require('../lib/supabase');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/events — list with pagination, category filter, search
router.get('/', async (req, res) => {
  const { category, search, page = 1, limit = 10 } = req.query;

  let query = supabase.from('events').select('*', { count: 'exact' });
  if (category && category !== 'All') query = query.eq('category', category);
  if (search) query = query.ilike('title', `%${search}%`);

  const offset = (Number(page) - 1) * Number(limit);
  query = query.order('id').range(offset, offset + Number(limit) - 1);

  const { data, error, count } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json({ data, total: count, page: Number(page), limit: Number(limit) });
});

// GET /api/events/:id
router.get('/:id', async (req, res) => {
  const { data, error } = await supabase.from('events').select('*').eq('id', req.params.id).single();
  if (error) return res.status(404).json({ error: 'Event not found' });
  res.json(data);
});

// POST /api/events — create (ADMIN only)
router.post('/', verifyToken, requireRole('ADMIN'), async (req, res) => {
  const { title, date, venue, organizer, category, total, description } = req.body;
  if (!title || !date || !venue || !organizer || !category || !total) {
    return res.status(400).json({ error: 'title, date, venue, organizer, category and total are required' });
  }
  const { data, error } = await supabase.from('events').insert({
    title, date, venue, organizer, category,
    enrolled: 0, total: Number(total),
    description: description || null,
  }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// PUT /api/events/:id — update (ADMIN only)
router.put('/:id', verifyToken, requireRole('ADMIN'), async (req, res) => {
  const { title, date, venue, organizer, category, total, description } = req.body;
  const updates = {};
  if (title !== undefined) updates.title = title;
  if (date !== undefined) updates.date = date;
  if (venue !== undefined) updates.venue = venue;
  if (organizer !== undefined) updates.organizer = organizer;
  if (category !== undefined) updates.category = category;
  if (total !== undefined) updates.total = Number(total);
  if (description !== undefined) updates.description = description;

  const { data, error } = await supabase.from('events').update(updates).eq('id', req.params.id).select().single();
  if (error) return res.status(404).json({ error: 'Event not found' });
  res.json(data);
});

// DELETE /api/events/:id — delete (ADMIN only)
router.delete('/:id', verifyToken, requireRole('ADMIN'), async (req, res) => {
  const { error } = await supabase.from('events').delete().eq('id', req.params.id);
  if (error) return res.status(404).json({ error: 'Event not found' });
  res.json({ message: 'Event deleted' });
});

// POST /api/events/:id/register — register user for event
router.post('/:id/register', verifyToken, async (req, res) => {
  const eventId = Number(req.params.id);
  const { data: ev } = await supabase.from('events').select('enrolled,total').eq('id', eventId).single();
  if (!ev) return res.status(404).json({ error: 'Event not found' });
  if (ev.enrolled >= ev.total) return res.status(400).json({ error: 'Event is fully booked' });

  const { error: regErr } = await supabase.from('event_registrations').insert({ event_id: eventId, user_id: req.user.id });
  if (regErr) return res.status(409).json({ error: 'Already registered for this event' });

  const { data: updated } = await supabase.from('events')
    .update({ enrolled: ev.enrolled + 1 }).eq('id', eventId).select('enrolled,total').single();

  res.json({ message: 'Registration successful', eventId, enrolled: updated.enrolled, total: updated.total });
});

// DELETE /api/events/:id/register — cancel registration
router.delete('/:id/register', verifyToken, async (req, res) => {
  const eventId = Number(req.params.id);
  const { data: ev } = await supabase.from('events').select('enrolled').eq('id', eventId).single();
  if (!ev) return res.status(404).json({ error: 'Event not found' });

  const { error } = await supabase.from('event_registrations')
    .delete().eq('event_id', eventId).eq('user_id', req.user.id);
  if (error) return res.status(400).json({ error: 'Not registered for this event' });

  const { data: updated } = await supabase.from('events')
    .update({ enrolled: Math.max(0, ev.enrolled - 1) }).eq('id', eventId).select('enrolled').single();

  res.json({ message: 'Registration cancelled', enrolled: updated.enrolled });
});

// GET /api/events/:id/registrations — list registrations (ADMIN only)
router.get('/:id/registrations', verifyToken, requireRole('ADMIN'), async (req, res) => {
  const eventId = Number(req.params.id);
  const { data, error } = await supabase.from('event_registrations')
    .select('id, created_at, attended, user_id, users(name, email, institution)')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/events/:id/attend/:userId — mark attendance (ADMIN only)
router.post('/:id/attend/:userId', verifyToken, requireRole('ADMIN'), async (req, res) => {
  const eventId = Number(req.params.id);
  const userId = Number(req.params.userId);
  const { attended = true } = req.body;

  const { data, error } = await supabase.from('event_registrations')
    .update({ attended: Boolean(attended) })
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) return res.status(404).json({ error: 'Registration not found' });
  res.json({ message: 'Attendance updated', attended: data.attended });
});

// POST /api/events/:id/attend-self — member marks own attendance
router.post('/:id/attend-self', verifyToken, async (req, res) => {
  const eventId = Number(req.params.id);

  const { data, error } = await supabase.from('event_registrations')
    .update({ attended: true })
    .eq('event_id', eventId)
    .eq('user_id', req.user.id)
    .select()
    .single();

  if (error) return res.status(404).json({ error: 'You are not registered for this event' });
  res.json({ message: 'Attendance marked', attended: data.attended });
});

module.exports = router;
