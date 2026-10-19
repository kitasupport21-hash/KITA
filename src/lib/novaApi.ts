export type ApiJob = {
  id: string;
  external_id?: string | null;
  title: string;
  company: string;
  province?: string | null;
  city?: string | null;
  salary_min_jt?: number | null;
  salary_max_jt?: number | null;
  work_mode?: string | null;
  level?: string | null;
  tags?: string[];
  description?: string | null;
  source_name?: string | null;
  source_url?: string | null;
  apply_url?: string | null;
  verified?: boolean;
  posted_at?: string | null;
};

export type ApiProfile = {
  id: string;
  email: string;
  name?: string | null;
  skills: string[];
  preferred_modes: string[];
  preferred_provinces: string[];
  target_levels: string[];
  minimum_salary_jt: number;
};

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { 'content-type': 'application/json', ...(options.headers || {}) },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || `API request failed (${response.status})`);
  return payload as T;
}

export function getJobs(filters: { q?: string; province?: string; level?: string; mode?: string } = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => { if (value) params.set(key, value); });
  return request<{ jobs: ApiJob[] }>(`/api/jobs${params.toString() ? `?${params}` : ''}`);
}

export function getProfile(email: string) {
  return request<{ profile: ApiProfile }>(`/api/profiles?email=${encodeURIComponent(email)}`);
}

export function saveProfile(profile: { email: string; name?: string; skills: string[]; preferredModes: string[]; preferredProvinces: string[]; targetLevels: string[]; minimumSalaryJt: number }) {
  return request<{ profile: ApiProfile }>('/api/profiles', { method: 'POST', body: JSON.stringify(profile) });
}

export function getSavedJobs(profileId: string) {
  return request<{ jobs: ApiJob[] }>(`/api/profiles/${encodeURIComponent(profileId)}/saved`);
}

export function saveJob(profileId: string, jobId: string) {
  return request<{ ok: true }>(`/api/profiles/${encodeURIComponent(profileId)}/saved`, { method: 'POST', body: JSON.stringify({ jobId }) });
}

export function removeSavedJob(profileId: string, jobId: string) {
  return request<{ ok: true }>(`/api/profiles/${encodeURIComponent(profileId)}/saved?jobId=${encodeURIComponent(jobId)}`, { method: 'DELETE' });
}

export function getApplications(profileId: string) {
  return request<{ applications: Array<Record<string, unknown>> }>(`/api/profiles/${encodeURIComponent(profileId)}/applications`);
}

export function createApplication(profileId: string, jobId: string, notes?: string) {
  return request<{ application: Record<string, unknown> }>(`/api/profiles/${encodeURIComponent(profileId)}/applications`, { method: 'POST', body: JSON.stringify({ jobId, notes }) });
}

export function healthCheck() {
  return request<{ ok: boolean; database: boolean; now: string }>('/api/health');
}
