export type LocationProfile = {
  preferredProvinces: string[];
  preferredModes: string[];
  maxCommuteMinutes?: number;
};

export type LocationAssessment = {
  score: number;
  label: 'excellent' | 'good' | 'partial' | 'unknown';
  reasons: string[];
};

/**
 * Deterministic location fit. It never invents travel times: commute data is only
 * assessed when an actual commute estimate is supplied by an external provider.
 */
export function assessLocationFit(profile: LocationProfile, job: { province?: string | null; city?: string | null; work_mode?: string | null; commuteMinutes?: number | null }): LocationAssessment {
  const province = (job.province || '').trim();
  const mode = (job.work_mode || '').trim();
  const preferredProvinces = profile.preferredProvinces || [];
  const preferredModes = profile.preferredModes || [];
  const reasons: string[] = [];
  let score = 50;

  if (mode && preferredModes.length) {
    if (preferredModes.includes(mode)) { score += 30; reasons.push(`Work mode matches your preference: ${mode}.`); }
    else { score -= 20; reasons.push(`Work mode differs from your saved preference: ${mode}.`); }
  }
  if (province && preferredProvinces.length) {
    if (preferredProvinces.includes(province)) { score += 20; reasons.push(`Location matches your preferred region: ${province}.`); }
    else { score -= 15; reasons.push(`Location is outside your preferred regions: ${province}.`); }
  }
  if (typeof job.commuteMinutes === 'number' && Number.isFinite(job.commuteMinutes) && profile.maxCommuteMinutes) {
    if (job.commuteMinutes <= profile.maxCommuteMinutes) {
      reasons.push(`Known commute estimate is within your ${profile.maxCommuteMinutes}-minute limit.`);
    } else {
      score -= 20;
      reasons.push(`Known commute estimate exceeds your ${profile.maxCommuteMinutes}-minute limit.`);
    }
  } else if (profile.maxCommuteMinutes) {
    reasons.push('No verified commute estimate is available for this role.');
  }

  const bounded = Math.max(0, Math.min(100, score));
  const label = reasons.length === 0 ? 'unknown' : bounded >= 80 ? 'excellent' : bounded >= 65 ? 'good' : 'partial';
  return { score: bounded, label, reasons };
}
