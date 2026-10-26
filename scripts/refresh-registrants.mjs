// Updates the registrant count of each hackathon from its Devpost or Unstop page.
// Runs on GitHub Actions. Needs SUPABASE_URL and SUPABASE_SERVICE_KEY as repo secrets.

const URL_ = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_KEY;
if (!URL_ || !KEY) { console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY'); process.exit(1); }

const headers = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };
const UA = { 'User-Agent': 'Mozilla/5.0 (hackathon-tracker registrant refresh)' };
const today = new Date().toISOString().slice(0, 10);
const num = s => Number(String(s).replace(/,/g, ''));

async function devpost(link) {
  const html = await (await fetch(link, { headers: UA })).text();
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  const m = text.match(/([\d,]+)\s+participants/i) || text.match(/Participants\s*\(\s*([\d,]+)\s*\)/i);
  return m ? num(m[1]) : null;
}

async function unstop(link) {
  const id = (link.match(/-(\d{5,})(?:[/?#]|$)/) || [])[1];
  if (!id) return null;
  const res = await fetch(`https://unstop.com/api/public/opportunity/${id}`, { headers: { ...UA, Accept: 'application/json' } });
  if (!res.ok) return null;
  const j = await res.json();
  const d = j?.data?.competition ?? j?.data ?? j;
  const v = d?.registerCount ?? d?.register_count ?? d?.registered_count ?? d?.regnRequirements?.registerCount;
  return v != null && !isNaN(num(v)) ? num(v) : null;
}

const res = await fetch(`${URL_}/rest/v1/hackathons?select=id,name,link,regs`, { headers });
if (!res.ok) { console.error('Could not read hackathons:', res.status, await res.text()); process.exit(1); }
const rows = await res.json();

for (const r of rows) {
  if (!r.link) continue;
  let count = null, source = null;
  try {
    if (r.link.includes('devpost.com')) { source = 'Devpost'; count = await devpost(r.link); }
    else if (r.link.includes('unstop.com')) { source = 'Unstop'; count = await unstop(r.link); }
    else continue;
  } catch (e) { console.log(`${r.name}: ${source} fetch failed (${e.message})`); continue; }

  if (count == null) { console.log(`${r.name}: no count found on ${source}, left as ${r.regs}`); continue; }
  const up = await fetch(`${URL_}/rest/v1/hackathons?id=eq.${r.id}`, {
    method: 'PATCH', headers, body: JSON.stringify({ regs: count, regs_at: today })
  });
  console.log(`${r.name}: ${r.regs} -> ${count} (${up.ok ? 'saved' : 'save failed ' + up.status})`);
}
