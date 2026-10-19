export type MatchProfile = {
  skills: string[];
  preferredModes: string[];
  preferredProvinces: string[];
  targetLevels: string[];
  minimumSalaryJt?: number;
};

export type MatchJob = {
  title: string;
  tags: string[];
  mode: string;
  province: string;
  level: string;
  salary?: string;
};

export type MatchBreakdown = {
  overall: number;
  skills: number;
  workMode: number;
  location: number;
  seniority: number;
  salary: number;
  reasons: string[];
  gaps: string[];
};

const normalize = (value: string) => value.trim().toLowerCase();
const tokenSet = (values: string[]) => new Set(values.flatMap(value => normalize(value).split(/[^a-z0-9+#.]+/).filter(Boolean)));

function salaryMax(salary = '') {
  const matches = salary.replace(/,/g, '.').match(/\d+(?:\.\d+)?/g) ?? [];
  return matches.length ? Math.max(...matches.map(Number)) : 0;
}

/** Explainable NOVA fit score. This is intentionally deterministic so users can see why a score changed. */
export function calculateMatch(profile: MatchProfile, job: MatchJob): MatchBreakdown {
  const wanted = tokenSet(profile.skills);
  const offered = tokenSet(job.tags);
  const overlap = [...wanted].filter(skill => offered.has(skill));
  const skills = wanted.size ? Math.round((overlap.length / wanted.size) * 100) : 50;
  const workMode = profile.preferredModes.length === 0 || profile.preferredModes.some(x => normalize(x) === normalize(job.mode)) ? 100 : 35;
  const location = profile.preferredProvinces.length === 0 || profile.preferredProvinces.some(x => normalize(x) === normalize(job.province)) ? 100 : 55;
  const seniority = profile.targetLevels.length === 0 || profile.targetLevels.some(x => normalize(x) === normalize(job.level)) ? 100 : 60;
  const maxSalary = salaryMax(job.salary);
  const salary = !profile.minimumSalaryJt || !maxSalary ? 70 : maxSalary >= profile.minimumSalaryJt ? 100 : Math.max(20, Math.round((maxSalary / profile.minimumSalaryJt) * 100));
  const overall = Math.round(skills * 0.45 + workMode * 0.15 + location * 0.12 + seniority * 0.18 + salary * 0.10);

  const reasons = [
    overlap.length ? `${overlap.length} skill match${overlap.length > 1 ? 'es' : ''}: ${overlap.join(', ')}` : 'No direct skill overlap detected',
    workMode === 100 ? `Matches your ${job.mode} work preference` : `${job.mode} differs from your preferred work mode`,
    location === 100 ? `Located in your preferred province` : `Location is outside your preferred province`,
    seniority === 100 ? `Matches your ${job.level} target` : `Different from your target career level`,
  ];

  const gaps = [...wanted].filter(skill => !offered.has(skill));
  return { overall, skills, workMode, location, seniority, salary, reasons, gaps };
}

export function detectRiskSignals(text: string) {
  const value = normalize(text);
  const patterns = [
    ['upfront payment', /(pay|payment|transfer|deposit).{0,35}(fee|money|rp|charge)/i],
    ['guaranteed income', /(guaranteed|jamin).{0,20}(salary|income|gaji)/i],
    ['personal account transfer', /(rekening|account).{0,25}(pribadi|personal)/i],
    ['unusual identity request', /(otp|one[- ]time password|pin).{0,30}(send|share|kirim)/i],
  ] as const;
  return patterns.filter(([, pattern]) => pattern.test(value)).map(([signal]) => signal);
}
