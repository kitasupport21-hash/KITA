import type { JobListing } from '../shared/types.js';

export interface SkillCandidate {
  label: string;
  pattern: RegExp;
  synonyms?: string[];
}

export const SKILL_CANDIDATES: SkillCandidate[] = [
  // Tech & Software
  { label: 'React', pattern: /\breact(\.js)?\b/i, synonyms: ['react', 'reactjs', 'frontend'] },
  { label: 'TypeScript', pattern: /\btypescript\b/i, synonyms: ['typescript', 'ts'] },
  { label: 'JavaScript', pattern: /\bjavascript\b/i, synonyms: ['javascript', 'js'] },
  { label: 'Node.js', pattern: /\bnode(\.js)?\b/i, synonyms: ['node', 'nodejs', 'backend'] },
  { label: 'Python', pattern: /\bpython\b/i, synonyms: ['python', 'py'] },
  { label: 'UI/UX', pattern: /\b(ui\/ux|ui|ux|figma)\b/i, synonyms: ['ui', 'ux', 'ui/ux', 'figma', 'design'] },
  { label: 'SQL', pattern: /\b(sql|mysql|postgresql)\b/i, synonyms: ['sql', 'database', 'mysql', 'postgres'] },
  { label: 'Mobile App', pattern: /\b(flutter|kotlin|swift|android|ios)\b/i, synonyms: ['mobile', 'flutter', 'android', 'ios', 'kotlin'] },
  { label: 'Cloud / DevOps', pattern: /\b(aws|cloud|docker|devops)\b/i, synonyms: ['cloud', 'devops', 'aws', 'docker'] },

  // Engineering & Industrial
  { label: 'PLC / SCADA', pattern: /\b(plc|scada|dcs|siemens)\b/i, synonyms: ['plc', 'scada', 'dcs', 'siemens'] },
  { label: 'Otomasi Industri', pattern: /\b(otomasi|mekatronika|instrumentasi)\b/i, synonyms: ['otomasi', 'mekatronika', 'instrumentasi'] },
  { label: 'K3 Umum', pattern: /\b(k3 umum|ahli k3)\b/i, synonyms: ['k3', 'k3 umum', 'ahli k3', 'safety'] },
  { label: 'K3 Maritim', pattern: /\bk3 maritim\b/i, synonyms: ['k3 maritim', 'maritim', 'pelabuhan'] },
  { label: 'POP Tambang', pattern: /\b(pop|pengawas operasional)\b/i, synonyms: ['pop', 'tambang', 'pengawas operasional'] },
  { label: 'AMDAL / Lingkungan', pattern: /\b(amdal|lingkungan|limbah)\b/i, synonyms: ['amdal', 'lingkungan', 'limbah'] },

  // Business, Logistics & Finance
  { label: 'Supply Chain', pattern: /\b(supply chain|rantai pasok)\b/i, synonyms: ['supply chain', 'rantai pasok', 'scm'] },
  { label: 'Logistik', pattern: /\b(logistik|petikemas|pergudangan|gudang)\b/i, synonyms: ['logistik', 'petikemas', 'pergudangan', 'gudang'] },
  { label: 'Manajemen Operasional', pattern: /\boperasional\b/i, synonyms: ['operasional', 'operations', 'supervisor'] },
  { label: 'Perbankan', pattern: /\b(perbankan|banking|odp)\b/i, synonyms: ['perbankan', 'bank', 'banking', 'odp'] },
  { label: 'Analisis Finansial', pattern: /\b(finansial|keuangan|akuntansi|accounting)\b/i, synonyms: ['finansial', 'keuangan', 'akuntansi', 'accounting', 'finance'] },
  { label: 'Digital Marketing', pattern: /\b(digital marketing|pemasaran|seo|social media)\b/i, synonyms: ['digital marketing', 'marketing', 'pemasaran', 'seo', 'social media'] },
  { label: 'Penjualan / Sales', pattern: /\b(sales|penjualan|b2b)\b/i, synonyms: ['sales', 'penjualan', 'b2b'] },
  { label: 'Customer Service', pattern: /\b(customer service|layanan|cs)\b/i, synonyms: ['customer service', 'layanan', 'cs'] },
  { label: 'ERP / SAP', pattern: /\b(erp|sap|tos|inventori|fifo)\b/i, synonyms: ['erp', 'sap', 'tos', 'inventori', 'fifo'] },

  // Culinary, Hospitality & Creative
  { label: 'Barista', pattern: /\bbarista\b/i, synonyms: ['barista', 'kopi', 'coffee'] },
  { label: 'Latte Art', pattern: /\blatte art\b/i, synonyms: ['latte art', 'espresso'] },
  { label: 'Food Hygiene', pattern: /\b(food safety|higiene|sanitasi)\b/i, synonyms: ['food safety', 'higiene', 'sanitasi'] },
  { label: 'Kain Tenun', pattern: /\b(tenun|batik|tekstil)\b/i, synonyms: ['tenun', 'batik', 'tekstil'] },
  { label: 'Desain Grafis', pattern: /\b(desain grafis|graphic design|photoshop)\b/i, synonyms: ['desain grafis', 'graphic design', 'photoshop', 'illustrator'] },
  { label: 'E-Commerce', pattern: /\b(e-commerce|marketplace|toko online)\b/i, synonyms: ['e-commerce', 'marketplace', 'toko online', 'shopee', 'tokopedia'] }
];

