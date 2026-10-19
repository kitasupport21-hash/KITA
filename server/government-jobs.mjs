const BKN_LIST_URL = 'https://www.bkn.go.id/category/publikasi/pengumuman/';
const BKN_BASE = 'https://www.bkn.go.id';
const SSCASN_URL = 'https://daftar-sscasn.bkn.go.id/login';
const KEMKES_LIST_URL = 'https://www.kemkes.go.id/id/pengumuman-all';
const KEMKES_BASE = 'https://www.kemkes.go.id';
const MAX_AGE_DAYS = 180;
const MONTHS_ID = { januari:0, februari:1, maret:2, april:3, mei:4, juni:5, juli:6, agustus:7, september:8, oktober:9, november:10, desember:11 };
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

function parseIndonesianDate(value) {
  const match = String(value || '').match(/(\d{1,2})\s+(Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)\s+(\d{4})/i);
  if (!match) return null;
  const date = new Date(Date.UTC(Number(match[3]), MONTHS_ID[match[2].toLowerCase()], Number(match[1])));
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Parse dated recruitment/selection notices from the official Ministry of Health archive. */
export function parseKemkesGovernmentJobs(html, now = new Date()) {
  const output = [];
  const pattern = /<a href="(\/id\/[^\"]+)" class="link">\s*<h4[^>]*>([\s\S]*?)<\/h4>[\s\S]*?<\/a>\s*<span>([\s\S]*?)<\/span>/gi;
  const hiringWords = /\b(rekrutmen|penerimaan|seleksi|lowongan|pengadaan tenaga|hasil seleksi)\b/i;
  const resultWords = /\b(hasil|kelulusan|jadwal|pengumuman hasil|pemenang)\b/i;
  for (const match of String(html || '').matchAll(pattern)) {
    const title = decode(match[2]);
    if (!hiringWords.test(title)) continue;
    const publishedAt = parseIndonesianDate(decode(match[3]));
    if (!publishedAt || publishedAt.getTime() > now.getTime() + 86400000 || now.getTime() - publishedAt.getTime() > MAX_AGE_DAYS * 86400000) continue;
    const url = new URL(match[1], KEMKES_BASE).toString();
    if (!url.startsWith(`${KEMKES_BASE}/id/`)) continue;
    const isResult = resultWords.test(title);
    output.push({
      id: url.split('/').filter(Boolean).pop(), title, agency: 'Kementerian Kesehatan Republik Indonesia',
      publishedAt: publishedAt.toISOString(), excerpt: '', sourceUrl: url,
      status: isResult ? 'selection_update' : 'official_notice',
      statusLabel: isResult ? 'Pembaruan seleksi — bukan otomatis lowongan terbuka' : 'Pengumuman rekrutmen resmi — cek tenggat pada dokumen',
      verifiedSource: true,
    });
  }
  const seen = new Set();
  return output.filter((item) => !seen.has(item.sourceUrl) && seen.add(item.sourceUrl))
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt)).slice(0, 20);
}

export async function getGovernmentJobAnnouncements({ now = new Date(), fetchImpl = fetch } = {}) {
  const fetchHtml = async (url) => {
    const response = await fetchImpl(url, {
      headers: { accept: 'text/html', 'user-agent': 'NOVA-OfficialJobNotices/1.0 (public government announcement reader)' },
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error(`government_source_upstream_${response.status}`);
    return response.text();
  };
  const [bknResult, kemkesResult] = await Promise.allSettled([
    fetchHtml(BKN_LIST_URL), fetchHtml(KEMKES_LIST_URL),
  ]);
  const notices = [];
  const sourceStatuses = [];
  if (bknResult.status === 'fulfilled') {
    notices.push(...parseBknGovernmentJobs(bknResult.value, now));
    sourceStatuses.push({ name: 'BKN RI', url: BKN_LIST_URL, available: true });
  } else sourceStatuses.push({ name: 'BKN RI', url: BKN_LIST_URL, available: false });
  if (kemkesResult.status === 'fulfilled') {
    notices.push(...parseKemkesGovernmentJobs(kemkesResult.value, now));
    sourceStatuses.push({ name: 'Kementerian Kesehatan RI', url: KEMKES_LIST_URL, available: true });
  } else sourceStatuses.push({ name: 'Kementerian Kesehatan RI', url: KEMKES_LIST_URL, available: false });
  if (!sourceStatuses.some((source) => source.available)) throw new Error('all_government_sources_unavailable');
  const unique = [...new Map(notices.map((item) => [item.sourceUrl, item])).values()]
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt)).slice(0, 30);
  return {
    notices: unique, sourceStatuses, sourceUrl: BKN_LIST_URL, kemkesSourceUrl: KEMKES_LIST_URL,
    sscasnUrl: SSCASN_URL, checkedAt: now.toISOString(), live: true,
    notice: unique.length
      ? 'Pengumuman diambil dari arsip resmi BKN dan Kementerian Kesehatan. Status pendaftaran dan syarat wajib dicek pada dokumen sumber.'
      : 'Tidak ditemukan pengumuman rekrutmen yang memenuhi rentang tanggal pada arsip pemerintah yang berhasil diperiksa.',
  };
}
