-- DASIG Portal -- Database Schema
-- Paste this entire block into Supabase SQL Editor and click Run

create table if not exists users (
  id            serial primary key,
  name          text not null,
  email         text not null unique,
  password_hash text not null,
  role          text not null default 'GUEST' check (role in ('GUEST','MEMBER','ADMIN')),
  institution   text,
  campus        text,
  member_since  date,
  renewal_due   date,
  tier          text,
  status        text not null default 'PENDING' check (status in ('PENDING','ACTIVE','GUEST')),
  created_at    timestamptz default now()
);

create table if not exists events (
  id          serial primary key,
  title       text not null,
  date        text not null,
  venue       text not null,
  organizer   text not null,
  category    text not null,
  enrolled    int not null default 0,
  total       int not null,
  description text,
  created_at  timestamptz default now()
);

create table if not exists event_registrations (
  id            serial primary key,
  event_id      int references events(id) on delete cascade,
  user_id       int references users(id) on delete cascade,
  registered_at timestamptz default now(),
  unique(event_id, user_id)
);

create table if not exists news (
  id           serial primary key,
  icon         text,
  badge        text,
  date         date,
  title        text not null,
  excerpt      text,
  members_only boolean default false,
  created_at   timestamptz default now()
);

create table if not exists trainings (
  id         serial primary key,
  icon       text,
  category   text,
  title      text not null,
  org        text,
  duration   text,
  level      text,
  enrolled   int not null default 0,
  total      int not null,
  created_at timestamptz default now()
);

create table if not exists training_enrollments (
  id          serial primary key,
  training_id int references trainings(id) on delete cascade,
  user_id     int references users(id) on delete cascade,
  enrolled_at timestamptz default now(),
  unique(training_id, user_id)
);

create table if not exists members (
  id         serial primary key,
  abbr       text not null,
  full_name  text not null,
  campus     text,
  type       text,
  created_at timestamptz default now()
);

create table if not exists membership_applications (
  id          serial primary key,
  user_id     int references users(id) on delete cascade,
  name        text,
  email       text,
  institution text,
  campus      text,
  tier        text,
  status      text default 'PENDING' check (status in ('PENDING','APPROVED','REJECTED')),
  applied_at  timestamptz default now()
);
