<div align="center">

# Hackathon Tracker

[![Status](https://img.shields.io/badge/status-live-brightgreen)]()
[![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)]()
[![Vercel](https://img.shields.io/badge/Vercel-000000?logo=vercel&logoColor=white)](https://vercel.com)
[![Access](https://img.shields.io/badge/access-row--level%20security-orange)]()
[![License](https://img.shields.io/badge/license-MIT-lightgrey)](LICENSE)

### Six hackathons, one board, zero missed deadlines

Deadlines, registrations, tracks and progress updates for every hackathon your team is chasing, in one shared space that updates live on everyone's screen.

**[Try it live](https://hackathon-winners-plum.vercel.app)** 

</div>

## The problem

A student team rarely does one hackathon at a time. PPT deadlines, offline rounds and online submissions overlap, and the details live in group chats, screenshots and someone's notes app.

Questions like "who registered us for this?", "is the PPT due on the 27th or the 31st?" and "did anyone start the demo video?" get asked again every few days, because nothing holds the answer in one place.

**The tracker does.** Every hackathon is one card with its dates, track, registrar, link and a running feed of updates. Cards sit in the phase they belong to, so the team always knows what to work on now and what comes next.

## What you get

| | |
|---|---|
| **Phase board** | Hackathons grouped by timeline: what's due now, the next two weeks, and later. |
| **Live sync** | An edit on one laptop appears on every other screen instantly, with no refresh. |
| **Updates feed** | Timestamped, named comments on each hackathon, so progress is never lost in chat. |
| **Deadline badges** | Countdown chips on every date and a "next up" strip for the closest deadline. |
| **Decide fast** | Sort by nearest deadline or by registrant count when you can only pick one. |
| **Auto-refreshed registrants** | Counts update every 6 hours from Devpost, Unstop and other event pages. |
| **Light and dark** | Follows your system theme, or switch with one tap. |
| **Team only** | Sign-in with an email allowlist, enforced inside the database itself. |

## How it works

1. **Sign in.** Supabase Auth issues a session token carrying the user's email.
2. **Membership check.** The database compares that email against the `team_members` allowlist.
3. **Read.** If the user is on the list, Postgres returns the hackathons and their updates. If not, it returns nothing.
4. **Write.** Edits to a card or a new update go straight to Postgres through the same check.
5. **Broadcast.** Supabase Realtime streams every change to all connected teammates, and each screen re-renders.

```
 Browser (index.html)
     │  supabase-js
     ▼
 Supabase
 ├── Auth ─────────── session token with user email
 ├── PostgreSQL
 │   ├── team_members   allowlist of emails
 │   ├── hackathons     one row per event
 │   ├── updates        comments, linked to a hackathon
 │   └── RLS            access only if is_member() is true
 └── Realtime ─────── pushes row changes to every client
```

## Security model

The frontend holds only the public anon key, so access control cannot live in the browser. It lives in Postgres.

`is_member()` is a `security definer` function that reads the email from the user's token and checks it against `team_members`. Row Level Security policies on `hackathons` and `updates` allow reading and writing only when it returns true. Someone who creates an account without being on the list sees an empty board, even if they call the API directly.

| Table | Purpose | Key columns |
|---|---|---|
| `team_members` | Who can access the board | `email` |
| `hackathons` | One row per event | `name`, `phase`, `submit_date`, `round_date`, `regs`, `registrar`, `track`, `link` |
| `updates` | Progress feed | `hackathon_id`, `body`, `author_name`, `created_at` |

## Tech stack

**Frontend**
`HTML` · `CSS` · `Vanilla JavaScript` · `supabase-js` (single file, no build step)

**Backend**
`Supabase` · `PostgreSQL` · `Supabase Auth` · `Supabase Realtime`

**Security**
`Row Level Security` · `security definer` functions

**Hosting**
`Vercel` (auto-deploys from GitHub)

## Setup

**1. Sign in**
Create an account with an email that's on the team list.

**2. Read the board**
Three columns: what's due now, the next two weeks, and after. Inside each, the nearest deadline sits on top.

**3. Edit a card**
Change dates, track, registrar, status or notes directly on the card. Everyone sees the change instantly.

**4. Post an update**
Open a card's updates and write what you did or what's blocked. Your name and the time are added automatically.

**5. Move or add**
Use "Move to..." when a hackathon shifts phase, or "+" next to a column to add a new one.

## Getting started

**Try it live:** [hackathon-winners-plum.vercel.app](https://hackathon-winners-plum.vercel.app)

**Or run your own copy:**

1. Create a project on [Supabase](https://supabase.com).
2. Open `schema.sql`, replace the example emails with your team's, and run it in the SQL Editor.
3. Under Authentication > Sign In / Providers > Email, turn off "Confirm email".
4. Copy the Project URL and anon key from the API settings into `index.html`.
5. Open `index.html` in a browser to test, then import the repo into [Vercel](https://vercel.com) and deploy.

To add a teammate later:

```sql
insert into team_members (email) values ('their@email.com');
```

## Auto-refreshing registrants

A GitHub Actions workflow (`.github/workflows/refresh-registrants.yml`) runs `scripts/refresh-registrants.mjs` every 6 hours:

1. **Devpost** pages are read directly.
2. **Unstop** counts come from Unstop's public opportunity API.
3. **Any other site**, or a page that loads its numbers with JavaScript, is sent to [Tavily Extract](https://tavily.com), which renders the page, in one batched call.

The count and an "as of" date are written back to Supabase, and every open tracker updates live. Add these as repository secrets (Settings > Secrets and variables > Actions):

| Secret | Value |
|---|---|
| `SUPABASE_URL` | Your project URL |
| `SUPABASE_SERVICE_KEY` | The secret / service_role key (never put this in a file) |
| `TAVILY_API_KEY` | Optional, from tavily.com. Without it, only Devpost and Unstop are refreshed. |

Run it manually from the Actions tab with **Run workflow**.

## Future Work

- **Smarter count detection** for event pages that don't show registrants in a standard format, so more sites refresh automatically.
- **Deadline reminders** by email a day before each submission.
- **Submission links** for the PPT, repo and demo video on each card.
- **Archive** for finished hackathons, with results.

<br>

---

<div align="center">

<sub>Built with ❤️ for the team, somewhere between a PPT deadline and an offline round.</sub>

</div>
