/**
 * KITA - Data Validation Logic
 */

export interface ValidationResult<T = any> {
  isValid: boolean;
  errors: Record<string, string>;
  data?: T;
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function validateRegistration(data: any): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.email || typeof data.email !== 'string' || !validateEmail(data.email)) {
    errors.email = 'Alamat email tidak valid';
  }

  if (!data.password || typeof data.password !== 'string' || data.password.length < 10 || Buffer.byteLength(data.password, 'utf8') > 72) {
    errors.password = 'Kata sandi harus 10–72 byte agar diproses dengan aman';
  }

  if (!data.full_name || typeof data.full_name !== 'string' || data.full_name.trim().length < 2 || data.full_name.trim().length > 100) {
    errors.full_name = 'Nama lengkap harus terdiri dari 2–100 karakter';
  }

  const validRoles = ['seeker', 'employer'];
  if (!data.role || !validRoles.includes(data.role)) {
    errors.role = 'Peran pendaftaran harus: seeker atau employer. Akun admin hanya dapat dibuat oleh administrator sistem.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    data: {
      email: data.email?.trim().toLowerCase(),
      password: data.password,
      full_name: data.full_name?.trim(),
      role: data.role,
      phone: typeof data.phone === 'string' ? data.phone.trim().slice(0, 30) || null : null,
      city: typeof data.city === 'string' ? data.city.trim().slice(0, 100) || null : null,
      company_name: typeof data.company_name === 'string' ? data.company_name.trim().slice(0, 160) || null : null,
      industry: typeof data.industry === 'string' ? data.industry.trim().slice(0, 100) || null : null
    }
  };
}

export function validateLogin(data: any): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.email || typeof data.email !== 'string' || !validateEmail(data.email)) {
    errors.email = 'Email tidak valid';
  }

  if (!data.password || typeof data.password !== 'string' || !data.password) {
    errors.password = 'Kata sandi wajib diisi';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    data: {
      email: data.email?.trim().toLowerCase(),
      password: data.password
    }
  };
}

export function validateJobListing(data: any): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.title || typeof data.title !== 'string' || data.title.trim().length < 3) {
    errors.title = 'Judul lowongan minimal 3 karakter';
  }

  if (!data.category || typeof data.category !== 'string') {
    errors.category = 'Kategori pekerjaan wajib dipilih';
  }

  const validJobTypes = ['fulltime', 'parttime', 'freelance', 'internship', 'contract'];
  if (!data.job_type || !validJobTypes.includes(data.job_type)) {
    errors.job_type = 'Tipe pekerjaan tidak valid';
  }

  const validWorkplace = ['remote', 'onsite', 'hybrid'];
  if (!data.workplace_type || !validWorkplace.includes(data.workplace_type)) {
    errors.workplace_type = 'Tipe lokasi kerja (remote/onsite/hybrid) tidak valid';
  }

  if (!data.city || typeof data.city !== 'string') {
    errors.city = 'Kota/Lokasi wajib diisi';
  }

  const minSalary = Number(data.min_salary) || 0;
  const maxSalary = Number(data.max_salary) || 0;

  if (minSalary < 0 || maxSalary < 0) {
    errors.salary = 'Rentang gaji tidak boleh negatif';
  }

  if (maxSalary > 0 && maxSalary < minSalary) {
    errors.salary = 'Gaji maksimum tidak boleh lebih kecil dari gaji minimum';
  }

  if (!data.description || typeof data.description !== 'string' || data.description.trim().length < 15) {
    errors.description = 'Deskripsi pekerjaan minimal 15 karakter';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    data: {
      title: data.title?.trim(),
      category: data.category?.trim(),
      job_type: data.job_type,
      workplace_type: data.workplace_type,
      city: data.city?.trim(),
      province: data.province?.trim() || 'Indonesia',
      min_salary: minSalary,
      max_salary: maxSalary,
      is_salary_negotiable: Boolean(data.is_salary_negotiable),
      salary_period: data.salary_period || 'monthly',
      description: data.description?.trim(),
      requirements: Array.isArray(data.requirements) ? data.requirements : [],
      benefits: Array.isArray(data.benefits) ? data.benefits : [],
      status: ['draft', 'published', 'closed'].includes(data.status) ? data.status : 'published'
    }
  };
}

