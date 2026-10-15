/**
 * KITA - Frontend API Client
 * Connects directly to backend /api/* routes
 */
import type {
  User,
  JobListing,
  JobApplication,
  JobFilterParams,
  ModerationReport,
  SupportTicket,
  SupportMessage,
  JobAlertSubscription,
  CreateJobAlertDto,
  NotificationItem
} from '../shared/types.js';

// Prefer the HttpOnly session cookie. Keep legacy localStorage tokens readable for migration only.
let authToken: string | null = null;
// Remove legacy bearer token persistence; the HttpOnly cookie restores sessions on reload.
if (typeof window !== 'undefined') { try { localStorage.removeItem('kita_token'); } catch { /* storage may be disabled */ } }

export function setClientToken(token: string | null) {
  authToken = token;
  // The backend sets an HttpOnly cookie. Do not persist bearer tokens in localStorage.
  if (typeof window !== 'undefined') {
    try { localStorage.removeItem('kita_token'); } catch { /* storage may be disabled */ }
  }
}

export function getClientToken(): string | null {
  if (typeof window !== 'undefined') {
    return authToken;
  }
  return authToken;
}

async function request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  const token = getClientToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
    credentials: 'include'
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.error || data?.message || `Request gagal dengan status ${response.status}`;
    const err = new Error(errorMsg);
    (err as any).errors = data?.errors;
    (err as any).status = response.status;
    throw err;
  }

  return data;
}

