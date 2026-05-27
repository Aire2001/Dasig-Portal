const bcrypt = require('bcryptjs');

const HASH_ADMIN  = bcrypt.hashSync('Admin@2026',  12);
const HASH_MEMBER = bcrypt.hashSync('Member@2026', 12);
const HASH_GUEST  = bcrypt.hashSync('Guest@2026',  12);

const users = [
  {
    id: 1,
    name: 'DASIG Admin',
    email: 'admin@dasig.ph',
    password: HASH_ADMIN,
    role: 'ADMIN',
    institution: 'DASIG Consortium',
    campus: 'Region VII',
    memberSince: '2021-06-01',
    renewalDue: '2026-12-31',
    tier: 'Full Member — Tier 1',
    status: 'ACTIVE',
  },
  {
    id: 2,
    name: 'UP Member',
    email: 'member@up.edu.ph',
    password: HASH_MEMBER,
    role: 'MEMBER',
    institution: 'University of the Philippines',
    campus: 'UP Visayas, Iloilo City',
    memberSince: '2021-06-01',
    renewalDue: '2026-12-31',
    tier: 'Full Member — Tier 1',
    status: 'ACTIVE',
  },
  {
    id: 3,
    name: 'Guest User',
    email: 'guest@dasig.ph',
    password: HASH_GUEST,
    role: 'GUEST',
    institution: null,
    campus: null,
    memberSince: null,
    renewalDue: null,
    tier: null,
    status: 'GUEST',
  },
];

const events = [
  {
    id: 1,
    title: 'DASIG Annual Summit 2026',
    date: 'Jun 18–20, 2026',
    venue: 'Cebu City Convention Center',
    organizer: 'DASIG Consortium',
    category: 'Summit',
    enrolled: 23,
    total: 180,
    description: 'The annual summit gathers all six Region VII consortium institutions for a three-day innovation forum, research showcase, and networking event in Cebu City.',
    registrations: [],
  },
  {
    id: 2,
    title: 'Advanced Data Analytics Workshop',
    date: 'Jun 5, 2026',
    venue: 'Online Zoom',
    organizer: 'DICT VII',
    category: 'Workshop',
    enrolled: 17,
    total: 40,
    description: 'Hands-on training in data analytics tools and techniques for public sector professionals.',
    registrations: [],
  },
  {
    id: 3,
    title: 'Governance & Innovation in ASEAN',
    date: 'May 30, 2026',
    venue: 'University of San Agustin',
    organizer: 'USan Agustin',
    category: 'Seminar',
    enrolled: 9,
    total: 60,
    description: 'Regional seminar on governance innovation and ASEAN best practices.',
    registrations: [],
  },
  {
    id: 4,
    title: 'DOST SEI Scholarship Information Day',
    date: 'May 27, 2026',
    venue: 'UP Visayas',
    organizer: 'DOST Region VII',
    category: 'Funding',
    enrolled: 31,
    total: 100,
    description: 'Information session on DOST SEI scholarship programs for DASIG member institution nominees.',
    registrations: [],
  },
];

const news = [
  {
    id: 1,
    icon: '📣',
    badge: 'Announcement',
    date: '2026-05-20',
    title: 'DASIG Annual Summit 2026 Registration Now Open',
    excerpt: 'The annual summit gathers all six Region VII consortium institutions for a three-day innovation forum, research showcase, and networking event in Cebu City.',
    membersOnly: false,
  },
  {
    id: 2,
    icon: '📋',
    badge: 'Policy',
    date: '2026-05-14',
    title: 'Updated Membership Renewal Guidelines for AY 2026–2027',
    excerpt: 'Revised criteria now available for institutional review and submission.',
    membersOnly: true,
  },
  {
    id: 3,
    icon: '💰',
    badge: 'Funding',
    date: '2026-05-08',
    title: 'DOST Region VII Scholarship Window Now Open',
    excerpt: 'Apply via the Funding portal before June 15. Priority given to DASIG member institution nominees.',
    membersOnly: false,
  },
  {
    id: 4,
    icon: '🎓',
    badge: 'Training',
    date: '2026-04-30',
    title: 'New Training Programs Available for Q3 2026',
    excerpt: 'DICT VII and DTI VII co-facilitated programs on digital governance and strategic leadership are now open.',
    membersOnly: false,
  },
];

