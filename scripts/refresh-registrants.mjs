// Updates each hackathon's registrant count from its link.
// 1. Devpost and Unstop are read directly (free, fast).
// 2. Anything still missing (other sites, or pages that load numbers with scripts)
//    goes to Tavily Extract, which renders the page, in one batched call.
// Secrets: SUPABASE_URL, SUPABASE_SERVICE_KEY, and optionally TAVILY_API_KEY.

const URL_ = process.env.SUPABASE_URL?.trim();
const KEY = process.env.SUPABASE_SERVICE_KEY?.trim();
const TAVILY = process.env.TAVILY_API_KEY?.trim();
if (!URL_ || !KEY) { console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY'); process.exit(1); }

const headers = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };
const UA = { 'User-Agent': 'Mozilla/5.0 (hackathon-tracker registrant refresh)' };
const today = new Date().toISOString().slice(0, 10);
const num = s => Number(String(s).replace(/[,\s]/g, ''));

// Finds a count like "22013 participants", "1,240 Registered", "Registrations: 500".
function findCount(text) {
  const t = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  const pats = [
    /([\d,]{1,9})\s*(?:participants|registered|registrations|registrants|applied|hackers)\b/i,
    /(?:participants|registered|registrations|registrants|applied)\s*[:(]?\s*([\d,]{1,9})/i,
  ];
  for (const p of pats) { const m = t.match(p); if (m && num(m[1]) > 0) return num(m[1]); }
  return null;
}

async function devpost(link) {
  return findCount(await (await fetch(link, { headers: UA })).text());
}

async function unstop(link) {
  const id = (link.match(/-(\d{5,})(?:[/?#]|$)/) || [])[1];
  if (!id) return null;
  const res = await fetch(`https://unstop.com/api/public/opportunity/${id}`, { headers: { ...UA, Accept: 'application/json' } });
  if (!res.ok) return null;
  const j = await res.json();
  const d = j?.data?.competition ?? j?.data ?? j;
  const v = d?.registerCount ?? d?.register_count ?? d?.registered_count;
  return v != null && !isNaN(num(v)) ? num(v) : null;
}

async function tavily(urls) {
  const out = {};
  for (let i = 0; i < urls.length; i += 20) {
    const res = await fetch('https://api.tavily.com/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TAVILY}` },
      body: JSON.stringify({ urls: urls.slice(i, i + 20), extract_depth: 'advanced' })
    });
    if (!res.ok) { console.log('Tavily error:', res.status, await res.text()); continue; }
    const j = await res.json();
    for (const r of j.results || []) out[r.url] = findCount(r.raw_content || '');
    for (const f of j.failed_results || []) console.log(`Tavily could not read ${f.url}`);
  }
  return out;
}

async function save(r, count, via) {
  const up = await fetch(`${URL_}/rest/v1/hackathons?id=eq.${r.id}`, {
    method: 'PATCH', headers, body: JSON.stringify({ regs: count, regs_at: today })
  });
  console.log(`${r.name}: ${r.regs ?? '-'} -> ${count} via ${via} (${up.ok ? 'saved' : 'save failed ' + up.status})`);
}

const res = await fetch(`${URL_}/rest/v1/hackathons?select=id,name,link,regs`, { headers });
if (!res.ok) { console.error('Could not read hackathons:', res.status, await res.text()); process.exit(1); }
const rows = (await res.json()).filter(r => r.link);
const left = [];

for (const r of rows) {
  let count = null, via = null;
  try {
    if (r.link.includes('devpost.com')) { via = 'Devpost'; count = await devpost(r.link); }
    else if (r.link.includes('unstop.com')) { via = 'Unstop'; count = await unstop(r.link); }
  } catch (e) { console.log(`${r.name}: direct read failed (${e.message})`); }
  if (count != null) await save(r, count, via); else left.push(r);
}

if (left.length && TAVILY) {
  const found = await tavily(left.map(r => r.link));
  for (const r of left) {
    const c = found[r.link];
    if (c != null) await save(r, c, 'Tavily');
    else console.log(`${r.name}: no count found, left as ${r.regs ?? '-'}`);
  }
} else {
  for (const r of left) console.log(`${r.name}: no count found${TAVILY ? '' : ' (add TAVILY_API_KEY to try other sites)'}, left as ${r.regs ?? '-'}`);
}
