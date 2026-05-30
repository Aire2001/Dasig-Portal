const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const supabase = require('../lib/supabase');
const { verifyToken } = require('../middleware/auth');
const { sendPasswordResetEmail } = require('../lib/mailer');

const router = express.Router();
const loginAttempts = {};

function checkBrute(email) {
  const now = Date.now();
  const rec = loginAttempts[email] || { count: 0, lockedUntil: 0 };
  if (rec.lockedUntil > now) return { locked: true, wait: Math.ceil((rec.lockedUntil - now) / 1000) };
  return { locked: false };
}
function recordFail(email) {
  const rec = loginAttempts[email] || { count: 0, lockedUntil: 0 };
  rec.count += 1;
  if (rec.count >= 5) { rec.lockedUntil = Date.now() + 15 * 60 * 1000; rec.count = 0; }
  loginAttempts[email] = rec;
}
function clearAttempts(email) { delete loginAttempts[email]; }

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const brute = checkBrute(email);
  if (brute.locked) return res.status(429).json({ error: `Account locked. Try again in ${brute.wait}s.` });

  const { data: user, error } = await supabase
    .from('users').select('*').eq('email', email.toLowerCase()).single();

  if (error || !user) { recordFail(email); return res.status(401).json({ error: 'Invalid credentials' }); }

  if (user.status === 'INACTIVE') {
    return res.status(403).json({ error: 'Account suspended. Contact the DASIG administrator.' });
  }

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) { recordFail(email); return res.status(401).json({ error: 'Invalid credentials' }); }

  clearAttempts(email);
  const expiresIn = user.role === 'ADMIN'
    ? (process.env.JWT_EXPIRES_ADMIN || '24h')
    : (process.env.JWT_EXPIRES_MEMBER || '7d');
  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn });

  const { password_hash, ...safeUser } = user;
  res.json({ token, user: safeUser });
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, password, institution, campus } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password are required' });
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return res.status(400).json({ error: 'Invalid email format' });

  const { data: existing } = await supabase.from('users').select('id').eq('email', email.toLowerCase()).single();
  if (existing) return res.status(409).json({ error: 'Email already registered' });

  const password_hash = await bcrypt.hash(password, 12);
  const { data: newUser, error } = await supabase.from('users').insert({
    name: name.trim(),
    email: email.toLowerCase(),
    password_hash,
    role: 'GUEST', status: 'GUEST',
    institution: institution || null,
    campus: campus || null,
  }).select().single();

  if (error) return res.status(500).json({ error: 'Registration failed' });

  const token = jwt.sign({ id: newUser.id, role: newUser.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_MEMBER || '7d' });
  const { password_hash: _, ...safeUser } = newUser;
  res.status(201).json({ token, user: safeUser });
});

// GET /api/auth/me — get current user profile
router.get('/me', verifyToken, (req, res) => {
  const { password_hash, ...safeUser } = req.user;
  res.json(safeUser);
});

// PUT /api/auth/profile — update profile fields
router.put('/profile', verifyToken, async (req, res) => {
  const { name, institution, campus, phone } = req.body;
  const updates = {};
  if (name !== undefined) {
    if (!name.trim()) return res.status(400).json({ error: 'Name cannot be empty' });
    updates.name = name.trim();
  }
  if (institution !== undefined) updates.institution = institution;
  if (campus !== undefined) updates.campus = campus;
  if (phone !== undefined) updates.phone = phone || null;

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No updatable fields provided' });
  }

  const { data, error } = await supabase.from('users').update(updates).eq('id', req.user.id)
    .select('id, name, email, role, status, institution, campus, phone, tier, member_since, renewal_due').single();
  if (error) return res.status(500).json({ error: 'Profile update failed' });
  res.json({ message: 'Profile updated', user: data });
});

// PUT /api/auth/password — change password
router.put('/password', verifyToken, async (req, res) => {
  const { current_password, new_password } = req.body;
  if (!current_password || !new_password) {
    return res.status(400).json({ error: 'current_password and new_password are required' });
  }
  if (new_password.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters' });
  }

  const { data: user } = await supabase.from('users').select('password_hash').eq('id', req.user.id).single();
  const match = await bcrypt.compare(current_password, user.password_hash);
  if (!match) return res.status(401).json({ error: 'Current password is incorrect' });

  const password_hash = await bcrypt.hash(new_password, 12);
  const { error } = await supabase.from('users').update({ password_hash }).eq('id', req.user.id);
  if (error) return res.status(500).json({ error: 'Password change failed' });
  res.json({ message: 'Password changed successfully' });
});

// POST /api/auth/forgot-password — generate reset token
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const { data: user } = await supabase.from('users').select('id, email').eq('email', email.toLowerCase()).single();
  if (!user) {
    // Don't reveal whether the email exists
    return res.json({ message: 'If that email is registered, a reset link has been sent.' });
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

  await supabase.from('users').update({ reset_token: token, reset_token_expires: expires }).eq('id', user.id);

  // Send real email (fire-and-forget; if SMTP not configured, mailer logs a warning)
  sendPasswordResetEmail(user.email, token).catch(err => console.error('[mailer] send error:', err.message));

  const response = { message: 'If that email is registered, a reset link has been sent.' };
  // Return token in demo/dev mode (no SMTP configured) so the UI can show it
  if (!process.env.SMTP_USER) response.reset_token = token;
  res.json(response);
});

// POST /api/auth/reset-password — validate token and set new password
router.post('/reset-password', async (req, res) => {
  const { token, new_password } = req.body;
  if (!token || !new_password) return res.status(400).json({ error: 'token and new_password are required' });
  if (new_password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

  const { data: user } = await supabase
    .from('users')
    .select('id, reset_token, reset_token_expires')
    .eq('reset_token', token)
    .single();

  if (!user) return res.status(400).json({ error: 'Invalid or expired reset token' });
  if (new Date(user.reset_token_expires) < new Date()) {
    return res.status(400).json({ error: 'Reset token has expired. Please request a new one.' });
  }

  const password_hash = await bcrypt.hash(new_password, 12);
  const { error } = await supabase
    .from('users')
    .update({ password_hash, reset_token: null, reset_token_expires: null })
    .eq('id', user.id);

  if (error) return res.status(500).json({ error: 'Password reset failed' });
  res.json({ message: 'Password reset successfully. You may now log in.' });
});

// GET /api/auth/my-registrations — events the user registered for
router.get('/my-registrations', verifyToken, async (req, res) => {
  const { data, error } = await supabase.from('event_registrations')
    .select('event_id, created_at, events(id, title, date, venue, category)')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/auth/my-enrollments — trainings the user enrolled in
router.get('/my-enrollments', verifyToken, async (req, res) => {
  const { data, error } = await supabase.from('training_enrollments')
    .select('training_id, created_at, trainings(id, title, category, org, duration, level)')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

module.exports = router;
