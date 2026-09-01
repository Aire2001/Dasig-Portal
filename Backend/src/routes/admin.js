const express = require('express');
const supabase = require('../lib/supabase');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// All admin routes require ADMIN role
router.use(verifyToken, requireRole('ADMIN'));

// GET /api/admin/stats — dashboard overview
router.get('/stats', async (req, res) => {
  const [users, events, news, trainings, members, applications, policies, funding, partnerships, eventRegs, trainRegs] = await Promise.all([
    supabase.from('users').select('id, role, status', { count: 'exact', head: false }),
    supabase.from('events').select('id, enrolled, total, registrations:event_registrations(count)', { count: 'exact', head: false }),
    supabase.from('news').select('id', { count: 'exact', head: false }),
    supabase.from('trainings').select('id, enrolled, total, enrollments:training_enrollments(count)', { count: 'exact', head: false }),
    supabase.from('members').select('id', { count: 'exact', head: false }),
    supabase.from('membership_applications').select('id, status', { count: 'exact', head: false }),
    supabase.from('policies').select('id, archived', { count: 'exact', head: false }),
    supabase.from('funding_opportunities').select('id, status', { count: 'exact', head: false }),
    supabase.from('partnerships').select('id, status', { count: 'exact', head: false }),
    supabase.from('event_registrations').select('id', { count: 'exact', head: true }),
    supabase.from('training_enrollments').select('id', { count: 'exact', head: true }),
  ]);

  const userList = users.data || [];
  const appList = applications.data || [];
  const policyList = policies.data || [];
  const fundingList = funding.data || [];
  const partnerList = partnerships.data || [];
  const eventList = events.data || [];
  const trainList = trainings.data || [];

  const realEventEnrolled = typeof eventRegs.count === 'number'
    ? eventRegs.count
    : eventList.reduce((s, e) => s + (e.registrations?.[0]?.count ?? e.enrolled ?? 0), 0);

  const realTrainEnrolled = typeof trainRegs.count === 'number'
    ? trainRegs.count
    : trainList.reduce((s, t) => s + (t.enrollments?.[0]?.count ?? t.enrolled ?? 0), 0);

  res.json({
    users: {
      total: userList.length,
      admin: userList.filter(u => u.role === 'ADMIN').length,
      member: userList.filter(u => u.role === 'MEMBER').length,
      guest: userList.filter(u => u.role === 'GUEST').length,
      active: userList.filter(u => u.status === 'ACTIVE').length,
      inactive: userList.filter(u => u.status === 'INACTIVE').length,
    },
    events: {
      total: eventList.length,
      totalEnrolled: realEventEnrolled,
      totalCapacity: eventList.reduce((s, e) => s + (Number(e.total) || 50), 0),
    },
    news: { total: (news.data || []).length },
    trainings: {
      total: trainList.length,
      totalEnrolled: realTrainEnrolled,
      totalCapacity: trainList.reduce((s, t) => s + (Number(t.total) || 20), 0),
    },
    members: { total: (members.data || []).length },
    applications: {
      total: appList.length,
      pending: appList.filter(a => a.status === 'PENDING').length,
      approved: appList.filter(a => a.status === 'APPROVED').length,
      rejected: appList.filter(a => a.status === 'REJECTED').length,
    },
    policies: {
      total: policyList.length,
      active: policyList.filter(p => !p.archived).length,
      archived: policyList.filter(p => p.archived).length,
    },
    funding: {
      total: fundingList.length,
      open: fundingList.filter(f => f.status === 'Open').length,
      closed: fundingList.filter(f => f.status === 'Closed').length,
    },
    partnerships: {
      total: partnerList.length,
      active: partnerList.filter(p => p.status === 'Active').length,
    },
  });
});

