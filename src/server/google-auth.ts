import { Router } from 'express';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { getDatabase, saveDatabase } from './db/database.js';
import { generateToken } from './auth.js';
import type { User } from '../shared/types.js';

const router = Router();
const googleClient = new OAuth2Client();

router.post('/auth/google', async (req, res) => {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const credential = typeof req.body?.credential === 'string' ? req.body.credential : '';

    if (!clientId) {
      res.status(503).json({ success: false, error: 'Google Login belum dikonfigurasi di server.' });
      return;
    }
    if (!credential) {
      res.status(400).json({ success: false, error: 'Google credential tidak ditemukan.' });
      return;
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: clientId
    });
    const payload = ticket.getPayload();

    if (!payload?.sub || !payload.email || payload.email_verified !== true) {
      res.status(401).json({ success: false, error: 'Akun Google tidak dapat diverifikasi.' });
      return;
    }

    const email = payload.email.trim().toLowerCase();
    const fullName = (payload.name || email.split('@')[0] || 'Pengguna KITA').trim().slice(0, 120);
    const avatarUrl = typeof payload.picture === 'string' ? payload.picture : undefined;
    const db = await getDatabase();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      SELECT id, email, full_name, role, phone, city, avatar_url, bio, created_at, updated_at
      FROM users WHERE email = :email
    `);
    stmt.bind({ ':email': email });

    let user: User;
    if (stmt.step()) {
      const row = stmt.getAsObject() as any;
      stmt.free();
      user = {
        id: row.id,
        email: row.email,
        full_name: row.full_name,
        role: row.role,
        phone: row.phone || undefined,
        city: row.city || undefined,
        avatar_url: row.avatar_url || avatarUrl,
        bio: row.bio || undefined,
        created_at: row.created_at,
        updated_at: row.updated_at
      };
      if (!row.avatar_url && avatarUrl) {
        db.run('UPDATE users SET avatar_url = ?, updated_at = ? WHERE id = ?', [avatarUrl, now, row.id]);
        user.avatar_url = avatarUrl;
        user.updated_at = now;
        saveDatabase(db);
      }
    } else {
      stmt.free();
      const userId = `user-${crypto.randomUUID()}`;
      const passwordHash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);
      db.run(
        `INSERT INTO users (id, email, password_hash, full_name, role, phone, city, avatar_url, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'seeker', NULL, 'Jakarta', ?, ?, ?)`,
        [userId, email, passwordHash, fullName, avatarUrl || null, now, now]
      );
      user = {
        id: userId,
        email,
        full_name: fullName,
        role: 'seeker',
        city: 'Jakarta',
        avatar_url: avatarUrl,
        created_at: now,
        updated_at: now
      };
      saveDatabase(db);
    }

    const token = generateToken(user);
    res.cookie('kita_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({ success: true, data: { user, token } });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(401).json({ success: false, error: 'Google Login gagal. Silakan coba lagi.' });
  }
});

export { router as googleAuthRouter };
