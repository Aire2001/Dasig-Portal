-- ============================================================
-- DASIG Portal — Supabase Migration (Full Schema)
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- ============================================================
-- TABLE DEFINITIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id                  BIGSERIAL PRIMARY KEY,
  name                TEXT NOT NULL,
  email               TEXT NOT NULL UNIQUE,
  password_hash       TEXT NOT NULL,
  role                TEXT NOT NULL DEFAULT 'GUEST'
                        CHECK (role IN ('ADMIN', 'MEMBER', 'GUEST')),
  status              TEXT NOT NULL DEFAULT 'GUEST'
                        CHECK (status IN ('ACTIVE', 'GUEST', 'INACTIVE')),
  institution         TEXT,
  campus              TEXT,
  tier                TEXT,
  member_since        DATE,
  renewal_due         DATE,
  reset_token         TEXT,
  reset_token_expires TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS events (
  id                    BIGSERIAL PRIMARY KEY,
  title                 TEXT    NOT NULL,
  date                  TEXT    NOT NULL,
  venue                 TEXT    NOT NULL,
  organizer             TEXT    NOT NULL,
  category              TEXT    NOT NULL,
  enrolled              INTEGER NOT NULL DEFAULT 0,
  total                 INTEGER NOT NULL DEFAULT 0,
  description           TEXT,
  registration_deadline DATE
);

-- Add column to existing deployments (safe to run multiple times)
ALTER TABLE events ADD COLUMN IF NOT EXISTS registration_deadline DATE;

CREATE TABLE IF NOT EXISTS event_registrations (
  id         BIGSERIAL PRIMARY KEY,
  event_id   BIGINT  NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id    BIGINT  NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
  attended   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (event_id, user_id)
);

CREATE TABLE IF NOT EXISTS news (
  id           BIGSERIAL PRIMARY KEY,
  icon         TEXT,
  badge        TEXT,
  date         DATE    NOT NULL,
  title        TEXT    NOT NULL,
  excerpt      TEXT,
  content      TEXT,
  members_only BOOLEAN NOT NULL DEFAULT FALSE,
  archived     BOOLEAN NOT NULL DEFAULT FALSE
);

ALTER TABLE news ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS trainings (
  id          BIGSERIAL PRIMARY KEY,
  icon        TEXT,
  category    TEXT    NOT NULL,
  title       TEXT    NOT NULL,
  org         TEXT    NOT NULL,
  duration    TEXT    NOT NULL,
  level       TEXT    NOT NULL,
  enrolled    INTEGER NOT NULL DEFAULT 0,
  total       INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  schedule    TEXT
);

ALTER TABLE trainings ADD COLUMN IF NOT EXISTS schedule TEXT;

CREATE TABLE IF NOT EXISTS training_enrollments (
  id          BIGSERIAL PRIMARY KEY,
  training_id BIGINT NOT NULL REFERENCES trainings(id) ON DELETE CASCADE,
  user_id     BIGINT NOT NULL REFERENCES users(id)     ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (training_id, user_id)
);

