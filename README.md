# Hackathon Tracker

A real-time, collaborative tracker that helps a student team manage several hackathons at once: deadlines, registrations, tracks and progress updates in one shared place.

Built because our team was juggling 6+ hackathons with overlapping deadlines across WhatsApp chats and scattered notes.

## Features

- **Phase-based board**: hackathons grouped by timeline (this week / next two weeks / later), so the team always knows what to focus on now.
- **Live sync**: edits and updates appear instantly for every teammate via Supabase Realtime. No refresh needed.
- **Updates feed per hackathon**: timestamped comments showing who did what.
- **Deadline badges**: countdown chips ("in 4d") and a "next up" strip for the closest deadline.
- **Decision support**: sort by nearest deadline or registrant count to pick between competing events.
- **Team-only access**: email/password auth with an allowlist. Only listed teammates can read or write.

## Tech Stack

- **Frontend:** HTML, CSS, vanilla JavaScript (single page, no build step)
- **Backend:** Supabase (PostgreSQL, Auth, Realtime)
- **Security:** Postgres Row Level Security policies backed by a `security definer` membership function
- **Hosting:** Vercel, auto-deployed from GitHub

## How It Works

- `team_members` stores the allowed emails.
- `is_member()` checks the signed-in user's JWT email against that list.
- RLS policies on `hackathons` and `updates` allow access only when `is_member()` is true, so security is enforced in the database, not just the UI.
- The client subscribes to Postgres changes and re-renders on every insert/update/delete.

## Setup

1. Create a Supabase project and run `schema.sql` in the SQL Editor (add your team's emails first).
2. In Authentication → Email, turn off "Confirm email".
3. Paste your Project URL and anon key into `index.html`.
4. Deploy the repo on Vercel.

## Future Work

- Auto-refresh registrant counts from event pages
- Deadline reminders by email
- File/PPT links per submission
