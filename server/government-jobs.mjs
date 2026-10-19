const BKN_LIST_URL = 'https://www.bkn.go.id/category/publikasi/pengumuman/';
const BKN_BASE = 'https://www.bkn.go.id';
const SSCASN_URL = 'https://daftar-sscasn.bkn.go.id/login';
const MAX_AGE_DAYS = 180;
const decode = (value) => String(value || '')
  .replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&hellip;/g, '…')
  .replace(/&#8211;|&ndash;/g, '–').replace(/&#8217;|&rsquo;/g, '’')
  .replace(/&quot;/g, '"').replace(/&#039;|&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const normalizeUrl = (value) => {
  try { const url = new URL(value, BKN_BASE); return url.protocol === 'https:' && url.hostname === 'www.bkn.go.id' ? url.toString() : null; }
  catch { return null; }
};
function parseDate(value) {
  const match = String(value || '').match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!match) return null;
  const date = new Date(Date.UTC(Number(match[3]), Number(match[2]) - 1, Number(match[1])));
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Parse only publicly visible hiring/selection notices from BKN's official announcement archive. */
export function parseBknGovernmentJobs(html, now = new Date()) {
  const records = [];
  const articleRegex = /<article\b[^>]*>([\s\S]*?)<\/article>/gi;
  const hiringWords = /\b(seleksi|rekrutmen|rekrutmen|penerimaan|pengadaan|lowongan|cpns|pppk|casn|tenaga jasa|tenaga kontrak|pegawai pemerintah)\b/i;
  const resultWords = /\b(hasil|kelulusan|jadwal ujian|kartu ujian|uji kompetensi|seleksi administrasi)\b/i;
  for (const match of String(html || '').matchAll(articleRegex)) {
    const article = match[1];
    const anchor = article.match(/<h[1-4][^>]*>[\s\S]*?<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<\/h[1-4]>/i)
      || article.match(/<a[^>]+class="[^"]*blog-entry-media-link[^"]*"[^>]+href="([^"]+)"[^>]*title="([^"]+)"/i);
    if (!anchor) continue;
    const title = decode(anchor[2]);
    if (!hiringWords.test(title)) continue;
    const url = normalizeUrl(anchor[1]);
    if (!url) continue;
    const dateText = decode(article.match(/class="updated"[^>]*>([\s\S]*?)<\/span>/i)?.[1] || article.match(/class="meta-date"[^>]*>([\s\S]*?)<\/li>/i)?.[1]);
    const publishedAt = parseDate(dateText);
    if (!publishedAt || publishedAt.getTime() > now.getTime() + 24 * 60 * 60 * 1000) continue;
    if (now.getTime() - publishedAt.getTime() > MAX_AGE_DAYS * 24 * 60 * 60 * 1000) continue;
    const excerpt = decode(article.match(/class="blog-entry-excerpt[^>]*>([\s\S]*?)<\/div>/i)?.[1] || '').slice(0, 700);
    const isResult = resultWords.test(title);
    records.push({
      id: url.split('/').filter(Boolean).pop(), title, agency: 'Badan Kepegawaian Negara (BKN)',
      publishedAt: publishedAt.toISOString(), excerpt, sourceUrl: url,
      status: isResult ? 'selection_update' : 'official_notice',
      statusLabel: isResult ? 'Pembaruan seleksi — bukan otomatis lowongan terbuka' : 'Pengumuman resmi — cek tenggat pada dokumen',
      verifiedSource: true,
    });
  }
  const seen = new Set();
  return records.filter((item) => !seen.has(item.sourceUrl) && seen.add(item.sourceUrl))
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt)).slice(0, 20);
}

export async function getGovernmentJobAnnouncements({ now = new Date(), fetchImpl = fetch } = {}) {
  const response = await fetchImpl(BKN_LIST_URL, {
    headers: { accept: 'text/html', 'user-agent': 'NOVA-OfficialJobNotices/1.0 (public government announcement reader)' },
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`bkn_upstream_${response.status}`);
  const html = await response.text();
  const notices = parseBknGovernmentJobs(html, now);
  return {
    notices, sourceUrl: BKN_LIST_URL, sscasnUrl: SSCASN_URL, checkedAt: now.toISOString(), live: true,
    notice: notices.length ? 'Pengumuman diambil dari arsip resmi BKN. Status pendaftaran dan syarat wajib dicek pada dokumen sumber.' : 'Tidak ditemukan pengumuman rekrutmen yang memenuhi rentang tanggal pada arsip BKN saat pemeriksaan ini.',
  };
}
