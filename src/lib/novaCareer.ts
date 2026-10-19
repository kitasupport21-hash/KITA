export type CareerProfile = {
  skills: string[];
  targetLevels: string[];
  preferredModes: string[];
  preferredProvinces: string[];
  minimumSalaryJt: number;
};

export type CareerJob = {
  id: string;
  title: string;
  company: string;
  province?: string | null;
  city?: string | null;
  salary_min_jt?: number | null;
  salary_max_jt?: number | null;
  work_mode?: string | null;
  level?: string | null;
  tags?: string[];
};

export type CareerInsight = {
  jobId: string;
  score: number;
  strengths: string[];
  gaps: string[];
  nextSkills: string[];
  explanation: string;
};

const clean = (v: string) => v.trim().toLowerCase();

export function buildCareerInsight(profile: CareerProfile, job: CareerJob): CareerInsight {
  const userSkills = new Set(profile.skills.map(clean));
  const jobSkills = (job.tags || []).map(clean).filter(Boolean);
  const matched = jobSkills.filter(skill => userSkills.has(skill));
  const gaps = jobSkills.filter(skill => !userSkills.has(skill));
  const modeMatch = !job.work_mode || !profile.preferredModes.length || profile.preferredModes.map(clean).includes(clean(job.work_mode));
  const levelMatch = !job.level || !profile.targetLevels.length || profile.targetLevels.map(clean).includes(clean(job.level));
  const locationMatch = !job.province || !profile.preferredProvinces.length || profile.preferredProvinces.map(clean).includes(clean(job.province));
  const salaryMatch = !profile.minimumSalaryJt || !job.salary_max_jt || job.salary_max_jt >= profile.minimumSalaryJt;
  const skillScore = jobSkills.length ? Math.round((matched.length / jobSkills.length) * 100) : 50;
  const score = Math.round(skillScore * 0.55 + (modeMatch ? 100 : 35) * 0.12 + (locationMatch ? 100 : 35) * 0.12 + (levelMatch ? 100 : 35) * 0.11 + (salaryMatch ? 100 : 35) * 0.10);
  const strengths = [
    matched.length ? `${matched.length} listed skill${matched.length === 1 ? '' : 's'} match this role.` : '',
    modeMatch ? 'Work-mode preference is compatible.' : '',
    locationMatch ? 'Location preference is compatible.' : '',
    salaryMatch ? 'Salary range meets your current minimum target.' : ''
  ].filter(Boolean);
  const nextSkills = gaps.slice(0, 5);
  return {
    jobId: job.id,
    score,
    strengths,
    gaps,
    nextSkills,
    explanation: gaps.length ? `Your strongest path to this role is to keep your matched skills and close the ${gaps.length} identified skill gap${gaps.length === 1 ? '' : 's'}.` : 'Your recorded profile currently covers the listed skills for this role.'
  };
}

export function buildCareerRoadmap(profile: CareerProfile, jobs: CareerJob[]) {
  const ranked = jobs.map(job => buildCareerInsight(profile, job)).sort((a, b) => b.score - a.score);
  const skillFrequency = new Map<string, number>();
  ranked.slice(0, 10).forEach(item => item.nextSkills.forEach(skill => skillFrequency.set(skill, (skillFrequency.get(skill) || 0) + 1)));
  const prioritySkills = [...skillFrequency.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([skill]) => skill);
  return { ranked, prioritySkills };
}
