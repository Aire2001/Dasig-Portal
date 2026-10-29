# DASIG Portal

A dynamic web-based consortium management and information system for the DASIG (Digital Alliance for Sustainable Innovation and Growth) Region VII academic and government consortium.

Capstone & Research 2 (IT 411, Section G6) — Team 40 (2627-sem1-it411-40), Cebu Institute of Technology – University.
Team: Justin L. Wolfe (Team Leader), John Gil T. Cabalida, Christian Aire D. Tan, Reden Misael P. Relacion. Adviser: Ralph P. Laviste.

| | |
|---|---|
| Live system | https://dasig-portal.vercel.app |
| API | https://dasig-portal.onrender.com/api (health check: `/api/health`) |
| Repository | https://github.com/Aire2001/Dasig-Portal |

## What the portal does

- **Visitors** browse events, news, public policies and the member directory, and ask the Haribon AI chatbot questions in English, Bisaya or Tagalog.
- **Registered guests** register for events (with a QR admission pass), enrol in trainings and apply for membership.
- **Members** (Tier 1 Full Member or Tier 2 Associate) also see Policies, Strategic Partnerships and members-only news.
- **Administrators** manage users, membership applications, events, trainings, news, policies, funding listings and partnerships, record attendance, and view reports (including chatbot accuracy for a chosen date range).

## Technology

| Layer | Technology | Hosting |
|---|---|---|
| Front end | React 19, Vite, React Router, Tailwind CSS, FullCalendar, Recharts | Vercel |
| API | Node.js, Express 4, JSON Web Tokens, bcryptjs, Nodemailer, QR codes | Render |
| Database | PostgreSQL on Supabase (`@supabase/supabase-js`) | Supabase |
| Chatbot | Rule-based intent matcher (`Backend/src/lib/intentMatcher.js`) with live database answers | Part of the API |

## Repository layout

```
Backend/            Express API
  src/server.js     entry point, CORS, route mounting, /api/health
  src/routes/       auth, events, news, training, members, membership, policies,
                    funding, partnerships, chatbot, admin, contact
  src/lib/          Supabase client, intent matcher, mailer
  supabase-migration.sql   full database schema (run in the Supabase SQL editor)
  seed.js           creates sample data and three local test accounts
frontend/           React app
  src/api.js        API client (base URL from VITE_API_URL)
  src/pages/        one page per module
vercel.json         single-page-app rewrite for Vercel
```

## Running it locally

Requirements: Node.js 20.19+ (or 22.12+), npm, and a Supabase project.

1. **Database.** In the Supabase dashboard open SQL Editor → New query, paste `Backend/supabase-migration.sql` and run it.
2. **API.**
   ```
   cd Backend
   npm install
   (create Backend/.env with the variables below)
   node seed.js        # optional: sample data and local test accounts
   npm run dev         # http://localhost:4000/api
   ```
3. **Front end.**
   ```
   cd frontend
   npm install
   (create frontend/.env with VITE_API_URL=http://localhost:4000/api)
   npm run dev         # http://localhost:5173
   ```

### Environment variables (names only — never commit values)

| Where | Variable | Purpose |
|---|---|---|
| API | `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` | Database connection (service key stays on the server) |
| API | `JWT_SECRET` | Signs login tokens |
| API | `JWT_EXPIRES_ADMIN`, `JWT_EXPIRES_MEMBER` | Token lifetimes (defaults 24h and 7d) |
| API | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | Registration and cancellation emails |
| API | `PORTAL_URL`, `PORTAL_PUBLIC_URL`, `ADMIN_EMAIL` | Links in emails and admin contact |
| API | `PORT` | Defaults to 4000 |
| API (optional) | `ELEVENLABS_API_KEY` | Audio narration on news and member pages |
| Front end | `VITE_API_URL` | Base URL of the API |

## Deployment

The Vercel and Render projects are owned by the repository owner's account and redeploy automatically on every push to `main`.

- **Front end — Vercel.** Builds the React app in `frontend/` with `npm run build` (output `dist`). `vercel.json` rewrites every path to `index.html` so that page links such as `/programs` work. `VITE_API_URL` is set to the Render API URL in the Vercel project settings.
- **API — Render.** Node web service for `Backend/` (`npm install`, `npm start`). Environment variables are set in the Render dashboard. On the free plan the service sleeps when idle, so the first request after a pause can take up to about a minute.
- **Database — Supabase.** Schema from `supabase-migration.sql`.

Deployed version: the latest commit on `main`. The test evidence and project documents describe `main` at commit `e3c8e1c` (15 October 2026) and the fixes re-tested since then: a committed database credential removed from two helper scripts (17–18 October, INC-04), and member-only access for the news text and the Funding, Training and Partnership listings (29 October, INC-05 and INC-08). A performance-test script and a database health check were added on 28 October.

## Access for evaluation

Visitor features need no account. A registered guest account can be created on the Login page (Register). Member and administrator access for evaluation is provided to the adviser by the team on request; passwords are not published in this repository.

## Testing

Test cases and results are in the Software Test Document (93 cases) and the Week 10 Functional, Integration/System/Regression and Performance testing reports. Known open issues are listed in the Feature Completion Matrix.
