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
    keywords: ['register event', 'event registration', 'sign up event', 'join event', 'attend event', 'how to register'],
    reply: 'To register for an event: go to the Events module, click on the event you want to join, and click "Register." You must be logged in. Events have limited capacity — register early!',
  },
  {
    intent: 'training',
    keywords: ['training', 'course', 'program', 'enroll', 'learning', 'bootcamp', 'certification', 'upskill', 'webinar'],
    reply: 'DASIG offers training programs in Technology, Research, Leadership, and Governance. Browse programs in the Training module, filter by category or level, and enroll with one click.',
  },
  {
    intent: 'membership',
    keywords: ['membership', 'become member', 'apply member', 'join dasig', 'membership application', 'how to join', 'member benefits'],
    reply: 'To become a DASIG member: log in, go to Membership, and click "Apply for Membership." Fill in your institution details, select a tier, and submit. Applications are reviewed and approved by the DASIG administrator.',
  },
  {
    intent: 'membership_status',
    keywords: ['membership status', 'my membership', 'check membership', 'am i a member', 'membership tier', 'renewal'],
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
    keywords: ['policy', 'guidelines', 'rules', 'regulation', 'document', 'policy document', 'bylaws', 'charter'],
    reply: 'DASIG policies and guidelines are available in the Policies module. Active members can access all policy documents. Some documents are members-only. Archived policies are accessible to ADMIN users.',
  },
  {
    intent: 'funding',
    keywords: ['funding', 'scholarship', 'grant', 'financial', 'dost scholarship', 'fund', 'budget', 'research grant', 'funding opportunity'],
    reply: 'Funding opportunities — including DOST scholarships, research grants, and government programs — are listed in the Funding module. Filter by category or status (Open/Closed) and check eligibility requirements.',
  },
  {
    intent: 'partnerships',
    keywords: ['partnership', 'partner', 'collaboration', 'mou', 'moa', 'strategic partner', 'bilateral', 'agreement'],
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
    keywords: ['it332', 'capstone', 'team 40', 'cit-u', 'cebu institute', 'school project'],
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
    keywords: ['members only news', 'locked article', 'restricted news', 'cannot read news', 'upgrade access'],
    reply: 'Some news articles are marked "Members Only" and require an active DASIG membership to read. If you see a locked article, apply for membership through the Membership module. Guest users can access all public announcements.',
  },
  {
    intent: 'booking_confirmation',
    keywords: ['booking confirmation', 'confirmation email', 'registered successfully', 'proof of registration', 'event confirmation'],
    reply: 'After successfully registering for an event, your registration is saved in the system. You can confirm your registration by checking "My Registrations" in your Profile page. A confirmation record with the event name and date is stored there.',
  },
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
  const match = matchIntent(trimmed);

  // Log to DB for accuracy tracking (fire-and-forget)
  supabase.from('chatbot_logs').insert({
    message: trimmed,
    matched: !!match,
    intent: match ? match.intent : null,
  }).then(() => {}).catch(() => {});

  if (match) {
    return res.json({ reply: match.reply, matched: true, intent: match.intent, score: match.score });
  }

  res.json({
    reply: `I couldn't find a specific answer for that in my DASIG knowledge base. I can help with:\n• 📅 Events & registration\n• 🎓 Training & enrollment\n• 👥 Membership & tiers\n• 📋 Policies & guidelines\n• 💰 Funding & scholarships\n• 🤝 Partnerships\n\nTry rephrasing, or email admin@dasig.ph for direct support.`,
    matched: false,
    intent: null,
    score: 0,
  });
});

// GET /api/chatbot/intents — list all known intents (for frontend autocomplete)
router.get('/intents', (req, res) => {
  res.json(KB.map(k => ({ intent: k.intent, sample: k.keywords[0] })));
});

module.exports = router;
