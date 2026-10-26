-- Hackathon tracker: run this once in Supabase (SQL Editor > New query > Run).
-- Before running, replace the example emails in the team_members insert with your team's emails.

create table if not exists team_members (email text primary key);
alter table team_members enable row level security;
insert into team_members (email) values
  ('teammate1@example.com'),
  ('teammate2@example.com')
on conflict do nothing;

create or replace function is_member() returns boolean
language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from team_members
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
$$;
grant execute on function is_member() to authenticated;

create table if not exists hackathons (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'New hackathon',
  phase text not null default 'a',
  status text not null default '',
  link text, organizer text, submit_date date, round_date date,
  regs integer, regs_at date, registrar text, mode text, prize text, track text, details text,
  sort_order bigint not null default (extract(epoch from now()) * 1000)::bigint
);

create table if not exists updates (
  id uuid primary key default gen_random_uuid(),
  hackathon_id uuid not null references hackathons(id) on delete cascade,
  body text not null,
  author_id uuid default auth.uid(),
  author_name text,
  created_at timestamptz not null default now()
);

alter table hackathons enable row level security;
alter table updates enable row level security;

drop policy if exists team_all on hackathons;
create policy team_all on hackathons for all to authenticated using (is_member()) with check (is_member());
drop policy if exists team_all on updates;
create policy team_all on updates for all to authenticated using (is_member()) with check (is_member());

alter publication supabase_realtime add table hackathons;
alter publication supabase_realtime add table updates;

insert into hackathons (name, phase, link, organizer, submit_date, round_date, regs, regs_at, registrar, mode, prize, track, details, sort_order) values
('Example Hackathon A', 'a', 'https://example.com/hackathon-a', 'Example College', '2026-10-31', '2026-11-03', 200, '2026-10-27', 'Teammate 1', 'Offline', null, 'Sustainability', 'PPT due first, then an offline round.', 1),
('Example Hackathon B', 'a', 'https://example.com/hackathon-b', 'Example Company', '2026-10-28', '2026-10-31', null, null, 'Teammate 1', 'Offline', null, null, 'PPT round, then an offline final.', 2),
('Example Hackathon C', 'b', 'https://example.com/hackathon-c', 'Example Platform', '2026-11-12', null, 20000, '2026-10-27', 'Teammate 2', 'Online', null, null, 'Submit: hosted URL, public repo, demo video, description.', 3),
('Example Hackathon D', 'b', 'https://example.com/hackathon-d', 'Example Society', '2026-11-15', null, 1000, '2026-10-27', 'Teammate 1', 'Online', null, null, 'Problem statement released later.', 4),
('Example Hackathon E', 'c', null, null, null, null, null, null, null, null, null, null, 'Planned for later.', 5),
('Example Hackathon F', 'c', null, null, null, null, null, null, null, null, null, null, 'Planned for later.', 6);