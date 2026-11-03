const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { sendPasswordResetEmail } = require('../src/lib/mailer');
const target = 'christianaire18@gmail.com';
console.log('Testing SMTP dispatch to:', target);
console.log('SMTP_USER configured:', process.env.SMTP_USER);

sendPasswordResetEmail(target, '849201')
  .then(info => {
    console.log('✅ sendPasswordResetEmail succeeded! Result:', info ? (info.messageId || JSON.stringify(info)) : 'Done');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error sending reset email:', err);
    process.exit(1);
  });
