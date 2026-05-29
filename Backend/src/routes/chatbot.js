const express = require('express');
const supabase = require('../lib/supabase');

const router = express.Router();

// DASIG NLP Knowledge Base — scored multi-keyword matching
const KB = [
  {
    intent: 'greeting',
    keywords: ['hello', 'hi', 'good morning', 'good afternoon', 'good evening', 'hey', 'howdy', 'kumusta'],
    reply: 'Hello! Welcome to the DASIG Portal. I can help you with information about events, training programs, membership, policies, funding opportunities, and partnerships. What would you like to know?',
  },
  {
    intent: 'about_dasig',
    keywords: ['what is dasig', 'about dasig', 'dasig consortium', 'who is dasig', 'what does dasig do', 'dasig mission', 'dasig vision'],
    reply: 'DASIG (Dynamic Academic and Scientific Information Group) is a Region VII consortium of member institutions dedicated to collaborative research, governance innovation, and knowledge sharing among higher education institutions and government agencies in the Philippines.',
  },
  {
    intent: 'member_institutions',
    keywords: ['member institution', 'consortium member', 'who are members', 'list of members', 'institutional member', 'partner institution'],
    reply: 'The DASIG Consortium includes six Region VII member institutions: University of the Philippines (UP Visayas), University of San Agustin (Iloilo City), DOST Region VII, DICT Region VII, DTI Region VII, and DepEd Region VII.',
  },
  {
    intent: 'events',
    keywords: ['event', 'summit', 'seminar', 'conference', 'workshop', 'upcoming event', 'schedule', 'activity', 'forum'],
    reply: 'DASIG regularly holds summits, seminars, workshops, and forums for member institutions. Visit the Events module to see all upcoming activities, register, and manage your event attendance.',
  },
  {
    intent: 'event_register',
    keywords: ['register event', 'event registration', 'sign up event', 'join event', 'attend event', 'how to register', 'how do i register', 'register for an event', 'sign up for', 'how to join an event', 'event sign up'],
    reply: 'To register for an event: go to the Events module, click on the event you want to join, and click "Register." You must be logged in. Events have limited capacity — register early!',
  },
  {
    intent: 'training',
    keywords: ['training', 'course', 'program', 'enroll', 'learning', 'bootcamp', 'certification', 'upskill', 'webinar'],
    reply: 'DASIG offers training programs in Technology, Research, Leadership, and Governance. Browse programs in the Training module, filter by category or level, and enroll with one click.',
  },
  {
    intent: 'membership',
    keywords: ['membership', 'become member', 'become a member', 'apply member', 'join dasig', 'membership application', 'how to join', 'member benefits', 'how do i become', 'how to become a member', 'how do i join', 'i want to join'],
    reply: 'To become a DASIG member: log in, go to Membership, and click "Apply for Membership." Fill in your institution details, select a tier, and submit. Applications are reviewed and approved by the DASIG administrator.',
  },
  {
    intent: 'membership_status',
    keywords: ['membership status', 'my membership', 'check membership', 'am i a member', 'membership tier', 'renewal', 'check my status', 'check status', 'my status', 'what is my status'],
    reply: 'Check your membership status in the Membership module under "My Status." It shows your role, tier, member-since date, and renewal due date. Contact your admin if renewal is approaching.',
  },
  {
    intent: 'membership_renewal',
    keywords: ['renew', 'renewal', 'membership expiry', 'renewal due', 'membership expired'],
    reply: 'Membership renewals are processed by the DASIG administrator. Your renewal due date is displayed in the Membership module. Contact admin@dasig.ph if your membership needs to be renewed.',
  },
  {
    intent: 'news',
    keywords: ['news', 'announcement', 'update', 'bulletin', 'article', 'latest news', 'new announcement'],
    reply: 'Stay updated through the News module. Public announcements are visible to everyone. Members-only articles — marked with a lock icon — require an active DASIG membership to read.',
  },
  {
    intent: 'policy',
    keywords: ['policy', 'policies', 'guidelines', 'rules', 'regulation', 'document', 'policy document', 'bylaws', 'charter', 'governance policy', 'governance policies', 'find policy'],
    reply: 'DASIG policies and guidelines are available in the Policies module. Active members can access all policy documents. Some documents are members-only. Archived policies are accessible to ADMIN users.',
  },
  {
    intent: 'funding',
    keywords: ['funding', 'scholarship', 'grant', 'financial', 'dost scholarship', 'fund', 'budget', 'research grant', 'funding opportunity', 'deadline', 'application deadline', 'what scholarships'],
    reply: 'Funding opportunities — including DOST scholarships, research grants, and government programs — are listed in the Funding module. Filter by category or status (Open/Closed) and check eligibility requirements.',
  },
  {
    intent: 'partnerships',
    keywords: ['partnership', 'partnerships', 'partner', 'collaboration', 'mou', 'moa', 'strategic partner', 'bilateral', 'agreement', 'tell me about partnerships', 'dasig partnerships'],
    reply: 'DASIG strategic partnerships with external organizations are documented in the Partnerships module. This module is accessible to active DASIG members.',
  },
  {
    intent: 'login',
    keywords: ['login', 'sign in', 'log in', 'forgot password', 'how to login', 'account access', 'credentials'],
    reply: 'Log in at the DASIG Portal using your registered email and password. After 5 failed attempts, accounts are temporarily locked for 15 minutes. For password issues, use the Change Password option in your profile settings.',
  },
  {
    intent: 'register_account',
    keywords: ['register account', 'sign up', 'create account', 'new account', 'registration', 'how to register'],
    reply: 'Create a DASIG account: click "Register" on the login page, provide your name, email, institution, and a password (minimum 8 characters). After registration, you\'ll have Guest access. Apply for full membership to unlock all modules.',
  },
  {
    intent: 'contact',
    keywords: ['contact', 'help', 'support', 'email', 'reach out', 'get in touch', 'admin contact'],
    reply: 'For support, contact the DASIG Consortium administrators at admin@dasig.ph. For institutional concerns, reach out to your campus representative. You can also raise issues through the Membership module.',
  },
  {
    intent: 'roles',
    keywords: ['role', 'access level', 'permission', 'guest access', 'member access', 'admin access', 'what can i do'],
    reply: 'DASIG has three access levels: GUEST (public content only), MEMBER (full access to events, training, news, policies, partnerships), and ADMIN (all member access plus content management and user administration).',
  },
  {
    intent: 'region_7',
    keywords: ['region 7', 'region vii', 'cebu', 'iloilo', 'western visayas', 'central visayas', 'visayas'],
    reply: 'DASIG serves Region VII (Central and Western Visayas) member institutions. The Annual Summit is typically held in Cebu City, and member institutions span cities including Iloilo, Cebu, and Bacolod.',
  },
  {
    intent: 'data_privacy',
    keywords: ['privacy', 'data privacy', 'ra 10173', 'personal data', 'data protection', 'confidential'],
    reply: 'DASIG complies with the Philippine Data Privacy Act (RA 10173). Your personal information is used only for consortium management purposes and is not shared with third parties without consent.',
  },
  {
    intent: 'tiers',
    keywords: ['tier 1', 'tier 2', 'membership tier', 'tier difference', 'full member', 'associate member'],
    reply: 'DASIG membership tiers define institutional participation levels: Tier 1 is Full Member (all consortium benefits) and Tier 2 is Associate Member (limited participation). Tier assignment is determined during the application process.',
  },
  {
    intent: 'haribon',
    keywords: ['haribon', 'who are you', 'what are you', 'ai assistant', 'chatbot', 'dasig ai', 'nlp', 'ask haribon'],
    reply: 'I am Haribon 🦅 — the DASIG AI Assistant powered by a Natural Language Processing engine. I am scoped exclusively to answer queries about the DASIG consortium: events, training, membership, policies, funding, partnerships, and institutional information. My intent recognition accuracy targets 80%+.',
  },
  {
    intent: 'admin_panel',
    keywords: ['admin', 'admin panel', 'admin dashboard', 'administrator', 'manage content', 'admin access'],
    reply: 'The DASIG Admin Panel is accessible to users with ADMIN role. It provides a dashboard to manage users, approve memberships, moderate content across all modules (Events, News, Training, Policies, Funding, Partnerships), and view portal analytics.',
  },
  {
    intent: 'chatbot_capabilities',
    keywords: ['what can you do', 'what do you know', 'help me', 'capabilities', 'topics', 'questions you can answer'],
    reply: 'I can answer questions about: 📅 Events & registration • 🎓 Training programs & enrollment • 👥 Membership (apply, status, tiers, renewal) • 📋 Policies & guidelines • 💰 Funding & scholarships • 🤝 Partnerships • 📰 News & announcements • 🏛 DASIG member institutions • 🔐 Login & account access. Just ask!',
  },
  {
    intent: 'portal_features',
    keywords: ['portal', 'dasig portal', 'features', 'platform', 'system', 'modules', 'what is in the portal'],
    reply: 'The DASIG Portal has 9 integrated modules: Membership, Events, News, Policies, Funding, Training, Partnerships, Members directory, and the Haribon AI Chatbot. It uses role-based access (Guest, Member, Admin) and is built for Region VII consortium institutions.',
  },
  {
    intent: 'it332',
    keywords: ['it332', 'capstone', 'team 40', 'cit-u', 'cebu institute', 'school project', 'who made this', 'who built this', 'who created this', 'who developed this', 'who made the portal', 'who built the portal', 'who created the portal', 'who built', 'who made', 'who created', 'project creator', 'developer'],
    reply: 'The DASIG Portal is the IT332 Capstone Project of Team 40 at CIT-U (Cebu Institute of Technology — University). It demonstrates enterprise-grade software engineering: NLP chatbot, role-based access control, Supabase backend, React frontend, and RESTful API design.',
  },
  {
    intent: 'summit',
    keywords: ['summit', 'annual summit', 'dasig summit', '2026 summit', 'consortium summit'],
    reply: 'The DASIG Annual Summit 2026 registration is now open! The summit gathers all six Region VII institutions for a three-day innovation forum, research showcase, and networking event in Cebu City. Register through the Events module.',
  },
  {
    intent: 'logout',
    keywords: ['logout', 'log out', 'sign out', 'exit account', 'how to logout'],
    reply: 'To log out of the DASIG Portal, click your profile icon in the navigation bar and select "Log out." Your session will be cleared and you will be redirected to the home page.',
  },
  {
    intent: 'forgot_password',
    keywords: ['forgot password', 'reset password', 'password reset', 'lost password', 'cannot login', "can't login", 'password help', 'reset link'],
    reply: 'To reset your password: click "Forgot password?" on the Login page, enter your registered email address, and you will receive a password reset link. Follow the link to set a new password. If you still have trouble, contact admin@dasig.ph.',
  },
  {
    intent: 'change_password',
    keywords: ['change password', 'update password', 'new password', 'modify password', 'password settings'],
    reply: 'To change your password while logged in: go to your profile (click your name in the nav bar) and select Change Password. Enter your current password, then your new password (minimum 8 characters). Click Save to update.',
  },
  {
    intent: 'update_profile',
    keywords: ['update profile', 'edit profile', 'change name', 'update information', 'profile settings', 'my profile', 'edit account'],
    reply: 'To update your profile, click your name or role badge in the navigation bar. You can edit your display name, institution, and campus. Administrators can also update other users\' information from the Admin Panel.',
  },
  {
    intent: 'my_events',
    keywords: ['my events', 'events i registered', 'registered events', 'my registrations', 'event history', 'events i joined'],
    reply: 'To view events you have registered for, go to your Profile page and check the "My Registrations" section. It lists all events you signed up for along with registration dates.',
  },
  {
    intent: 'my_trainings',
    keywords: ['my trainings', 'my enrollments', 'enrolled trainings', 'training history', 'courses i enrolled', 'trainings i joined'],
    reply: 'To view your training enrollments, visit your Profile page and check the "My Enrollments" section. It shows all training programs you are enrolled in, including course category and organizing agency.',
  },
  {
    intent: 'attendance',
    keywords: ['attendance', 'mark attendance', 'check in', 'attended', 'event check-in', 'confirm attendance', 'attendance tracking'],
    reply: 'Attendance tracking is available for registered events. Once you attend an event, the DASIG administrator can mark your attendance in the system. Your attendance record is stored in your event registration history.',
  },
  {
    intent: 'certificate',
    keywords: ['certificate', 'certification', 'training certificate', 'completion certificate', 'proof of training', 'e-certificate'],
    reply: 'Certificates of completion are issued by the organizing agency of each training program after you finish the course. DICT VII, DOST VII, DTI VII, and DepEd VII have their own certificate issuance process. Check the training description for details.',
  },
  {
    intent: 'event_capacity',
    keywords: ['full', 'slot', 'available slot', 'seat', 'capacity', 'fully booked', 'no more slot', 'waitlist'],
    reply: 'Each event has a maximum capacity. Once an event is fully booked, registration is closed. There is no waitlist feature currently — check the Events module regularly for newly added events or slot openings.',
  },
  {
    intent: 'fees',
    keywords: ['fee', 'cost', 'price', 'registration fee', 'free', 'paid', 'how much', 'payment', 'membership fee'],
    reply: 'Training program and event fees vary by activity. Membership fees are set per tier: Tier 1 (Full Member) is PHP 15,000/year and Tier 2 (Associate) is PHP 8,000/year. Some events are free for DASIG members. Check individual event or training details for specific fees. Members receive a 20% discount on training fees.',
  },
  {
    intent: 'research',
    keywords: ['research', 'research program', 'research collaboration', 'joint research', 'publication', 'paper', 'study'],
    reply: 'DASIG supports joint research initiatives among member institutions. The consortium launched a two-year AI in Public Governance research program in 2026. Research collaboration proposals can be submitted through the Partnerships module. Research outputs are published in indexed journals.',
  },
  {
    intent: 'ched',
    keywords: ['ched', 'commission on higher education', 'accreditation', 'higher education'],
    reply: 'The Commission on Higher Education (CHED) Region VII is a key partner of DASIG. The CHED-DASIG Academic Partnership covers curriculum development, faculty exchange, and accreditation support for member HEIs. Partnership details are in the Partnerships module.',
  },
  {
    intent: 'consortium_history',
    keywords: ['history', 'dasig founded', 'when was dasig', 'how old is dasig', 'established', 'origin', 'dasig history'],
    reply: 'DASIG (Dynamic Academic and Scientific Information Group) is a Region VII consortium founded to foster collaborative research and governance innovation among Philippine higher education institutions and government agencies. It brings together universities and DOST, DICT, DTI, and DepEd in Region VII.',
  },
  {
    intent: 'mobile_access',
    keywords: ['mobile', 'phone', 'tablet', 'app', 'download app', 'android', 'ios', 'responsive'],
    reply: 'The DASIG Portal is web-based and works on all modern browsers including mobile devices. It is fully responsive and accessible on smartphones and tablets. There is currently no dedicated mobile app — use your mobile browser to access the portal.',
  },
  {
    intent: 'technical_support',
    keywords: ['not working', 'error', 'bug', 'problem', 'issue', 'broken', 'technical problem', 'page not loading', 'fix'],
    reply: 'For technical issues with the DASIG Portal, please contact the IT Support team at admin@dasig.ph. Provide a description of the problem, the module where the issue occurred, and your browser/device. The development team will address it promptly.',
  },
  {
    intent: 'feedback',
    keywords: ['feedback', 'suggestion', 'comment', 'improve', 'feature request', 'report issue', 'rate'],
    reply: 'We welcome your feedback on the DASIG Portal! Please send suggestions, feature requests, or bug reports to admin@dasig.ph or contact your campus DASIG coordinator. Your input helps improve the system for all member institutions.',
  },
  {
    intent: 'news_members_only',
    keywords: ['members only news', 'locked article', 'restricted news', 'cannot read news', 'upgrade access', 'members only', 'members only article', 'restricted article', 'exclusive article', 'news locked'],
    reply: 'Some news articles are marked "Members Only" and require an active DASIG membership to read. If you see a locked article, apply for membership through the Membership module. Guest users can access all public announcements.',
  },
  {
    intent: 'booking_confirmation',
    keywords: ['booking confirmation', 'confirmation email', 'registered successfully', 'proof of registration', 'event confirmation'],
    reply: 'After successfully registering for an event, your registration is saved in the system. You can confirm your registration by checking "My Registrations" in your Profile page. A confirmation record with the event name and date is stored there.',
  },
  {
    intent: 'cancel_registration',
    keywords: ['cancel registration', 'cancel my registration', 'cancel my event', 'cancel my enrollment', 'unregister', 'cancel event', 'withdraw registration', 'cancel enrollment', 'unenroll', 'unenroll from training', 'remove registration', 'how to cancel', 'drop training', 'withdraw from training', 'cancel my', 'how do i cancel'],
    reply: 'To cancel an event registration: go to the Events module, find your registered event, and click "Cancel Registration." To unenroll from a training program: go to the Training module and click "Unenroll." Cancellations are immediate — your slot may be taken by another participant.',
  },
  {
    intent: 'profile_page',
    keywords: ['profile page', 'my profile page', 'where is my profile', 'view profile', 'account page', 'profile section', 'my account'],
    reply: 'Your Profile page is accessible by clicking your name or avatar in the navigation bar. It shows your account details, membership status, registered events, and enrolled training programs. You can edit your name, institution, and campus from there.',
  },
  {
    intent: 'guest_access',
    keywords: ['guest', 'guest user', 'not logged in', 'without account', 'what can guests do', 'guest access', 'free access', 'no account'],
    reply: 'Guest users (not logged in) can browse public Events, News announcements, Training programs, and the Members directory. To access Policies, Partnerships, Funding, and members-only content, you need to register and apply for DASIG membership.',
  },
];