const trainings = [
  {
    id: 1,
    icon: '💻',
    category: 'Technology',
    title: 'Full-Stack Web Dev Bootcamp',
    org: 'DICT VII',
    duration: '6 weeks',
    level: 'Intermediate',
    enrolled: 28,
    total: 30,
    enrollments: [],
  },
  {
    id: 2,
    icon: '🔬',
    category: 'Research',
    title: 'Research Methods for STEM Educators',
    org: 'DOST VII',
    duration: '3 weeks',
    level: 'Beginner',
    enrolled: 18,
    total: 25,
    enrollments: [],
  },
  {
    id: 3,
    icon: '🏛',
    category: 'Leadership',
    title: 'Strategic Leadership in Public Service',
    org: 'DTI VII',
    duration: '2 weeks',
    level: 'Advanced',
    enrolled: 12,
    total: 20,
    enrollments: [],
  },
  {
    id: 4,
    icon: '📱',
    category: 'Governance',
    title: 'Digital Governance & Policy',
    org: 'DepEd VII',
    duration: '4 weeks',
    level: 'Intermediate',
    enrolled: 9,
    total: 15,
    enrollments: [],
  },
];

const members = [
  { id: 1, abbr: 'UP',    full: 'University of the Philippines',                    campus: 'UP Visayas',  type: 'State University'   },
  { id: 2, abbr: 'USa',   full: 'University of San Agustin',                        campus: 'Iloilo City', type: 'Private University' },
  { id: 3, abbr: 'DOST',  full: 'Department of Science & Technology',               campus: 'Region VII',  type: 'Government Agency'  },
  { id: 4, abbr: 'DICT',  full: 'Department of Information & Communications Technology', campus: 'Region VII', type: 'Government Agency' },
  { id: 5, abbr: 'DTI',   full: 'Department of Trade & Industry',                   campus: 'Region VII',  type: 'Government Agency'  },
  { id: 6, abbr: 'DepEd', full: 'Department of Education',                          campus: 'Region VII',  type: 'Government Agency'  },
];

const membershipApplications = [];

const chatbotKB = [
  { keywords: ['event','events','summit','workshop','seminar'], reply: 'You can view all upcoming DASIG events on the Events page! Current highlights include the DASIG Annual Summit 2026 (Jun 18–20, Cebu City) and the Advanced Data Analytics Workshop (Jun 5, Online).' },
  { keywords: ['membership','member','apply','join','register','tier'], reply: 'DASIG offers Tier-based institutional membership. To apply, click "Register free" in the top navigation and fill in your institutional details. Approval is processed within 3 business days.' },
  { keywords: ['funding','scholarship','grant','dost','sei'], reply: 'The DOST Region VII Scholarship window is now open — apply before June 15. Visit the Events page for the Information Day details, or contact your institutional admin for nomination.' },
  { keywords: ['training','enroll','bootcamp','course','program'], reply: 'DASIG offers training programs in Technology, Research, Leadership, and Governance. Visit the Training page to view all programs and enroll. Current openings include the Full-Stack Web Dev Bootcamp (DICT VII).' },
  { keywords: ['news','announcement','policy','update'], reply: 'Check the News page for the latest consortium announcements. Members get exclusive access to the Updated Membership Renewal Guidelines for AY 2026–2027.' },
  { keywords: ['login','log in','sign in','password','account'], reply: 'Click "Log in" in the top navigation. Use your registered email and password. Contact your institutional admin if you have trouble accessing your account.' },
  { keywords: ['haribon','ai','chatbot','assistant'], reply: "I'm Haribon 🦅, the DASIG AI Assistant powered by NLP. I can answer questions about events, funding, membership, training, and consortium news. What would you like to know?" },
  { keywords: ['region','visayas','cebu','iloilo'], reply: 'DASIG serves Central Visayas (Region VII) — connecting UP Visayas, University of San Agustin, DOST VII, DICT VII, DTI VII, and DepEd VII under one unified platform.' },
  { keywords: ['contact','admin','support','help'], reply: 'For support, contact your institutional administrator or email the DASIG Consortium office. You can also reach out via the Members page for institution-specific contacts.' },
  { keywords: ['partner','partnership','collaboration'], reply: 'DASIG maintains strategic partnerships with academic institutions, government agencies, and industry partners. The Partnerships module is available to Tier 1 members.' },
];

module.exports = { users, events, news, trainings, members, membershipApplications, chatbotKB };
