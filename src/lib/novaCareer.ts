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
  salaryMin?: number | null;
  salaryMax?: number | null;
  work_mode?: string | null;
  workMode?: string | null;
  level?: string | null;
  tags?: string[];
};

export type CareerInsight = {
  jobId: string;
  job: CareerJob;
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
  const workMode = job.work_mode ?? job.workMode;
  const salaryMax = job.salary_max_jt ?? job.salaryMax;
  const modeMatch = !workMode || !profile.preferredModes.length || profile.preferredModes.map(clean).includes(clean(workMode));
  const levelMatch = !job.level || !profile.targetLevels.length || profile.targetLevels.map(clean).includes(clean(job.level));
  const locationMatch = !job.province || !profile.preferredProvinces.length || profile.preferredProvinces.map(clean).includes(clean(job.province));
  const salaryMatch = !profile.minimumSalaryJt || !salaryMax || salaryMax >= profile.minimumSalaryJt;
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
    job,
    score,
    strengths,
    gaps,
    nextSkills,
    explanation: gaps.length ? `Your strongest path to this role is to keep your matched skills and close the ${gaps.length} identified skill gap${gaps.length === 1 ? '' : 's'}.` : 'Your recorded profile currently covers the listed skills for this role.'
  };
}

export function buildCareerRoadmap(profile: CareerProfile, jobs: CareerJob[]): CareerInsight[] {
  return jobs.map(job => buildCareerInsight(profile, job)).sort((a, b) => b.score - a.score);
}
