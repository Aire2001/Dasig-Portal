const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const supabase = require('../lib/supabase');

// INC-06: every token carries a short fingerprint of the password hash ("pwv").
// Changing or resetting the password changes the hash, so every older token stops working.
function passwordVersion(user) {
  return crypto.createHash('sha256').update(String(user.password_hash || '')).digest('hex').slice(0, 16);
}

function signToken(user, expiresIn) {
  return jwt.sign({ id: user.id, role: user.role, pwv: passwordVersion(user) }, process.env.JWT_SECRET, { expiresIn });
}

// Returns null when the session is still valid, otherwise { status, error }
function sessionProblem(payload, user) {
  if (user.status === 'INACTIVE') {
    return { status: 403, error: 'Account suspended. Your session token is no longer valid.' };
  }
  if (!payload.pwv || payload.pwv !== passwordVersion(user)) {
    return { status: 401, error: 'Session token is no longer valid. Please sign in again.' };
  }
  return null;
}

async function verifyToken(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', payload.id)
      .single();
    if (error || !user) return res.status(401).json({ error: 'User not found', code: 'SESSION_INVALID' });
    const problem = sessionProblem(payload, user);
    if (problem) return res.status(problem.status).json({ error: problem.error, code: 'SESSION_INVALID' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token', code: 'SESSION_INVALID' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

// Optional auth — populates req.user if a valid token is present, but does not reject unauthenticated requests
async function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return next();
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const { data: user } = await supabase.from('users').select('*').eq('id', payload.id).single();
    // Suspended accounts and tokens from before a password change are treated as signed out
    if (user && !sessionProblem(payload, user)) req.user = user;
  } catch {
    // invalid/expired token — treat as unauthenticated
  }
  next();
}

module.exports = { verifyToken, requireRole, optionalAuth, signToken, passwordVersion };
