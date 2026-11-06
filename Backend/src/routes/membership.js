const express = require('express');
const supabase = require('../lib/supabase');
const { verifyToken, requireRole } = require('../middleware/auth');
const {
  sendMembershipApplicationNotification,
  sendMembershipApprovalEmail,
  sendMembershipRejectionEmail,
} = require('../lib/mailer');

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

  // Notify admin (fire-and-forget)
  sendMembershipApplicationNotification({
    name: req.user.name, email: req.user.email,
    institution, campus: campus || '', tier: tier || 'Tier 2',
  }).catch(() => {});

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

  // Determine recipient email and name for confirmation dispatch
  let targetEmail = app.email;
  let targetName = app.name;
  if ((!targetEmail || !targetName) && app.user_id) {
    const { data: u } = await supabase.from('users').select('email, name').eq('id', app.user_id).single();
    if (u) {
      if (!targetEmail) targetEmail = u.email;
      if (!targetName) targetName = u.name;
    }
  }

  // Dispatch formal approval and welcome email to applicant's email address
  if (targetEmail) {
    sendMembershipApprovalEmail({
      name: targetName || 'Consortium Member',
      email: targetEmail,
      institution: app.institution,
      campus: app.campus,
      tier: app.tier || 'Tier 2',
    }).catch(err => {
      console.error(`[membership] Failed to send approval email to ${targetEmail}:`, err.message);
    });
  }

  res.json({
    message: 'Application approved & confirmation email sent to applicant',
    application: { ...app, status: 'APPROVED' },
    emailSentTo: targetEmail || null,
  });
});

router.patch('/applications/:id/reject', verifyToken, requireRole('ADMIN'), async (req, res) => {
  const { reason } = req.body;
  const { data: app, error: fetchErr } = await supabase.from('membership_applications')
    .select('*').eq('id', req.params.id).single();
  if (fetchErr || !app) return res.status(404).json({ error: 'Application not found' });

  const updates = { status: 'REJECTED' };
  if (reason) updates.rejection_reason = reason;
  const { error } = await supabase.from('membership_applications').update(updates).eq('id', req.params.id);
  if (error) return res.status(500).json({ error: 'Failed to update application status' });

  // Determine applicant contact
  let targetEmail = app.email;
  let targetName = app.name;
  if ((!targetEmail || !targetName) && app.user_id) {
    const { data: u } = await supabase.from('users').select('email, name').eq('id', app.user_id).single();
    if (u) {
      if (!targetEmail) targetEmail = u.email;
      if (!targetName) targetName = u.name;
    }
  }

  if (targetEmail) {
    sendMembershipRejectionEmail({
      name: targetName || 'Applicant',
      email: targetEmail,
      institution: app.institution,
      reason: reason || '',
    }).catch(err => {
      console.error(`[membership] Failed to send rejection email to ${targetEmail}:`, err.message);
    });
  }

  res.json({
    message: 'Application rejected & notification email sent',
    reason: reason || null,
    emailSentTo: targetEmail || null,
  });
});

module.exports = router;
