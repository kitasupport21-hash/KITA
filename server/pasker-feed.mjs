const BASE = 'https://paskerid.kemnaker.go.id';
const MONTHS = { jan:0, januari:0, feb:1, februari:1, mar:2, maret:2, apr:3, april:3, mei:4, may:4, jun:5, juni:5, jul:6, juli:6, agu:7, agustus:7, sep:8, september:8, okt:9, oktober:9, nov:10, november:10, des:11, desember:11 };
const decode = (value) => String(value || '').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&#039;|&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
function parseDeadline(value) {
  const match = String(value || '').match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/i);
  if (!match) return null;
  const month = MONTHS[match[2].toLowerCase()];
  if (month == null) return null;
  // Treat the deadline as valid through the end of that local calendar day.
  return new Date(Date.UTC(Number(match[3]), month, Number(match[1]), 23, 59, 59, 999));
}
function extract(text, regex) { return decode(text.match(regex)?.[1] || ''); }

/** Public, robots-allowed official Pasker ID miniJobi listings. No login/session bypass. */
export function parsePaskerMiniJobi(html, now = new Date()) {
  const jobs = [];
  const cardRegex = /<div class="col-lg-4 col-md-6">([\s\S]*?)(?=<div class="col-lg-4 col-md-6">|<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>|$)/gi;
  const cards = [...String(html || '').matchAll(cardRegex)].map((match) => match[1]).filter((card) => /miniJobi\/\d+/.test(card) && /Batas Lamar/.test(card));
  for (const card of cards) {
    const title = extract(card, /<h3[^>]*>([\s\S]*?)<\/h3>/i);
    const company = extract(card, /<div class="small text-muted mb-3">([\s\S]*?)<\/div>/i);
    const detailPath = card.match(/href="(https:\/\/paskerid\.kemnaker\.go\.id\/miniJobi\/\d+)"/i)?.[1];
    const deadlineText = extract(card, /<strong>\s*Batas Lamar:\s*<\/strong>\s*([^<]+)/i);
    const deadline = parseDeadline(deadlineText);
    if (!title || !company || !detailPath || !deadline || deadline.getTime() < now.getTime()) continue;
    const badges = [...card.matchAll(/<span class="badge[^>]*>([\s\S]*?)<\/span>/gi)].map((m) => decode(m[1]));
    const location = badges[0] || '';
    const workMode = badges[1] || '';
    const category = badges[2] || '';
    const description = extract(card, /<p class="mb-3 text-secondary">([\s\S]*?)<\/p>/i);
    const salary = extract(card, /<strong>\s*Gaji:\s*<\/strong>\s*([^<]+)/i);
    jobs.push({
      id: detailPath.split('/').pop(), title, company, city: location, province: '', workMode, category,
      description, salaryText: salary, sourceName: 'Pasker ID miniJobi', sourceUrl: detailPath,
      applyUrl: `${BASE}/register?job=${encodeURIComponent(detailPath.split('/').pop())}`,
      postedAt: null, expiresAt: deadline.toISOString(), deadline: deadline.toISOString(),
      verifiedSource: true,
    });
  }
  return jobs;
}

export async function getLivePaskerJobs({ now = new Date(), fetchImpl = fetch } = {}) {
  const response = await fetchImpl(`${BASE}/miniJobi`, {
    headers: { accept: 'text/html', 'user-agent': 'NOVA-JobDiscovery/1.0 (public official job listing reader)' },
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`pasker_upstream_${response.status}`);
  const html = await response.text();
  return { jobs: parsePaskerMiniJobi(html, now), sourceUrl: `${BASE}/miniJobi`, checkedAt: now.toISOString() };
}