export const api = {
  checkHealth: () => request('/api/health'),

  // Auth
  register: (payload: any) =>
    request<{ success: boolean; data: { user: User; token: string } }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  login: (payload: any) =>
    request<{ success: boolean; data: { user: User; token: string } }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  googleLogin: (credential: string) =>
    request<{ success: boolean; data: { user: User; token: string } }>('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential })
    }),

  getMe: () => request<{ success: boolean; data: { user: User | null } }>('/api/auth/me'),

  logout: () => request<{ success: boolean; message: string }>('/api/auth/logout', { method: 'POST' }),

  // Marketplace
  getJobs: (params?: JobFilterParams) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          searchParams.append(key, String(val));
        }
      });
    }
    const query = searchParams.toString();
    return request<{ success: boolean; data: JobListing[] }>(`/api/jobs${query ? `?${query}` : ''}`);
  },

  getJobById: (id: string) => request<{ success: boolean; data: JobListing }>(`/api/jobs/${id}`),

  toggleSaveJob: (id: string) =>
    request<{ success: boolean; saved: boolean; message: string }>(`/api/jobs/${id}/save`, {
      method: 'POST'
    }),

  getSavedJobs: () => request<{ success: boolean; data: any[] }>('/api/saved-jobs'),

  applyForJob: (id: string, payload: { cover_letter: string; resume_url: string; portfolio_url?: string }) =>
    request<{ success: boolean; message: string; applicationId: string }>(`/api/jobs/${id}/apply`, {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  uploadResume: async (file: File) => {
    const form = new FormData();
    form.append('resume', file);
    const headers = new Headers();
    const token = getClientToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
    const response = await fetch('/api/uploads/resume', {
      method: 'POST',
      headers,
      body: form,
      credentials: 'include'
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(data?.error || `Unggahan CV gagal (${response.status}).`);
    return data as { success: boolean; data: { resume_url: string; original_name: string; size_bytes: number } };
  },

  // Seeker
  getSeekerApplications: () => request<{ success: boolean; data: JobApplication[] }>('/api/seeker/applications'),
  updateSeekerApplicationStatus: (appId: string, status: string) =>
    request<{ success: boolean; message: string; newStatus: string }>(`/api/seeker/applications/${appId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    }),

  // Employer
  getEmployerListings: () => request<{ success: boolean; data: JobListing[] }>('/api/employer/listings'),

  createEmployerListing: (payload: any) =>
    request<{ success: boolean; message: string; jobId: string }>('/api/employer/listings', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  updateEmployerListing: (id: string, payload: any) =>
    request<{ success: boolean; message: string }>(`/api/employer/listings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),

  toggleListingStatus: (id: string, status: 'draft' | 'published' | 'closed') =>
    request<{ success: boolean; message: string }>(`/api/employer/listings/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    }),

  getListingApplications: (jobId: string) =>
    request<{ success: boolean; jobTitle: string; data: JobApplication[] }>(`/api/employer/listings/${jobId}/applications`),

  updateApplicationStatus: (appId: string, status: string) =>
    request<{ success: boolean; message: string; newStatus: string }>(`/api/employer/applications/${appId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    }),

  getEmployerProfile: () => request<{ success: boolean; data: any }>('/api/employer/profile'),

  updateEmployerProfile: (payload: any) =>
    request<{ success: boolean; message: string }>('/api/employer/profile', {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),

  // Seeker Profile
  getSeekerProfile: () => request<{ success: boolean; data: any }>('/api/seeker/profile'),

  updateSeekerProfile: (payload: any) =>
    request<{ success: boolean; message: string }>('/api/seeker/profile', {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),

  // Companies & Locations Directories
  getCompanies: (params?: { search?: string; industry?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.append('search', params.search);
    if (params?.industry && params.industry !== 'Semua') searchParams.append('industry', params.industry);
    const query = searchParams.toString();
    return request<{ success: boolean; data: any[] }>(`/api/companies${query ? `?${query}` : ''}`);
  },

  getLocations: () =>
    request<{ success: boolean; data: { regions: any[]; locationCounts: any } }>('/api/locations'),

  // Official Ingestion & Sync Pipeline
  getSyncStatus: () => request<{ success: boolean; data: any }>('/api/sync/status'),

  triggerSync: () =>
    request<{ success: boolean; message: string; data: any }>('/api/sync/trigger', {
      method: 'POST'
    }),

  // Email Delivery Engine
  getEmailStatus: () => request<{ success: boolean; data: any }>('/api/email/status'),

  // Anti-scam & Moderation Reporting
  reportListingOrUser: (payload: { target_type: 'job' | 'user'; target_id: string; reason: string; details?: string }) =>
    request<{ success: boolean; message: string; reportId: string }>('/api/reports', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  reportJob: (jobId: string, payload: { reason: string; details?: string; email?: string }) =>
    request<{ success: boolean; message: string; reportId: string }>(`/api/jobs/${jobId}/report`, {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  // Admin
  getAdminStats: () => request<{ success: boolean; data: any }>('/api/admin/stats'),

  getAdminReports: () => request<{ success: boolean; data: ModerationReport[] }>('/api/admin/reports'),

  updateReportStatus: (id: string, status: string) =>
    request<{ success: boolean; message: string }>(`/api/admin/reports/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    }),

  // Support
  getSupportTickets: () => request<{ success: boolean; data: SupportTicket[] }>('/api/support/tickets'),

  createSupportTicket: (payload: { subject: string; category: string; message: string; priority?: string }) =>
    request<{ success: boolean; message: string; ticketId: string }>('/api/support/tickets', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  getSupportMessages: (ticketId: string) =>
    request<{ success: boolean; data: SupportMessage[] }>(`/api/support/tickets/${ticketId}/messages`),

  sendSupportMessage: (ticketId: string, message: string) =>
    request<{ success: boolean; message: string }>(`/api/support/tickets/${ticketId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ message })
    }),

  // Seeker Job Alerts
  getJobAlerts: () => request<{ success: boolean; data: JobAlertSubscription[] }>('/api/seeker/job-alerts'),

  createJobAlert: (payload: CreateJobAlertDto) =>
    request<{ success: boolean; message: string; alertId: string }>('/api/seeker/job-alerts', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  toggleJobAlert: (id: string) =>
    request<{ success: boolean; isActive: boolean; message: string }>(`/api/seeker/job-alerts/${id}/toggle`, {
      method: 'PATCH'
    }),

  deleteJobAlert: (id: string) =>
    request<{ success: boolean; message: string }>(`/api/seeker/job-alerts/${id}`, {
      method: 'DELETE'
    }),

  testTriggerJobAlert: (id: string) =>
    request<{ success: boolean; message: string; matchedJob?: any }>(`/api/seeker/job-alerts/${id}/test-trigger`, {
      method: 'POST'
    }),

  // Notifications
  getNotifications: () => request<{ success: boolean; data: NotificationItem[] }>('/api/notifications'),

  markNotificationRead: (id: string) =>
    request<{ success: boolean }>(`/api/notifications/${id}/read`, {
      method: 'PATCH'
    }),

  markAllNotificationsRead: () =>
    request<{ success: boolean; message: string }>('/api/notifications/mark-all-read', {
      method: 'PATCH'
    })
};