-- Consortium member institutions (reference data)
CREATE TABLE IF NOT EXISTS members (
  id        BIGSERIAL PRIMARY KEY,
  abbr      TEXT NOT NULL,
  full_name TEXT NOT NULL,
  campus    TEXT NOT NULL,
  type      TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS membership_applications (
  id          BIGSERIAL PRIMARY KEY,
  user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT   NOT NULL,
  email       TEXT   NOT NULL,
  institution TEXT   NOT NULL,
  campus      TEXT,
  tier        TEXT,
  status      TEXT   NOT NULL DEFAULT 'PENDING'
                CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  applied_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Policy documents (UC-PM)
CREATE TABLE IF NOT EXISTS policies (
  id             BIGSERIAL PRIMARY KEY,
  title          TEXT    NOT NULL,
  category       TEXT    NOT NULL,
  content        TEXT    NOT NULL,
  effective_date DATE    NOT NULL,
  members_only   BOOLEAN NOT NULL DEFAULT FALSE,
  archived       BOOLEAN NOT NULL DEFAULT FALSE,
  created_by     BIGINT  REFERENCES users(id),
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ
);

-- Funding opportunities (UC-FM)
CREATE TABLE IF NOT EXISTS funding_opportunities (
  id          BIGSERIAL PRIMARY KEY,
  title       TEXT NOT NULL,
  category    TEXT NOT NULL,
  provider    TEXT NOT NULL,
  amount      TEXT,
  deadline    DATE NOT NULL,
  description TEXT,
  eligibility TEXT,
  status      TEXT NOT NULL DEFAULT 'Open'
                CHECK (status IN ('Open', 'Closed', 'Upcoming')),
  created_by  BIGINT REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ
);

-- Strategic partnerships (UC-SP)
CREATE TABLE IF NOT EXISTS partnerships (
  id             BIGSERIAL PRIMARY KEY,
  partner_name   TEXT NOT NULL,
  type           TEXT NOT NULL,
  description    TEXT,
  start_date     DATE NOT NULL,
  end_date       DATE,
  contact_person TEXT,
  contact_email  TEXT,
  status         TEXT NOT NULL DEFAULT 'Active'
                   CHECK (status IN ('Active', 'Expired', 'Pending')),
  created_by     BIGINT REFERENCES users(id),
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ
);

-- Chatbot conversation logs (for accuracy metrics, UC-CB-03)
CREATE TABLE IF NOT EXISTS chatbot_logs (
  id         BIGSERIAL PRIMARY KEY,
  message    TEXT    NOT NULL,
  matched    BOOLEAN NOT NULL DEFAULT FALSE,
  intent     TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- ROW LEVEL SECURITY — disabled; backend uses service_role key
-- ============================================================

ALTER TABLE users                   DISABLE ROW LEVEL SECURITY;
ALTER TABLE events                  DISABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations     DISABLE ROW LEVEL SECURITY;
ALTER TABLE news                    DISABLE ROW LEVEL SECURITY;
ALTER TABLE trainings               DISABLE ROW LEVEL SECURITY;
ALTER TABLE training_enrollments    DISABLE ROW LEVEL SECURITY;
ALTER TABLE members                 DISABLE ROW LEVEL SECURITY;
ALTER TABLE membership_applications DISABLE ROW LEVEL SECURITY;
ALTER TABLE policies                DISABLE ROW LEVEL SECURITY;
ALTER TABLE funding_opportunities   DISABLE ROW LEVEL SECURITY;
ALTER TABLE partnerships            DISABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_logs            DISABLE ROW LEVEL SECURITY;


-- ============================================================
-- SEED DATA
-- ============================================================

-- Demo users (passwords: Admin@2026 / Member@2026 / Guest@2026)
INSERT INTO users (name, email, password_hash, role, status, institution, campus, tier, member_since, renewal_due)
VALUES
  (
    'DASIG Admin',
    'admin@dasig.ph',
    crypt('Admin@2026', gen_salt('bf', 12)),
    'ADMIN', 'ACTIVE',
    'DASIG Consortium', 'Region VII',
    'Full Member — Tier 1',
    '2021-06-01', '2026-12-31'
  ),
  (
    'UP Member',
    'member@up.edu.ph',
    crypt('Member@2026', gen_salt('bf', 12)),
    'MEMBER', 'ACTIVE',
    'University of the Philippines', 'UP Visayas, Iloilo City',
    'Full Member — Tier 1',
    '2021-06-01', '2026-12-31'
  ),
  (
    'Guest User',
    'guest@dasig.ph',
    crypt('Guest@2026', gen_salt('bf', 12)),
    'GUEST', 'GUEST',
    NULL, NULL, NULL, NULL, NULL
  )
ON CONFLICT (email) DO NOTHING;


-- Events
INSERT INTO events (title, date, venue, organizer, category, enrolled, total, description)
VALUES
  (
    'DASIG Annual Summit 2026',
    'Jun 18–20, 2026',
    'Cebu City Convention Center',
    'DASIG Consortium', 'Summit', 134, 180,
    'The annual summit gathers all six Region VII consortium institutions for a three-day innovation forum, research showcase, and networking event in Cebu City.'
  ),
  (
    'Advanced Data Analytics Workshop',
    'Jun 5, 2026',
    'Online Zoom',
    'DICT VII', 'Workshop', 38, 40,
    'Hands-on training in data analytics tools and techniques for public sector professionals.'
  ),
  (
    'Governance & Innovation in ASEAN',
    'May 30, 2026',
    'University of San Agustin',
    'USan Agustin', 'Seminar', 22, 60,
    'Regional seminar on governance innovation and ASEAN best practices.'
  ),
  (
    'DOST SEI Scholarship Information Day',
    'May 27, 2026',
    'UP Visayas',
    'DOST Region VII', 'Funding', 67, 100,
    'Information session on DOST SEI scholarship programs for DASIG member institution nominees.'
  )
ON CONFLICT DO NOTHING;


-- News articles (DELETE + fresh INSERT so content is always current)
DELETE FROM news;

INSERT INTO news (icon, badge, date, title, excerpt, content, members_only)
VALUES
  (
    '📣', 'Announcement', '2026-05-20',
    'DASIG Annual Summit 2026 Registration Now Open',
    'All six Region VII consortium institutions are invited to the three-day innovation forum, research showcase, and networking event this June 18–20 in Cebu City.',
    'The DASIG Consortium is pleased to announce that registration for the DASIG Annual Summit 2026 is now officially open. The event will be held on June 18–20, 2026 at the Cebu City Convention Center.

This flagship event brings together all member institutions of the Data Analytics and Systems Integration Group (DASIG) in Region VII for three days of knowledge sharing, research presentations, and strategic planning.

Highlights of the Summit include:
- Opening Ceremony and Keynote Address by CHED Region VII Director
- Research Paper Presentations from member institutions
- Workshop: AI and Data Governance in Philippine Higher Education
- DASIG Consortium General Assembly and Election of Officers
- Networking Gala and Recognition of Outstanding Members

All member institutions are strongly encouraged to send at least two representatives. DASIG Portal members may register directly through the Events module. Slots are limited to 180 participants.

For inquiries, contact the DASIG Secretariat at secretariat@dasig.ph.',
    FALSE
  ),
  (
    '📣', 'Announcement', '2026-05-18',
    'DASIG Portal Officially Launched for All Member Institutions',
    'The DASIG Consortium proudly launches its unified digital portal for events, training, news, funding, and member services across all six Region VII member universities.',
    'The Data Analytics and Systems Integration Group (DASIG) Region VII Consortium is proud to officially launch the DASIG Portal — a centralized digital platform designed to serve all member institutions and their communities.

The DASIG Portal provides the following services:
- Events & Activities — browse and register for consortium-organized events
- News & Announcements — stay updated on DASIG consortium news
- Training Programs — enroll in professional development courses
- Members Directory — connect with faculty and researchers across institutions
- Funding Opportunities — discover scholarship, grant, and funding programs
- Strategic Partnerships — explore collaboration opportunities
- Policies & Guidelines — access governance documents

The portal was developed by Team 40 of CIT-University under the IT332 Capstone Project course. The system uses a React.js frontend, Node.js/Express backend, and Supabase PostgreSQL database.

Member institutions of DASIG Region VII include the University of the Philippines Visayas, Cebu Institute of Technology – University, University of San Agustin, University of San Carlos, Southwestern University PHINMA, and Xavier University – Ateneo de Cagayan.

Log in or register now to access all portal features.',
    FALSE
  ),
  (
    '🔬', 'Research', '2026-05-15',
    'DASIG Launches Joint Research Initiative on AI in Public Governance',
    'Six consortium institutions will collaborate on a two-year research project studying artificial intelligence applications in Philippine local government units.',
    'The DASIG Consortium has approved a joint research initiative titled "Artificial Intelligence Applications in Philippine Local Government: A Region VII Perspective." The two-year research project will involve faculty researchers from all six member institutions.

The research aims to:
1. Map existing AI and data analytics use cases in LGUs across Region VII
2. Identify barriers to AI adoption in Philippine public governance
3. Develop a policy recommendation framework for responsible AI deployment
4. Produce peer-reviewed publications in indexed journals

Principal investigators will be assigned from each member institution. DOST Region VII has expressed interest in co-funding the initiative under its R&D grants program.

Research teams interested in participating may submit their Letter of Intent through the DASIG Partnerships module. The Call for Research Collaborators is open until June 30, 2026.

This initiative aligns with the DASIG Consortium Strategic Plan 2024–2028 which prioritizes translational research with direct community impact.',
    TRUE
  ),
  (
    '📋', 'Policy', '2026-05-14',
    'Updated Membership Renewal Guidelines for AY 2026–2027',
    'The DASIG Secretariat has released revised renewal criteria with new compliance requirements and a streamlined application process through the DASIG Portal.',
    'The DASIG Secretariat has released the updated Membership Renewal Guidelines for Academic Year 2026–2027. All member institutions are required to complete the renewal process by August 31, 2026 to maintain active membership status.

Key changes in the updated guidelines:

Tier 1 Membership (Full Voting Rights):
- Minimum of 3 active faculty researchers enrolled in DASIG programs
- At least one institutional representative at the Annual Summit
- Submission of Annual Institutional Report
- Payment of annual membership fee of PHP 15,000

Tier 2 Membership (Associate Status):
- Minimum of 1 active representative
- Participation in at least two consortium activities per year
- Annual membership fee of PHP 8,000

New Requirements for AY 2026–2027:
- All member institutions must designate a DASIG Portal Administrator
- Institutions must submit a Digital Readiness Self-Assessment Report
- Compliance with the DASIG Data Privacy Policy is mandatory

Institutions that fail to renew by the deadline will be placed on probationary status. The renewal form is available through the DASIG Portal Membership module.

For concerns, email membership@dasig.ph or contact the Secretariat during business hours.',
    TRUE
  ),
  (
    '💰', 'Funding', '2026-05-08',
    'DOST Region VII Scholarship Window Now Open for DASIG Nominees',
    'DASIG member institutions receive priority nomination slots for the DOST SEI scholarship program. Apply through the Funding portal before June 15.',
    'The Department of Science and Technology (DOST) – Science Education Institute (SEI) Region VII has opened its scholarship application window for Academic Year 2026–2027. DASIG consortium member institutions have been allocated priority nomination slots.

Available Scholarships:

1. DOST-SEI Merit Scholarship (Undergraduate)
- For students enrolled in STEM courses at DASIG member institutions
- Monthly stipend: PHP 7,000
- Book allowance, tuition assistance, and graduation incentive

2. DOST-ERDT Graduate Scholarship
- For faculty members pursuing Master''s or Ph.D. in engineering and technology fields
- Full tuition coverage + monthly stipend of PHP 14,000

3. DOST-PCIEERD Research Grant
- For faculty-led research projects in ICT, data science, and digital systems
- Grant amount: up to PHP 2,000,000

How to Apply:
1. Log in to the DASIG Portal and navigate to Funding Opportunities
2. Download the nomination form
3. Submit completed forms to your institution''s DASIG Coordinator
4. Institutional endorsement deadline: June 10, 2026
5. DOST submission deadline: June 15, 2026

Priority is given to nominees from DASIG Tier 1 member institutions. For inquiries contact your institution''s DASIG Coordinator or email funding@dasig.ph.',
    FALSE
  ),
  (
    '🎓', 'Training', '2026-04-30',
    'Q3 2026 Training Programs Now Open for Enrollment',
    'DICT VII and DTI VII co-facilitated programs on digital governance, data analytics, and strategic leadership are available to all DASIG members and affiliates.',
    'The DASIG Training Committee is pleased to announce the Q3 2026 lineup of professional development programs. All programs are available to DASIG members and their institutional affiliates.

Featured Programs:

1. Full-Stack Web Development Bootcamp (DICT VII)
Duration: 6 weeks | Level: Intermediate
Covers: React.js, Node.js, PostgreSQL, REST APIs, and deployment
Schedule: July 7 – August 15, 2026 | Online

2. Research Methods for STEM Educators (DOST VII)
Duration: 3 weeks | Level: Beginner
Covers: Quantitative and qualitative research design, statistical analysis, publication writing
Schedule: July 14 – August 1, 2026 | Hybrid

3. Strategic Leadership in Public Service (DTI VII)
Duration: 2 weeks | Level: Advanced
Covers: Governance frameworks, policy development, organizational leadership
Schedule: August 3–16, 2026 | Cebu City

4. Digital Governance and Policy (DepEd VII)
Duration: 4 weeks | Level: Intermediate
Covers: Data privacy law, e-governance, digital transformation roadmaps
Schedule: July 21 – August 14, 2026 | Online

Enrollment is now open through the DASIG Portal Training module. Slots are limited. Certificate of completion will be issued by the organizing agency. Members receive a 20% discount on registration fees.',
    FALSE
  ),
  (
    '📣', 'Announcement', '2026-04-22',
    'DASIG Consortium Welcomes Xavier University as Newest Member',
    'Xavier University – Ateneo de Cagayan has officially joined the DASIG Region VII Consortium, bringing the total number of member institutions to six.',
    'The Data Analytics and Systems Integration Group (DASIG) Region VII Consortium is pleased to announce that Xavier University – Ateneo de Cagayan has officially been admitted as the sixth member institution of the consortium.

The formal signing of the Memorandum of Agreement was held on April 20, 2026 at the DASIG Secretariat office in Cebu City. Xavier University President Dr. Jose Ramon Villarin, SJ signed on behalf of the institution, while DASIG Chairperson Dr. Maria Santos signed on behalf of the consortium.

Xavier University brings significant strengths to the consortium including:
- A Center for Sustainability and Social Innovation
- Active research programs in agri-data analytics and rural ICT
- Strong community extension partnerships in Mindanao Region
- A graduate school focused on technology management

Current DASIG Member Institutions:
1. University of the Philippines Visayas
2. Cebu Institute of Technology – University
3. University of San Agustin
4. University of San Carlos
5. Southwestern University PHINMA
6. Xavier University – Ateneo de Cagayan (NEW)

Xavier University faculty and students can now access the DASIG Portal and all consortium programs. Welcome to the DASIG family, Xavier University!',
    FALSE
  ),
  (
    '🔬', 'Research', '2026-04-10',
    'DASIG Research Team Presents Paper at International Conference in Singapore',
    'A collaborative research paper by CIT-U and UP Visayas faculty was presented at the 2026 IEEE International Conference on Data Science and Advanced Analytics.',
    'A joint research team from Cebu Institute of Technology – University and University of the Philippines Visayas presented their collaborative paper at the IEEE International Conference on Data Science and Advanced Analytics (DSAA 2026), held in Singapore last April 7–9.

The paper, titled "Predictive Analytics for Academic Performance in Philippine Higher Education: A Multi-Institutional Study," was co-authored by Dr. Ana Reyes (CIT-U), Dr. Marco Santos (UP Visayas), and three graduate student researchers.

Key findings of the study:
- A machine learning model achieved 87.4% accuracy in predicting at-risk students
- Socioeconomic indicators were stronger predictors than test scores alone
- Early intervention programs increased retention rates by 23% in the pilot group

The research utilized anonymized academic records from both institutions over five academic years and was conducted under the DASIG Joint Research Framework. All data handling complied with the Data Privacy Act of 2012.

The full paper will be published in the IEEE Xplore digital library. DASIG members can access the pre-print version through the Research module. This publication marks the first internationally recognized output from the DASIG Joint Research Program.

The consortium congratulates the research team on this milestone achievement.',
    FALSE
  )
ON CONFLICT DO NOTHING;


-- Training programs
INSERT INTO trainings (icon, category, title, org, duration, level, enrolled, total, schedule)
VALUES
  ('💻', 'Technology',  'Full-Stack Web Dev Bootcamp',           'DICT VII',  '6 weeks', 'Intermediate', 28, 30, 'Jul 7 – Aug 15, 2026 | Online'),
  ('🔬', 'Research',    'Research Methods for STEM Educators',   'DOST VII',  '3 weeks', 'Beginner',     18, 25, 'Jul 14 – Aug 1, 2026 | Hybrid'),
  ('🏛',  'Leadership', 'Strategic Leadership in Public Service', 'DTI VII',   '2 weeks', 'Advanced',     12, 20, 'Aug 3–16, 2026 | Cebu City'),
  ('📱', 'Governance',  'Digital Governance & Policy',            'DepEd VII', '4 weeks', 'Intermediate',  9, 15, 'Jul 21 – Aug 14, 2026 | Online')
ON CONFLICT DO NOTHING;


-- Consortium member institutions
INSERT INTO members (abbr, full_name, campus, type)
VALUES
  ('UP',    'University of the Philippines',                         'UP Visayas',  'State University'),
  ('USa',   'University of San Agustin',                             'Iloilo City', 'Private University'),
  ('DOST',  'Department of Science & Technology',                    'Region VII',  'Government Agency'),
  ('DICT',  'Department of Information & Communications Technology', 'Region VII',  'Government Agency'),
  ('DTI',   'Department of Trade & Industry',                        'Region VII',  'Government Agency'),
  ('DepEd', 'Department of Education',                               'Region VII',  'Government Agency')
ON CONFLICT DO NOTHING;


-- Seed policies
INSERT INTO policies (title, category, content, effective_date, members_only, archived)
VALUES
  (
    'DASIG Membership Policy 2026',
    'Membership',
    'This policy governs the eligibility, application process, and renewal requirements for DASIG consortium membership. Tier 1 (Full Member) institutions must demonstrate active research output and governance participation. Tier 2 (Associate Member) institutions are evaluated annually.',
    '2026-01-01',
    TRUE,
    FALSE
  ),
  (
    'Data Privacy and Information Security Policy',
    'Governance',
    'In compliance with RA 10173 (Data Privacy Act of 2012), all DASIG member institutions and portal users must adhere to strict data handling protocols. Personal information collected via the portal is used solely for consortium management purposes.',
    '2025-07-01',
    FALSE,
    FALSE
  ),
  (
    'Code of Conduct for DASIG Events',
    'Events',
    'All participants in DASIG-organized events are expected to maintain professional conduct, respect cultural diversity, and uphold academic integrity. Violations may result in removal from the event and suspension of consortium privileges.',
    '2024-06-01',
    FALSE,
    FALSE
  ),
  (
    'Intellectual Property and Research Output Policy',
    'Research',
    'Research outputs, publications, and innovations produced under DASIG consortium programs are governed by this policy. Co-authorship credit and IP rights are determined by contribution and institutional agreements.',
    '2023-01-15',
    TRUE,
    FALSE
  )
ON CONFLICT DO NOTHING;


-- Seed funding opportunities
INSERT INTO funding_opportunities (title, category, provider, amount, deadline, description, eligibility, status)
VALUES
  (
    'DOST SEI Scholarship 2026',
    'Scholarship',
    'Department of Science and Technology — Region VII',
    'Full tuition + monthly stipend',
    '2026-06-15',
    'Merit-based scholarship for STEM students nominated by DASIG member institutions.',
    'Must be nominated by a DASIG Tier 1 or Tier 2 member institution. Must be enrolled in a STEM program.',
    'Open'
  ),
  (
    'DICT Bayanihan Innovation Grant',
    'Grant',
    'Department of Information & Communications Technology',
    'Up to PHP 500,000',
    '2026-07-31',
    'Grant for ICT-based community development projects led by consortium institutions.',
    'Open to all DASIG member institutions. Project must benefit Region VII communities.',
    'Open'
  ),
  (
    'DTI Regional MSME Development Fund',
    'Government Fund',
    'Department of Trade and Industry — Region VII',
    'PHP 100,000 – PHP 1,000,000',
    '2026-05-30',
    'Support fund for MSME research and capacity-building initiatives.',
    'Must be endorsed by a DASIG member institution.',
    'Closed'
  ),
  (
    'UP System Research Grant 2026',
    'Research Grant',
    'University of the Philippines',
    'PHP 200,000 – PHP 800,000',
    '2026-08-01',
    'Competitive research grant for faculty of UP Visayas and partner consortium institutions.',
    'Faculty members of UP member campuses and DASIG partner institutions.',
    'Upcoming'
  )
ON CONFLICT DO NOTHING;


-- Seed partnerships
INSERT INTO partnerships (partner_name, type, description, start_date, end_date, contact_person, contact_email, status)
VALUES
  (
    'DOST-PCIEERD',
    'Research Collaboration',
    'Joint research and development program on emerging technologies for public sector innovation in Region VII.',
    '2023-03-01',
    '2026-02-28',
    'Dr. Maria Santos',
    'pcieerd@dost.gov.ph',
    'Expired'
  ),
  (
    'Commission on Higher Education (CHED)',
    'Academic Partnership',
    'Partnership for curriculum development, faculty exchange, and accreditation support for DASIG member HEIs.',
    '2024-06-01',
    NULL,
    'Dir. Juan Reyes',
    'info@ched.gov.ph',
    'Active'
  ),
  (
    'Asian Development Bank (ADB)',
    'Funding Partnership',
    'Capacity-building and technical assistance program for governance and digital transformation initiatives.',
    '2025-01-15',
    '2027-01-14',
    'Ms. Angela Lim',
    'adb-ph@adb.org',
    'Active'
  ),
  (
    'UP ITDC (IT Development Center)',
    'Technology Partnership',
    'Technical support for DASIG Portal development, cybersecurity advisory, and IT training facilitation.',
    '2025-06-01',
    NULL,
    'Engr. Paolo Cruz',
    'itdc@up.edu.ph',
    'Active'
  )
ON CONFLICT DO NOTHING;
