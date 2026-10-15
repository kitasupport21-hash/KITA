/**
 * KITA - Core API Router
 * Endpoints for Marketplace, Seekers, Employers, Admin Moderation, and Support
 */
import { Router } from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import multer, { type FileFilterCallback } from 'multer';
import bcrypt from 'bcryptjs';
import { getDatabase, saveDatabase, matchAndTriggerJobAlerts } from './db/database.js';
import { INDONESIA_38_PROVINCES } from './sync/locations_data.js';
import { executeSyncCycle } from './sync/scheduler.js';
import { dispatchApplicationEmail, getEmailEngineStatus } from './email/mailer.js';
import { generateToken, requireAuth, requireRole, type AuthenticatedRequest } from './auth.js';
import { validateRegistration, validateLogin, validateJobListing, validateApplication, validateJobAlertSubscription } from './validation.js';
import type { User, JobListing, JobApplication, JobAlertSubscription } from '../shared/types.js';

const RESUME_STORAGE_DIR = path.resolve(process.cwd(), 'data', 'private-resumes');
fs.mkdirSync(RESUME_STORAGE_DIR, { recursive: true });

const resumeUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, RESUME_STORAGE_DIR),
    filename: (_req, _file, cb) => cb(null, `${crypto.randomUUID()}.pdf`)
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb: FileFilterCallback) => {
    const isPdf = file.mimetype === 'application/pdf' && path.extname(file.originalname).toLowerCase() === '.pdf';
    cb(isPdf ? null : new Error('Hanya berkas CV PDF yang diperbolehkan.'), isPdf);
  }
});

const parseResumeUpload = (req: any, res: any, next: any) => {
  resumeUpload.single('resume')(req, res, (error: any) => {
    if (error) {
      res.status(400).json({ success: false, error: error.message || 'Unggahan CV gagal.' });
      return;
    }
    next();
  });
};

export const apiRouter = Router();

// Health check
apiRouter.get('/health', async (_req, res) => {
  try {