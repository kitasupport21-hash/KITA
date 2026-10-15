/**
 * KITA - Shared Type Definitions
 * Data contracts used across frontend client and backend server
 */

export type UserRole = 'seeker' | 'employer' | 'admin';
export type JobType = 'fulltime' | 'parttime' | 'freelance' | 'internship' | 'contract';
export type WorkplaceType = 'remote' | 'onsite' | 'hybrid';
export type SalaryPeriod = 'monthly' | 'project' | 'hourly';
export type ListingStatus = 'draft' | 'published' | 'expired' | 'needs_reverification' | 'closed';
export type SourceType =
  | 'kemnaker_karirhub'
  | 'bumn_fhci'
  | 'official_corporate'
  | 'direct_verified_employer';
export type ApplicationMethod =
  | 'direct_internal'
  | 'external_url'
  | 'verified_email';
export type CompanyVerificationStatus =
  | 'verified_kemnaker'
  | 'verified_nib'
  | 'verified_corporate_domain'
  | 'pending_verification';
export type DeliveryStatus =
  | 'SUBMITTED_LOCAL'
  | 'DELIVERY_CONFIRMED'
  | 'DELIVERY_FAILED'
  | 'EXTERNAL_REDIRECT_REQUIRED';
export type ApplicationStatus =
  | 'submitted'
  | 'reviewing'
  | 'interview'
  | 'accepted'
  | 'rejected';
export type ModerationStatus = 'pending' | 'investigating' | 'resolved' | 'dismissed';
export type TicketStatus = 'open' | 'in_progress' | 'closed';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  city?: string;
  avatar_url?: string;
  bio?: string;
  cv_url?: string;
  skills?: string[];
  created_at: string;
  updated_at: string;
}

export interface UserAuthResponse {
  user: User;
  token: string;
}

export interface EmployerProfile {
  id: string;
  user_id: string;
  company_name: string;
  industry: string;
  company_size: string;
  address?: string;
  city: string;
  province?: string;
  logo_url?: string;
  website?: string;
  verified_email?: string;
  nib_number?: string;
  npwp_number?: string;
  verification_status: CompanyVerificationStatus;
  is_verified: boolean;
  created_at: string;
}

export interface JobListing {
  id: string;
  employer_id: string;
  employer_name?: string;
  employer_city?: string;
  employer_logo?: string;
  is_verified_employer?: boolean;
  company_verified_status: CompanyVerificationStatus;
  title: string;
  category: string;
  job_type: JobType;
  workplace_type: WorkplaceType;
  city: string;
  province: string;
  min_salary: number;
  max_salary: number;
  is_salary_negotiable: boolean;
  salary_period: SalaryPeriod;
  description: string;
  requirements: string[];
  benefits: string[];
  status: ListingStatus;
  status_reason?: string;
  source_type: SourceType;
  source_name: string;
  source_id?: string;
  original_listing_url: string;
  application_method: ApplicationMethod;
  application_url?: string;
  verified_company_email?: string;
  recruitment_phone?: string;
  workplace_address?: string;
  verification_evidence?: string;
  verification_history?: string;
  publication_date: string;
  expiry_date?: string | null;
  last_verified_at: string;
  applications_count?: number;
  has_applied?: boolean;
  is_saved?: boolean;
  is_demo?: boolean;
  created_at: string;
  updated_at: string;
}

export interface JobApplication {
  id: string;
  job_id: string;
  seeker_id: string;
  seeker_name?: string;
  seeker_email?: string;
  seeker_phone?: string;
  seeker_city?: string;
  job_title?: string;
  employer_name?: string;
  resume_url: string;
  cover_letter: string;
  portfolio_url?: string;
  status: ApplicationStatus;
  delivery_status: DeliveryStatus;
  delivery_error?: string | null;
  delivery_log_id?: string | null;
  consent_data_sharing?: boolean;
  created_at: string;
  updated_at: string;
}

export interface SavedJob {
  id: string;
  user_id: string;
  job_id: string;
  created_at: string;
}

export interface ModerationReport {
  id: string;
  reporter_id: string;
  reporter_name?: string;
  target_type: 'job' | 'user';
  target_id: string;
  target_title?: string;
  reason: string;
  details: string;
  status: ModerationStatus;
  created_at: string;
  resolved_at?: string;
}

export interface SupportTicket {
  id: string;
  user_id: string;
  user_name?: string;
  user_role?: UserRole;
  subject: string;
  category: string;
  message: string;
  status: TicketStatus;
  priority: 'low' | 'normal' | 'urgent';
  created_at: string;
  updated_at: string;
  messages_count?: number;
}

export interface SupportMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_name?: string;
  sender_role: UserRole;
  message: string;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

export type NotificationChannel = 'email' | 'push' | 'both';
export type AlertFrequency = 'instant' | 'daily' | 'weekly';

export interface JobAlertSubscription {
  id: string;
  user_id: string;
  title: string;
  category: string;
  city: string;
  job_type: string;
  workplace_type: string;
  min_salary: number;
  channel: NotificationChannel;
  frequency: AlertFrequency;
  email_destination?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  matches_count?: number;
}

export interface CreateJobAlertDto {
  title?: string;
  category?: string;
  city?: string;
  job_type?: string;
  workplace_type?: string;
  min_salary?: number;
  channel: NotificationChannel;
  frequency: AlertFrequency;
  email_destination?: string;
}

export interface JobFilterParams {
  keyword?: string;
  category?: string;
  province?: string;
  city?: string;
  job_type?: string;
  workplace_type?: string;
  source_type?: string;
  application_method?: string;
  only_verified?: boolean;
  min_salary?: number;
  max_salary?: number;
  limit?: number;
  offset?: number;
}
