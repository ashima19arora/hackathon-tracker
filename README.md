# Hackathon Tracker

A real-time board for teams running several hackathons in parallel. Deadlines, registrations, tracks and progress updates live in one place and sync instantly across every teammate's screen.

**Live:** https://your-link.vercel.app

---

## Features

| | |
|---|---|
| Phase board | Hackathons grouped by timeline: current, next two weeks, later |
| Live sync | Every edit and update appears for all teammates without a refresh |
| Updates feed | Timestamped, attributed comments on each hackathon |
| Deadline badges | Countdown chips and a "next up" strip for the closest deadline |
| Sorting | By nearest deadline or registrant count |
| Team-only access | Email auth with an allowlist enforced in the database |

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML, CSS, vanilla JavaScript (no build step) |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth (email and password) |
| Realtime | Supabase Realtime (Postgres change streams) |
| Security | Row Level Security policies |
| Hosting | Vercel, deployed from GitHub |

## Architecture

```
 Browser (index.html)
     │  supabase-js
     ▼
 Supabase
 ├── Auth ─────────── issues JWT with user email
 ├── PostgreSQL
 │   ├── team_members   allowlist of emails
 │   ├── hackathons     one row per event
 │   ├── updates        comments, linked to a hackathon
 │   └── RLS: access only if is_member() is true
 └── Realtime ─────── pushes row changes to all clients
```

## Data Model

| Table | Purpose | Key columns |
|---|---|---|
| `team_members` | Who can access the board | `email` |
| `hackathons` | Event details | `name`, `phase`, `submit_date`, `round_date`, `regs`, `registrar`, `track`, `link` |
| `updates` | Progress comments | `hackathon_id`, `body`, `author_name`, `created_at` |

## Security

Access control lives in Postgres, not the frontend. `is_member()` is a `security definer` function that checks the email in the user's JWT against `team_members`. RLS policies on `hackathons` and `updates` allow reads and writes only when it returns true. A signed-up user who is not on the list gets no data, even with direct API access.

## Setup

1. Create a Supabase project.
2. Add your team's emails to `schema.sql` and run it in the SQL Editor.
3. Under Authentication > Sign In / Providers > Email, turn off "Confirm email".
4. Put your Project URL and anon key into `index.html`.
5. Import the repo into Vercel and deploy.

## Future Work

- Auto-refresh registrant counts from event pages
- Email reminders before deadlines
- Submission links (PPT, repo, demo) per hackathon