// Follow-up suggestions — contextually relevant, never re-trigger the same intent
const FOLLOWUPS = {
  greeting:             ['What events are coming up?', 'How do I become a DASIG member?', 'What training programs are offered?'],
  about_dasig:          ['Who are the six consortium members?', 'What modules does the portal offer?', 'How do I join DASIG?'],
  member_institutions:  ['How do I apply for DASIG membership?', 'What are the membership tier differences?', 'Tell me about DASIG partnerships'],
  events:               ['How do I register for an event?', 'What is the DASIG Annual Summit?', 'What if the event I want is full?'],
  event_register:       ['How do I check my event registrations?', 'How is event attendance tracked?', 'Can I cancel my registration?'],
  training:             ['How do I apply for DASIG membership?', 'Will I earn a certificate after finishing?', 'What are the membership fees?'],
  membership:           ['What are the two membership tiers?', 'How much does membership cost?', 'What is my current membership status?'],
  membership_status:    ['How do I renew my membership?', 'What privileges do members get?', 'How do I update my profile information?'],
  membership_renewal:   ['How much does membership cost?', 'How do I contact the DASIG admin?', 'What are the two membership tiers?'],
  news:                 ['How do I unlock members only articles?', 'What events are coming up?', 'What funding opportunities are open?'],
  policy:               ['What is DASIG\'s data privacy stance?', 'What role is needed to view all content?', 'How do I contact the DASIG admin?'],
  funding:              ['How do I get in touch with DOST?', 'What privileges do Tier 1 members have?', 'How do I become a DASIG member?'],
  partnerships:         ['Tell me about the CHED partnership', 'What joint research programs exist?', 'How do I become a DASIG member?'],
  login:                ['How do I create a new account?', 'How do I reset my password?', 'What can guest users access?'],
  register_account:     ['How do I become a DASIG member?', 'What are the two membership tiers?', 'What can guest users do on the portal?'],
  contact:              ['How do I report a technical issue?', 'How do I apply for DASIG membership?', 'What events are coming up?'],
  roles:                ['How do I become a DASIG member?', 'What can guest users access?', 'What can DASIG admins manage?'],
  tiers:                ['How do I apply for DASIG membership?', 'How much does membership cost?', 'What privileges do members get?'],
  fees:                 ['How do I apply for DASIG membership?', 'How do I get in touch with DOST?', 'What is my current membership status?'],
  research:             ['Tell me about DASIG partnerships', 'What funding opportunities are open?', 'What events are coming up?'],
  summit:               ['How do I register for an event?', 'What other events are coming up?', 'How do I become a DASIG member?'],
  forgot_password:      ['How do I sign in to my account?', 'How do I create a new account?', 'How do I contact the DASIG admin?'],
  haribon:              ['What topics can you answer?', 'What events are coming up?', 'How do I become a DASIG member?'],
  portal_features:      ['What events are coming up?', 'How do I become a DASIG member?', 'What training programs are offered?'],
  chatbot_capabilities: ['What events are coming up?', 'How do I become a DASIG member?', 'What funding opportunities are open?'],
  attendance:           ['How do I check my event registrations?', 'How do I register for an event?', 'Can I cancel my registration?'],
  certificate:          ['What training programs are offered?', 'How do I view my enrollments?', 'What are the membership fees?'],
  event_capacity:       ['What other events are coming up?', 'How do I register for an event?', 'What training programs are offered?'],
  data_privacy:         ['What governance policies are available?', 'How do I contact the DASIG admin?', 'How do I update my profile information?'],
  ched:                 ['Tell me about DASIG partnerships', 'What funding opportunities are open?', 'Who are the consortium members?'],
  consortium_history:   ['Who are the six consortium members?', 'What is in the DASIG portal?', 'How do I join DASIG?'],
  region_7:             ['Who are the six consortium members?', 'What events are coming up?', 'Tell me about DASIG partnerships'],
  admin_panel:          ['How do I become a DASIG member?', 'What are the two membership tiers?', 'What can DASIG admins manage?'],
  it332:                ['What is in the DASIG portal?', 'What topics can Haribon answer?', 'What events are coming up?'],
  logout:               ['How do I sign in to my account?', 'What can guest users access?', 'How do I become a DASIG member?'],
  change_password:      ['How do I sign in to my account?', 'How do I update my profile information?', 'How do I contact the DASIG admin?'],
  update_profile:       ['What is my current membership status?', 'How do I change my password?', 'How do I contact the DASIG admin?'],
  my_events:            ['What other events are coming up?', 'How do I register for an event?', 'How is event attendance tracked?'],
  my_trainings:         ['What training programs are offered?', 'Will I earn a certificate after finishing?', 'What are the membership fees?'],
  mobile_access:        ['What is in the DASIG portal?', 'What events are coming up?', 'How do I become a DASIG member?'],
  technical_support:    ['How do I contact the DASIG admin?', 'What is in the DASIG portal?', 'How do I sign in to my account?'],
  feedback:             ['How do I contact the DASIG admin?', 'What is in the DASIG portal?', 'What events are coming up?'],
  news_members_only:    ['How do I become a DASIG member?', 'What are the latest announcements?', 'What events are coming up?'],
  booking_confirmation: ['What other events are coming up?', 'How do I check my event registrations?', 'How is event attendance tracked?'],
  cancel_registration:  ['How do I register for an event?', 'What other events are coming up?', 'How do I check my event registrations?'],
  profile_page:         ['How do I update my profile information?', 'What is my current membership status?', 'How do I check my event registrations?'],
  guest_access:         ['How do I create a DASIG account?', 'How do I become a DASIG member?', 'What events are coming up?'],
};
const DEFAULT_FOLLOWUPS = [
  '📅 What events are coming up?',
  '🎓 What training is available?',
  '👥 How do I become a member?',
  '📋 What policies are available?',
  '💰 What funding opportunities exist?',
  '🤝 Tell me about partnerships',
];