// GET /api/admin/users — list all users with pagination
router.get('/users', async (req, res) => {
  const { role, status, search, page = 1, limit = 20 } = req.query;

  let query = supabase.from('users')
    .select('id, name, email, role, status, institution, campus, phone, avatar_url, tier, member_since, renewal_due, created_at', { count: 'exact' });

  if (role && role !== 'All') query = query.eq('role', role);
  if (status && status !== 'All') query = query.eq('status', status);
  if (search) query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,institution.ilike.%${search}%`);

  const offset = (Number(page) - 1) * Number(limit);
  query = query.order('created_at', { ascending: false }).range(offset, offset + Number(limit) - 1);

  const { data, error, count } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json({ data, total: count, page: Number(page), limit: Number(limit) });
});

// GET /api/admin/users/:id — get single user details
router.get('/users/:id', async (req, res) => {
  const { data, error } = await supabase.from('users')
    .select('id, name, email, role, status, institution, campus, phone, avatar_url, tier, member_since, renewal_due, created_at')
    .eq('id', req.params.id).single();
  if (error) return res.status(404).json({ error: 'User not found' });
  res.json(data);
});

// PATCH /api/admin/users/:id/role — change user role
router.patch('/users/:id/role', async (req, res) => {
  const { role } = req.body;
  if (!['ADMIN', 'MEMBER', 'GUEST'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role. Must be ADMIN, MEMBER or GUEST' });
  }

  const updates = { role };
  if (role === 'MEMBER' || role === 'ADMIN') {
    const { data: existing } = await supabase.from('users')
      .select('member_since, renewal_due, status').eq('id', req.params.id).single();
    if (existing) {
      if (!existing.member_since) updates.member_since = new Date().toISOString().slice(0, 10);
      if (!existing.renewal_due) updates.renewal_due = `${new Date().getFullYear() + 1}-12-31`;
      if (existing.status !== 'ACTIVE') updates.status = 'ACTIVE';
    }
  }

  const { data, error } = await supabase.from('users')
    .update(updates).eq('id', req.params.id)
    .select('id, name, email, role, status, member_since, renewal_due').single();
  if (error) return res.status(404).json({ error: 'User not found' });
  res.json({ message: `Role updated to ${role}`, user: data });
});

// PATCH /api/admin/users/:id/suspend — suspend user
router.patch('/users/:id/suspend', async (req, res) => {
  const { data, error } = await supabase.from('users')
    .update({ status: 'INACTIVE' }).eq('id', req.params.id)
    .select('id, name, email, role, status').single();
  if (error) return res.status(404).json({ error: 'User not found' });
  res.json({ message: 'User suspended', user: data });
});

// PATCH /api/admin/users/:id/activate — reactivate user
router.patch('/users/:id/activate', async (req, res) => {
  const { data, error } = await supabase.from('users')
    .update({ status: 'ACTIVE' }).eq('id', req.params.id)
    .select('id, name, email, role, status').single();
  if (error) return res.status(404).json({ error: 'User not found' });
  res.json({ message: 'User activated', user: data });
});

// PATCH /api/admin/users/:id — update user details (name, email, institution, campus, phone)
router.patch('/users/:id', async (req, res) => {
  const { name, email, institution, campus, phone } = req.body;
  const updates = {};
  if (name !== undefined) updates.name = name.trim();
  if (email !== undefined) updates.email = email.trim().toLowerCase();
  if (institution !== undefined) updates.institution = institution;
  if (campus !== undefined) updates.campus = campus;
  if (phone !== undefined) updates.phone = phone;

  const { data, error } = await supabase.from('users')
    .update(updates).eq('id', req.params.id)
    .select('id, name, email, role, status, institution, campus, phone, avatar_url, tier, member_since, renewal_due, created_at').single();
  if (error) return res.status(404).json({ error: 'User not found or update failed' });
  res.json({ message: 'User updated successfully', user: data });
});

// DELETE /api/admin/users/:id — delete user account
router.delete('/users/:id', async (req, res) => {
  if (req.params.id === req.user.id) {
    return res.status(400).json({ error: 'Cannot delete your own admin account' });
  }

  // Also clean up any linked applications, registrations, enrollments
  await Promise.all([
    supabase.from('event_registrations').delete().eq('user_id', req.params.id),
    supabase.from('training_enrollments').delete().eq('user_id', req.params.id),
    supabase.from('membership_applications').delete().eq('user_id', req.params.id),
  ]).catch(() => {});

  const { error } = await supabase.from('users').delete().eq('id', req.params.id);
  if (error) return res.status(404).json({ error: 'User not found or deletion failed' });
  res.json({ message: 'User account deleted successfully' });
});

// GET /api/admin/reports/events — event attendance report (uses actual registration count)
router.get('/reports/events', async (req, res) => {
  const { data: events, error } = await supabase.from('events')
    .select('id, title, date, category, total, organizer, registrations:event_registrations(count)');
  if (error) return res.status(500).json({ error: error.message });

  const report = (events || []).map(ev => {
    const actualEnrolled = ev.registrations?.[0]?.count ?? 0;
    return {
      id: ev.id, title: ev.title, date: ev.date,
      category: ev.category, organizer: ev.organizer,
      enrolled: actualEnrolled,
      total: ev.total,
      fillRate: ev.total > 0 ? Math.round((actualEnrolled / ev.total) * 100) : 0,
      spotsLeft: ev.total - actualEnrolled,
    };
  });

  const totalEnrolled = report.reduce((s, e) => s + e.enrolled, 0);
  const totalCapacity = report.reduce((s, e) => s + e.total, 0);

  res.json({
    events: report,
    summary: {
      totalEvents: report.length,
      totalEnrolled,
      totalCapacity,
      overallFillRate: totalCapacity > 0 ? Math.round((totalEnrolled / totalCapacity) * 100) : 0,
    },
  });
});

// GET /api/admin/reports/training — training enrollment report (uses actual enrollment count)
router.get('/reports/training', async (req, res) => {
  const { data: trainings, error } = await supabase.from('trainings')
    .select('id, title, category, org, total, level, enrollments:training_enrollments(count)');
  if (error) return res.status(500).json({ error: error.message });

  const report = (trainings || []).map(t => {
    const actualEnrolled = t.enrollments?.[0]?.count ?? 0;
    return {
      id: t.id, title: t.title, category: t.category,
      org: t.org, level: t.level,
      enrolled: actualEnrolled,
      total: t.total,
      fillRate: t.total > 0 ? Math.round((actualEnrolled / t.total) * 100) : 0,
      spotsLeft: t.total - actualEnrolled,
    };
  });

  res.json({
    trainings: report,
    summary: {
      totalPrograms: report.length,
      totalEnrolled: report.reduce((s, t) => s + t.enrolled, 0),
      totalCapacity: report.reduce((s, t) => s + t.total, 0),
    },
  });
});

// GET /api/admin/reports/chatbot — chatbot intent accuracy metrics
router.get('/reports/chatbot', async (req, res) => {
  const [logsResult, unmatchedResult] = await Promise.all([
    supabase.from('chatbot_logs')
      .select('matched, intent, created_at')
      .order('created_at', { ascending: false }),
    supabase.from('chatbot_logs')
      .select('message, created_at')
      .eq('matched', false)
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  if (logsResult.error) return res.status(500).json({ error: logsResult.error.message });

  const data = logsResult.data || [];
  const total = data.length;
  const matched = data.filter(l => l.matched).length;
  const accuracy = total > 0 ? Math.round((matched / total) * 100) : 0;

  const intentCounts = {};
  data.filter(l => l.matched && l.intent).forEach(l => {
    intentCounts[l.intent] = (intentCounts[l.intent] || 0) + 1;
  });

  res.json({
    total,
    matched,
    unmatched: total - matched,
    accuracy,
    topIntents: Object.entries(intentCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([intent, count]) => ({ intent, count })),
    unmatchedQueries: (unmatchedResult.data || []).map(q => ({
      message: q.message,
      time: q.created_at,
    })),
  });
});

// GET /api/admin/renewals — members with renewal due within 60 days
router.get('/renewals', async (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const in60 = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const { data, error } = await supabase.from('users')
    .select('id, name, email, institution, tier, renewal_due')
    .eq('role', 'MEMBER')
    .gte('renewal_due', today)
    .lte('renewal_due', in60)
    .order('renewal_due', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ data, count: data.length });
});

// PATCH /api/admin/users/:id/renew — renew membership for 1 year
router.patch('/users/:id/renew', async (req, res) => {
  const { data: user, error: fetchErr } = await supabase.from('users')
    .select('id, renewal_due').eq('id', req.params.id).single();
  if (fetchErr || !user) return res.status(404).json({ error: 'User not found' });

  const nextYear = new Date();
  const renewal_due = `${nextYear.getFullYear() + 1}-12-31`;

  const { data, error } = await supabase.from('users')
    .update({ renewal_due, status: 'ACTIVE' }).eq('id', req.params.id)
    .select('id, name, email, role, status, renewal_due').single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Membership renewed', user: data });
});

module.exports = router;
