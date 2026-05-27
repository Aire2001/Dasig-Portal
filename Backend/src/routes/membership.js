const express = require('express');
const supabase = require('../lib/supabase');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/status', verifyToken, (req, res) => {
  const u = req.user;
  res.json({
    status: u.status,
    role: u.role,
    institution: u.institution,
    campus: u.campus,
    tier: u.tier,
    memberSince: u.member_since,
    renewalDue: u.renewal_due,
    modulesAccess: u.role === 'ADMIN' || u.role === 'MEMBER' ? 'All 9 Modules' : 'Public Modules Only',
  });
});

router.post('/apply', verifyToken, async (req, res) => {
  const { institution, campus, tier } = req.body;
  if (!institution) return res.status(400).json({ error: 'Institution is required' });

  const { data: existing } = await supabase.from('membership_applications')
    .select('id').eq('user_id', req.user.id).eq('status', 'PENDING').single();
  if (existing) return res.status(409).json({ error: 'You already have a pending application' });

  const { data: app, error } = await supabase.from('membership_applications').insert({
    user_id: req.user.id,
    name: req.user.name,
    email: req.user.email,
    institution,
    campus: campus || '',
    tier: tier || 'Tier 2',
    status: 'PENDING',
  }).select().single();

  if (error) return res.status(500).json({ error: 'Failed to submit application' });
  res.status(201).json({ message: 'Application submitted. Pending admin approval.', application: app });
});

router.get('/applications', verifyToken, requireRole('ADMIN'), async (req, res) => {
  const { data, error } = await supabase.from('membership_applications').select('*').order('applied_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.patch('/applications/:id/approve', verifyToken, requireRole('ADMIN'), async (req, res) => {
  const { data: app, error: fetchErr } = await supabase.from('membership_applications')
    .select('*').eq('id', req.params.id).single();
  if (fetchErr || !app) return res.status(404).json({ error: 'Application not found' });

  await supabase.from('membership_applications').update({ status: 'APPROVED' }).eq('id', app.id);
  await supabase.from('users').update({
    role: 'MEMBER', status: 'ACTIVE',
    institution: app.institution, campus: app.campus, tier: app.tier,
    member_since: new Date().toISOString().slice(0, 10),
    renewal_due: `${new Date().getFullYear() + 1}-12-31`,
  }).eq('id', app.user_id);

  res.json({ message: 'Application approved', application: { ...app, status: 'APPROVED' } });
});

router.patch('/applications/:id/reject', verifyToken, requireRole('ADMIN'), async (req, res) => {
  const { error } = await supabase.from('membership_applications').update({ status: 'REJECTED' }).eq('id', req.params.id);
  if (error) return res.status(404).json({ error: 'Application not found' });
  res.json({ message: 'Application rejected' });
});

module.exports = router;
