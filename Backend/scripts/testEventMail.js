const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { sendEventRegistrationEmail } = require('../src/lib/mailer');

async function test() {
  const target = 'christianaire18@gmail.com';
  console.log('Sending test Event Registration email to:', target);
  
  const attendee = {
    name: 'Christian Aire Tan',
    email: target,
    role: 'MEMBER',
    institution: 'University of San Carlos'
  };

  const event = {
    id: 1,
    title: 'Region VII Innovation & Research Summit 2026',
    date: 'March 25, 2026',
    start_time: '08:30 AM',
    end_time: '05:00 PM',
    venue: 'Cebu Convention Center / Virtual Hybrid Room A',
    organizer: 'DOST Region VII & DASIG Academic Consortium',
    category: 'Innovation Summit'
  };

  const res = await sendEventRegistrationEmail(attendee, event);
  console.log('✅ sendEventRegistrationEmail succeeded! Result:', res ? (res.messageId || JSON.stringify(res)) : 'Sent');
}

test().then(() => process.exit(0)).catch(e => { console.error('❌ Failed:', e); process.exit(1); });
