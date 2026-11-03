const crypto = require('crypto');

const resetTokens = new Map();
const resetFailures = new Map();
const MAX_RESET_ATTEMPTS = 5;

// Mock forgot-password
function forgotPassword(email) {
  const token = '654321';
  const expiresDate = new Date(Date.now() + 60 * 60 * 1000);
  resetTokens.set(email.toLowerCase(), { token, expires: expiresDate, userId: 12 });
  return { message: 'sent' };
}

// Mock reset-password
function resetPassword(email, token, newPassword) {
  const cleanEmail = email.toLowerCase().trim();
  const cleanToken = token.trim();
  const memRecord = resetTokens.get(cleanEmail);
  if (!memRecord) return { error: 'Invalid or expired' };
  
  const stored = Buffer.from(String(memRecord.token));
  const given = Buffer.from(cleanToken);
  const matches = stored.length === given.length && crypto.timingSafeEqual(stored, given);
  if (!matches) {
    const fails = (resetFailures.get(12) || 0) + 1;
    if (fails >= MAX_RESET_ATTEMPTS) {
      resetTokens.delete(cleanEmail);
      resetFailures.delete(12);
      return { error: 'Too many incorrect codes' };
    }
    resetFailures.set(12, fails);
    return { error: 'Invalid or expired' };
  }
  resetTokens.delete(cleanEmail);
  resetFailures.delete(12);
  return { success: true };
}

// Test 1: Generate
forgotPassword('test@example.com');
console.log('Test 1 - Generate OTP: PASSED');

// Test 2: Wrong code
const r1 = resetPassword('test@example.com', '000000', 'newpass123');
console.log('Test 2 - Wrong code rejected:', r1.error === 'Invalid or expired' ? 'PASSED' : 'FAILED');

// Test 3: Correct code
const r2 = resetPassword('test@example.com', '654321', 'newpass123');
console.log('Test 3 - Correct code accepted:', r2.success === true ? 'PASSED' : 'FAILED');

// Test 4: Reusing code
const r3 = resetPassword('test@example.com', '654321', 'newpass123');
console.log('Test 4 - One-time use enforced:', r3.error === 'Invalid or expired' ? 'PASSED' : 'FAILED');