export function validateApplication(data: any): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.job_id || typeof data.job_id !== 'string') {
    errors.job_id = 'ID Lowongan pekerjaan wajib ada';
  }

  if (!data.cover_letter || typeof data.cover_letter !== 'string' || data.cover_letter.trim().length < 10) {
    errors.cover_letter = 'Surat lamaran / pesan pengantar minimal 10 karakter';
  }

  const resumeUrl = typeof data.resume_url === 'string' ? data.resume_url.trim() : '';
  const internalResumeUrl = /^\/api\/resumes\/[0-9a-f-]{36}$/i.test(resumeUrl);
  let secureExternalResumeUrl = false;
  try {
    const parsed = new URL(resumeUrl);
    secureExternalResumeUrl = parsed.protocol === 'https:' && !parsed.username && !parsed.password;
  } catch {
    secureExternalResumeUrl = false;
  }
  if (!resumeUrl || (!internalResumeUrl && !secureExternalResumeUrl)) {
    errors.resume_url = 'CV wajib dilampirkan menggunakan unggahan PDF KITA atau tautan HTTPS yang valid';
  }

  const portfolioUrl = typeof data.portfolio_url === 'string' ? data.portfolio_url.trim() : '';
  let safePortfolioUrl: string | null = null;
  if (portfolioUrl) {
    try {
      const parsed = new URL(portfolioUrl);
      if (parsed.protocol === 'https:' && !parsed.username && !parsed.password) safePortfolioUrl = portfolioUrl;
      else errors.portfolio_url = 'Tautan portofolio harus menggunakan HTTPS';
    } catch {
      errors.portfolio_url = 'Tautan portofolio tidak valid';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    data: {
      job_id: data.job_id,
      resume_url: resumeUrl,
      cover_letter: data.cover_letter?.trim(),
      portfolio_url: safePortfolioUrl
    }
  };
}

export function validateJobAlertSubscription(data: any, userEmail?: string): ValidationResult {
  const errors: Record<string, string> = {};

  const validChannels = ['email', 'push', 'both'];
  const channel = data.channel || 'both';
  if (!validChannels.includes(channel)) {
    errors.channel = 'Saluran notifikasi harus: email, push, atau both';
  }

  const validFrequencies = ['instant', 'daily', 'weekly'];
  const frequency = data.frequency || 'instant';
  if (!validFrequencies.includes(frequency)) {
    errors.frequency = 'Frekuensi notifikasi harus: instant, daily, atau weekly';
  }

  const emailDest = data.email_destination?.trim() || userEmail || '';
  if ((channel === 'email' || channel === 'both') && !emailDest) {
    errors.email_destination = 'Alamat email tujuan wajib ditentukan';
  } else if (emailDest && !validateEmail(emailDest)) {
    errors.email_destination = 'Format email tujuan tidak valid';
  }

  const minSalary = Number(data.min_salary) || 0;
  if (minSalary < 0) {
    errors.min_salary = 'Gaji minimum tidak boleh negatif';
  }

  const title =
    data.title?.trim() ||
    `Pemberitahuan Lowongan ${data.category || 'Semua Kategori'} di ${data.city || 'Semua Kota'}`;

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    data: {
      title,
      category: data.category?.trim() || 'Semua',
      city: data.city?.trim() || 'Semua Kota',
      job_type: data.job_type?.trim() || 'Semua',
      workplace_type: data.workplace_type?.trim() || 'Semua',
      min_salary: minSalary,
      channel,
      frequency,
      email_destination: emailDest
    }
  };
}
