import { describe, it, expect } from 'vitest';
import {
  validateEmail,
  validateRegistration,
  validateLogin,
  validateJobListing,
  validateApplication
} from '../src/server/validation.js';

describe('Validation Logic Tests', () => {
  it('validates email addresses properly', () => {
    expect(validateEmail('user@kita.id')).toBe(true);
    expect(validateEmail('invalid-email')).toBe(false);
    expect(validateEmail('test@')).toBe(false);
  });

  it('validates user registration payload', () => {
    const validSeeker = {
      email: 'pencari@example.com',
      password: 'password123',
      full_name: 'Budi Santoso',
      role: 'seeker'
    };
    const res = validateRegistration(validSeeker);
    expect(res.isValid).toBe(true);
    expect(res.data?.role).toBe('seeker');

    const invalidRole = {
      ...validSeeker,
      role: 'superman'
    };
    const invalidRes = validateRegistration(invalidRole);
    expect(invalidRes.isValid).toBe(false);
    expect(invalidRes.errors.role).toBeDefined();

    const adminAttempt = validateRegistration({ ...validSeeker, role: 'admin' });
    expect(adminAttempt.isValid).toBe(false);
    expect(adminAttempt.errors.role).toBeDefined();

    const weakPassword = validateRegistration({ ...validSeeker, password: 'short' });
    expect(weakPassword.isValid).toBe(false);
    expect(weakPassword.errors.password).toBeDefined();
  });

  it('validates login credentials', () => {
    const valid = validateLogin({ email: 'user@kita.id', password: 'secretpassword' });
    expect(valid.isValid).toBe(true);

    const emptyPw = validateLogin({ email: 'user@kita.id', password: '' });
    expect(emptyPw.isValid).toBe(false);
    expect(emptyPw.errors.password).toBeDefined();
  });

  it('validates job listings requirements and salary bounds', () => {
    const invalidSalary = {
      title: 'Staf Barista',
      category: 'F&B',
      job_type: 'fulltime',
      workplace_type: 'onsite',
      city: 'Bandung',
      min_salary: 5000000,
      max_salary: 3000000, // max < min
      description: 'Dibutuhkan barista berpengalaman untuk kedai kopi artisan'
    };
    const res = validateJobListing(invalidSalary);
    expect(res.isValid).toBe(false);
    expect(res.errors.salary).toBeDefined();

    const validJob = {
      ...invalidSalary,
      min_salary: 3000000,
      max_salary: 4500000
    };
    const validRes = validateJobListing(validJob);
    expect(validRes.isValid).toBe(true);
  });

  it('validates job application payload', () => {
    const valid = validateApplication({
      job_id: 'job-1',
      resume_url: '/api/resumes/123e4567-e89b-12d3-a456-426614174000',
      cover_letter: 'Saya tertarik dengan lowongan pekerjaan barista ini dan siap bergabung segera.'
    });
    expect(valid.isValid).toBe(true);

    const tooShort = validateApplication({
      job_id: 'job-1',
      resume_url: '/api/resumes/123e4567-e89b-12d3-a456-426614174000',
      cover_letter: 'Hai'
    });
    expect(tooShort.isValid).toBe(false);
    expect(tooShort.errors.cover_letter).toBeDefined();

    const missingResume = validateApplication({
      job_id: 'job-1',
      cover_letter: 'Saya tertarik dan siap melamar posisi ini.'
    });
    expect(missingResume.isValid).toBe(false);
    expect(missingResume.errors.resume_url).toBeDefined();
  });
});