/**
 * Intelligently extracts relevant skill and qualification tags for a job listing
 */
export const getJobSkillTags = (job: JobListing): string[] => {
  const tags: string[] = [];
  const textToScan = `${job.title} ${job.category} ${job.description} ${(job.requirements || []).join(' ')}`.toLowerCase();

  for (const candidate of SKILL_CANDIDATES) {
    if (candidate.pattern.test(textToScan)) {
      if (!tags.includes(candidate.label)) {
        tags.push(candidate.label);
      }
    }
    if (tags.length >= 3) break;
  }

  // Fallback if fewer than 2 tags found: extract from title and category
  if (tags.length < 2) {
    if (job.category && !tags.includes(job.category)) {
      const shortCat = job.category.split('&')[0].split(',')[0].trim();
      if (shortCat.length <= 18) {
        tags.push(shortCat);
      }
    }
    if (job.job_type === 'freelance' && !tags.includes('Freelance')) {
      tags.push('Freelance');
    } else if (job.workplace_type === 'remote' && !tags.includes('Remote Work')) {
      tags.push('Remote Work');
    }
  }

  return tags.slice(0, 3);
};

/**
 * Checks if a job matches a search query/skill filter.
 * Supports:
 * - Direct substring matches on title, employer, description, requirements, category, city, province
 * - Skill tag matches (including compound names like "PLC / SCADA" or "UI/UX")
 * - Candidate pattern / synonyms matching
 */
export const matchJobBySkillOrKeyword = (job: JobListing, query: string): boolean => {
  if (!query || !query.trim()) return true;

  const q = query.toLowerCase().trim();

  // 1. Direct text field matches
  if (job.title?.toLowerCase().includes(q)) return true;
  if ((job.employer_name || '').toLowerCase().includes(q)) return true;
  if ((job.city || '').toLowerCase().includes(q)) return true;
  if ((job.province || '').toLowerCase().includes(q)) return true;
  if ((job.category || '').toLowerCase().includes(q)) return true;
  if ((job.description || '').toLowerCase().includes(q)) return true;
  if (Array.isArray(job.requirements) && job.requirements.some((r) => r.toLowerCase().includes(q))) return true;

  // 2. Extracted skill tags match
  const skillTags = getJobSkillTags(job);
  for (const tag of skillTags) {
    const tagLower = tag.toLowerCase();
    if (tagLower === q || tagLower.includes(q) || q.includes(tagLower)) {
      return true;
    }
  }

  // 3. Match against skill candidates and synonyms
  const textToScan = `${job.title} ${job.category} ${job.description} ${(job.requirements || []).join(' ')}`.toLowerCase();
  for (const candidate of SKILL_CANDIDATES) {
    const candidateLabel = candidate.label.toLowerCase();
    const isQueriedCandidate =
      candidateLabel === q ||
      candidateLabel.includes(q) ||
      q.includes(candidateLabel) ||
      (candidate.synonyms && candidate.synonyms.some((s) => s.toLowerCase() === q || q.includes(s.toLowerCase())));

    if (isQueriedCandidate) {
      if (candidate.pattern.test(textToScan)) {
        return true;
      }
    }
  }

  // 4. Tokenized match for composite queries (e.g. "PLC / SCADA" -> test "PLC" or "SCADA")
  const tokens = q
    .split(/[\/\,\s\-\+]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2);

  if (tokens.length > 1) {
    for (const token of tokens) {
      if (
        job.title?.toLowerCase().includes(token) ||
        (job.description || '').toLowerCase().includes(token) ||
        (Array.isArray(job.requirements) && job.requirements.some((r) => r.toLowerCase().includes(token)))
      ) {
        return true;
      }
    }
  }

  return false;
};