// Improved NLP: score-based matching — picks the entry with the most keyword hits
function matchIntent(text) {
  const lower = text.toLowerCase().trim();
  let best = null;
  let bestScore = 0;

  for (const entry of KB) {
    let score = 0;
    for (const kw of entry.keywords) {
      const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // word-boundary match scores 2, substring match scores 1
      if (new RegExp(`\\b${escaped}\\b`).test(lower)) score += 2;
      else if (lower.includes(kw)) score += 1;
    }
    if (score > bestScore) { bestScore = score; best = entry; }
  }

  return bestScore > 0 ? { reply: best.reply, intent: best.intent, score: bestScore } : null;
}

// POST /api/chatbot/message
router.post('/message', async (req, res) => {
  const { message } = req.body;
  if (!message || !message.trim()) return res.status(400).json({ error: 'Message is required' });

  const trimmed = message.trim();
  // Strip leading emoji (e.g. from DEFAULT_FOLLOWUP chips like "📅 What events...") before NLP matching
  const normalized = trimmed.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}]+\s*/gu, '');
  const match = matchIntent(normalized);

  // Log to DB for accuracy tracking (fire-and-forget)
  supabase.from('chatbot_logs').insert({
    message: normalized,
    matched: !!match,
    intent: match ? match.intent : null,
  }).then(() => {}).catch(() => {});

  if (!match) {
    return res.json({
      reply: `I couldn't find a specific answer for that. Try rephrasing, or pick a topic below — I'm happy to help!`,
      matched: false,
      intent: null,
      score: 0,
      followups: DEFAULT_FOLLOWUPS,
    });
  }

  let reply = match.reply;

  // Enrich reply with live DB data for key intents
  const uniq = (arr, key) => {
    const seen = new Set();
    return arr.filter(r => { const v = r[key]; return seen.has(v) ? false : seen.add(v); });
  };

  try {
    if (match.intent === 'events' || match.intent === 'summit') {
      const { data } = await supabase.from('events').select('title, date, venue').order('id', { ascending: true }).limit(6);
      if (data && data.length > 0) {
        const items = uniq(data, 'title').slice(0, 3);
        const list = items.map(e => `• ${e.title} — ${e.date || 'TBA'}${e.venue ? ' @ ' + e.venue : ''}`).join('\n');
        reply = `${match.reply}\n\n📅 Upcoming events:\n${list}\n\nRegister early — slots are limited!`;
      }
    } else if (match.intent === 'training') {
      const { data } = await supabase.from('trainings').select('title, category, level').limit(6);
      if (data && data.length > 0) {
        const items = uniq(data, 'title').slice(0, 3);
        const list = items.map(t => `• ${t.title}${t.category ? ' [' + t.category + ']' : ''}${t.level ? ' — ' + t.level : ''}`).join('\n');
        reply = `${match.reply}\n\n🎓 Featured programs:\n${list}\n\nBrowse all in the Training module!`;
      }
    } else if (match.intent === 'news') {
      const { data } = await supabase.from('news').select('title, badge').eq('archived', false).order('date', { ascending: false }).limit(6);
      if (data && data.length > 0) {
        const items = uniq(data, 'title').slice(0, 3);
        const list = items.map(n => `• ${n.title}${n.badge ? ' [' + n.badge + ']' : ''}`).join('\n');
        reply = `${match.reply}\n\n📰 Latest articles:\n${list}\n\nRead more in the News module!`;
      }
    } else if (match.intent === 'funding') {
      const { data } = await supabase.from('funding_opportunities').select('title, category, status').eq('status', 'Open').limit(6);
      if (data && data.length > 0) {
        const items = uniq(data, 'title').slice(0, 3);
        const list = items.map(f => `• ${f.title}${f.category ? ' [' + f.category + ']' : ''}`).join('\n');
        reply = `${match.reply}\n\n💰 Currently open:\n${list}\n\nView eligibility details in the Funding module!`;
      }
    } else if (match.intent === 'partnerships') {
      const { data } = await supabase.from('partnerships').select('partner_name, type, status').order('id', { ascending: true }).limit(6);
      if (data && data.length > 0) {
        const items = uniq(data, 'partner_name');
        const list = items.map(p => `• ${p.partner_name} [${p.type}] — ${p.status}`).join('\n');
        reply = `${match.reply}\n\n🤝 Current partnerships:\n${list}\n\nView full details in the Partnerships module.`;
      }
    } else if (match.intent === 'member_institutions') {
      const { data } = await supabase.from('members').select('abbr, full_name').limit(12);
      if (data && data.length > 0) {
        const items = uniq(data, 'full_name');
        const list = items.map(m => `• ${m.abbr ? m.abbr + ' — ' : ''}${m.full_name}`).join('\n');
        reply = `The DASIG Consortium currently includes these Region VII member institutions:\n\n${list}\n\nView full profiles in the Members module.`;
      }
    }
  } catch (_) {}

  return res.json({
    reply,
    matched: true,
    intent: match.intent,
    score: match.score,
    followups: FOLLOWUPS[match.intent] || DEFAULT_FOLLOWUPS,
  });
});

// GET /api/chatbot/intents — list all known intents (for frontend autocomplete)
router.get('/intents', (req, res) => {
  res.json(KB.map(k => ({ intent: k.intent, sample: k.keywords[0] })));
});

module.exports = router;
