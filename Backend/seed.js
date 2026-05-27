require('dotenv').config();
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { persistSession: false } }
);

async function seed() {
  console.log('== DASIG Portal Seed Script ==\n');

  // USERS
  console.log('Seeding users...');
  const users = [
    { name: 'DASIG Admin', email: 'admin@dasig.ph',    password: 'Admin@2026',  role: 'ADMIN',  status: 'ACTIVE', institution: 'DASIG Consortium',             campus: 'Region VII',             tier: 'Full Member — Tier 1', member_since: '2021-06-01', renewal_due: '2026-12-31' },
    { name: 'UP Member',   email: 'member@up.edu.ph',  password: 'Member@2026', role: 'MEMBER', status: 'ACTIVE', institution: 'University of the Philippines', campus: 'UP Visayas, Iloilo City', tier: 'Full Member — Tier 1', member_since: '2021-06-01', renewal_due: '2026-12-31' },
    { name: 'Guest User',  email: 'guest@dasig.ph',    password: 'Guest@2026',  role: 'GUEST',  status: 'GUEST',  institution: null, campus: null, tier: null,   member_since: null, renewal_due: null },
  ];
  for (const u of users) {
    const { data: ex } = await supabase.from('users').select('id').eq('email', u.email).single();
    if (ex) { console.log(`  SKIP  ${u.email}`); continue; }
    const password_hash = await bcrypt.hash(u.password, 12);
    const { error } = await supabase.from('users').insert({ name: u.name, email: u.email, password_hash, role: u.role, status: u.status, institution: u.institution, campus: u.campus, tier: u.tier, member_since: u.member_since, renewal_due: u.renewal_due });
    console.log(error ? `  ERROR ${u.email}: ${error.message}` : `  OK    ${u.email} (${u.role})`);
  }

  // EVENTS
  console.log('\nSeeding events...');
  const { count: evCount } = await supabase.from('events').select('*', { count: 'exact', head: true });
  if (evCount > 0) {
    console.log(`  SKIP  (${evCount} events already exist)`);
  } else {
    const events = [
      { title: 'DASIG Annual Summit 2026',             date: 'Jun 18-20, 2026', venue: 'Cebu City Convention Center', organizer: 'DASIG Consortium', category: 'Summit',   enrolled: 134, total: 180, description: 'The annual summit gathers all six Region VII consortium institutions for a three-day innovation forum.' },
      { title: 'Advanced Data Analytics Workshop',     date: 'Jun 5, 2026',     venue: 'Online Zoom',                 organizer: 'DICT VII',         category: 'Workshop', enrolled: 38,  total: 40,  description: 'Hands-on training in data analytics tools and techniques for public sector professionals.' },
      { title: 'Governance & Innovation in ASEAN',     date: 'May 30, 2026',    venue: 'University of San Agustin',   organizer: 'USan Agustin',     category: 'Seminar',  enrolled: 22,  total: 60,  description: 'Regional seminar on governance innovation and ASEAN best practices.' },
      { title: 'DOST SEI Scholarship Information Day', date: 'May 27, 2026',    venue: 'UP Visayas',                  organizer: 'DOST Region VII',  category: 'Funding',  enrolled: 67,  total: 100, description: 'Information session on DOST SEI scholarship programs for DASIG member institution nominees.' },
    ];
    const { error } = await supabase.from('events').insert(events);
    console.log(error ? `  ERROR: ${error.message}` : `  OK    (${events.length} events inserted)`);
  }

  // NEWS
  console.log('\nSeeding news...');
  const { count: newsCount } = await supabase.from('news').select('*', { count: 'exact', head: true });
  if (newsCount > 0) {
    console.log(`  SKIP  (${newsCount} articles already exist)`);
  } else {
    const news = [
      { icon: '📣', badge: 'Announcement', date: '2026-05-20', title: 'DASIG Annual Summit 2026 Registration Now Open',         excerpt: 'The annual summit gathers all six Region VII consortium institutions for a three-day innovation forum, research showcase, and networking event in Cebu City.', members_only: false },
      { icon: '📋', badge: 'Policy',       date: '2026-05-14', title: 'Updated Membership Renewal Guidelines for AY 2026-2027', excerpt: 'Revised criteria now available for institutional review and submission.',                                                                                  members_only: true  },
      { icon: '💰', badge: 'Funding',      date: '2026-05-08', title: 'DOST Region VII Scholarship Window Now Open',            excerpt: 'Apply via the Funding portal before June 15. Priority given to DASIG member institution nominees.',                                                       members_only: false },
      { icon: '🎓', badge: 'Training',     date: '2026-04-30', title: 'New Training Programs Available for Q3 2026',            excerpt: 'DICT VII and DTI VII co-facilitated programs on digital governance and strategic leadership are now open.',                                                members_only: false },
    ];
    const { error } = await supabase.from('news').insert(news);
    console.log(error ? `  ERROR: ${error.message}` : `  OK    (${news.length} articles inserted)`);
  }

  // TRAININGS
  console.log('\nSeeding trainings...');
  const { count: trCount } = await supabase.from('trainings').select('*', { count: 'exact', head: true });
  if (trCount > 0) {
    console.log(`  SKIP  (${trCount} trainings already exist)`);
  } else {
    const trainings = [
      { icon: '💻', category: 'Technology', title: 'Full-Stack Web Dev Bootcamp',            org: 'DICT VII',  duration: '6 weeks', level: 'Intermediate', enrolled: 28, total: 30 },
      { icon: '🔬', category: 'Research',   title: 'Research Methods for STEM Educators',    org: 'DOST VII',  duration: '3 weeks', level: 'Beginner',     enrolled: 18, total: 25 },
      { icon: '🏛', category: 'Leadership', title: 'Strategic Leadership in Public Service', org: 'DTI VII',   duration: '2 weeks', level: 'Advanced',     enrolled: 12, total: 20 },
      { icon: '📱', category: 'Governance', title: 'Digital Governance & Policy',            org: 'DepEd VII', duration: '4 weeks', level: 'Intermediate', enrolled: 9,  total: 15 },
    ];
    const { error } = await supabase.from('trainings').insert(trainings);
    console.log(error ? `  ERROR: ${error.message}` : `  OK    (${trainings.length} programs inserted)`);
  }

  // MEMBERS
  console.log('\nSeeding consortium members...');
  const { count: memCount } = await supabase.from('members').select('*', { count: 'exact', head: true });
  if (memCount > 0) {
    console.log(`  SKIP  (${memCount} members already exist)`);
  } else {
    const members = [
      { abbr: 'UP',    full_name: 'University of the Philippines',                         campus: 'UP Visayas',  type: 'State University'    },
      { abbr: 'USa',   full_name: 'University of San Agustin',                             campus: 'Iloilo City', type: 'Private University'  },
      { abbr: 'DOST',  full_name: 'Department of Science & Technology',                    campus: 'Region VII',  type: 'Government Agency'   },
      { abbr: 'DICT',  full_name: 'Department of Information & Communications Technology', campus: 'Region VII',  type: 'Government Agency'   },
      { abbr: 'DTI',   full_name: 'Department of Trade & Industry',                        campus: 'Region VII',  type: 'Government Agency'   },
      { abbr: 'DepEd', full_name: 'Department of Education',                               campus: 'Region VII',  type: 'Government Agency'   },
    ];
    const { error } = await supabase.from('members').insert(members);
    console.log(error ? `  ERROR: ${error.message}` : `  OK    (${members.length} institutions inserted)`);
  }

  // FINAL COUNT
  console.log('\n== Table counts ==');
  for (const t of ['users','events','news','trainings','members','membership_applications']) {
    const { count } = await supabase.from(t).select('*', { count: 'exact', head: true });
    console.log(`  ${t.padEnd(28)}: ${count}`);
  }
  console.log('\nSeed complete.');
}

seed().catch(console.error);
