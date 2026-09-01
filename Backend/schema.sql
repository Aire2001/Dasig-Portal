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
  title                 TEXT    NOT NULL UNIQUE,
  date                  TEXT    NOT NULL,
  venue                 TEXT    NOT NULL,
  organizer             TEXT    NOT NULL,
  category              TEXT    NOT NULL,
  enrolled              INTEGER NOT NULL DEFAULT 0,
  total                 INTEGER NOT NULL DEFAULT 0,
  description           TEXT,
  registration_deadline DATE
);

-- Deduplicate events if migration was run multiple times (keeps the lowest id per title)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'event_registrations') THEN
    DELETE FROM event_registrations
      WHERE event_id IN (
        SELECT id FROM events e
        WHERE e.id <> (SELECT MIN(id) FROM events e2 WHERE e2.title = e.title)
      );
  END IF;
END $$;
DELETE FROM events
  WHERE id <> (SELECT MIN(id) FROM events e2 WHERE e2.title = events.title);

-- Add unique constraint on existing deployments (safe if already exists)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'events_title_key') THEN
    ALTER TABLE events ADD CONSTRAINT events_title_key UNIQUE (title);
  END IF;
END $$;

-- Add columns to existing deployments (safe to run multiple times)
ALTER TABLE events ADD COLUMN IF NOT EXISTS registration_deadline DATE;
ALTER TABLE events ADD COLUMN IF NOT EXISTS start_time TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS end_time TEXT;
ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS attended BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE news ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE news ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE trainings ADD COLUMN IF NOT EXISTS schedule TEXT;
ALTER TABLE trainings ADD COLUMN IF NOT EXISTS session_start_time TEXT;
ALTER TABLE trainings ADD COLUMN IF NOT EXISTS session_end_time TEXT;
ALTER TABLE training_enrollments ADD COLUMN IF NOT EXISTS attended BOOLEAN NOT NULL DEFAULT FALSE;

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

CREATE TABLE IF NOT EXISTS trainings (
  id          BIGSERIAL PRIMARY KEY,
  icon        TEXT,
  category    TEXT    NOT NULL,
  title       TEXT    NOT NULL UNIQUE,
  org         TEXT    NOT NULL,
  duration    TEXT    NOT NULL,
  level       TEXT    NOT NULL,
  enrolled    INTEGER NOT NULL DEFAULT 0,
  total       INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  schedule    TEXT
);

-- Deduplicate trainings if migration was run multiple times
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'training_enrollments') THEN
    DELETE FROM training_enrollments
      WHERE training_id IN (
        SELECT id FROM trainings t
        WHERE t.id <> (SELECT MIN(id) FROM trainings t2 WHERE t2.title = t.title)
      );
  END IF;
END $$;
DELETE FROM trainings
  WHERE id <> (SELECT MIN(id) FROM trainings t2 WHERE t2.title = trainings.title);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'trainings_title_key') THEN
    ALTER TABLE trainings ADD CONSTRAINT trainings_title_key UNIQUE (title);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS training_enrollments (
  id          BIGSERIAL PRIMARY KEY,
  training_id BIGINT NOT NULL REFERENCES trainings(id) ON DELETE CASCADE,
  user_id     BIGINT NOT NULL REFERENCES users(id)     ON DELETE CASCADE,
  attended    BOOLEAN NOT NULL DEFAULT FALSE,
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

-- Deduplicate members before adding unique constraint (keeps lowest id per abbr)
DELETE FROM members
  WHERE id <> (SELECT MIN(id) FROM members m2 WHERE m2.abbr = members.abbr);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'members_abbr_key') THEN
    ALTER TABLE members ADD CONSTRAINT members_abbr_key UNIQUE (abbr);
  END IF;
END $$;

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
  title          TEXT    NOT NULL UNIQUE,
  category       TEXT    NOT NULL,
  content        TEXT    NOT NULL,
  effective_date DATE    NOT NULL,
  members_only   BOOLEAN NOT NULL DEFAULT FALSE,
  archived       BOOLEAN NOT NULL DEFAULT FALSE,
  created_by     BIGINT  REFERENCES users(id),
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ
);

DELETE FROM policies
  WHERE id <> (SELECT MIN(id) FROM policies p2 WHERE p2.title = policies.title);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'policies_title_key') THEN
    ALTER TABLE policies ADD CONSTRAINT policies_title_key UNIQUE (title);
  END IF;
END $$;

-- Funding opportunities (UC-FM)
CREATE TABLE IF NOT EXISTS funding_opportunities (
  id          BIGSERIAL PRIMARY KEY,
  title       TEXT NOT NULL UNIQUE,
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

DELETE FROM funding_opportunities
  WHERE id <> (SELECT MIN(id) FROM funding_opportunities f2 WHERE f2.title = funding_opportunities.title);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'funding_opportunities_title_key') THEN
    ALTER TABLE funding_opportunities ADD CONSTRAINT funding_opportunities_title_key UNIQUE (title);
  END IF;
END $$;

-- Strategic partnerships (UC-SP)
CREATE TABLE IF NOT EXISTS partnerships (
  id             BIGSERIAL PRIMARY KEY,
  partner_name   TEXT NOT NULL UNIQUE,
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

DELETE FROM partnerships
  WHERE id <> (SELECT MIN(id) FROM partnerships p2 WHERE p2.partner_name = partnerships.partner_name);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'partnerships_partner_name_key') THEN
    ALTER TABLE partnerships ADD CONSTRAINT partnerships_partner_name_key UNIQUE (partner_name);
  END IF;
END $$;

-- Chatbot conversation logs (for accuracy metrics, UC-CB-03)
CREATE TABLE IF NOT EXISTS chatbot_logs (
  id         BIGSERIAL PRIMARY KEY,
  message    TEXT    NOT NULL,
  matched    BOOLEAN NOT NULL DEFAULT FALSE,
  intent     TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contact form messages
CREATE TABLE IF NOT EXISTS contact_messages (
  id         BIGSERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  subject    TEXT NOT NULL,
  category   TEXT NOT NULL DEFAULT 'General Inquiry',
  message    TEXT NOT NULL,
  read       BOOLEAN NOT NULL DEFAULT FALSE,
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
ALTER TABLE contact_messages        DISABLE ROW LEVEL SECURITY;
