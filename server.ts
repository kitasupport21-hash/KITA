/**
 * KITA - Full Stack Application Server
 * Express entry point mounting API routes, auth middleware, and Vite development server
 */
import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { apiRouter } from './src/server/api.js';
import { authenticateToken } from './src/server/auth.js';
import { getDatabase } from './src/server/db/database.js';
import { googleAuthRouter } from './src/server/google-auth.js';
import { initScheduler } from './src/server/sync/scheduler.js';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;

async function createServer() {
  const app = express();

  app.disable('x-powered-by');
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    if (isProduction) res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
  });
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false, limit: '1mb' }));
  app.use(cookieParser());
  app.use(authenticateToken);

  // Initialize SQLite database
  await getDatabase();
  console.log('  KITA Relational Database loaded and ready');

  // Start automatic 6-hour job update scheduler
  initScheduler();

  // Lightweight per-IP protection for credential endpoints (no external dependency).
  const authAttempts = new Map<string, { count: number; resetAt: number }>();
  app.use('/api/auth', (req, res, next) => {
    if (req.method !== 'POST' || !['/login', '/register'].includes(req.path)) return next();
    const now = Date.now();
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const entry = authAttempts.get(ip);
    if (!entry || entry.resetAt <= now) {
      authAttempts.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 });
      return next();
    }
    if (entry.count >= 12) {
      res.setHeader('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)));
      res.status(429).json({ success: false, error: 'Terlalu banyak percobaan. Coba lagi beberapa menit.' });
      return;
    }
    entry.count += 1;
    next();
  });

  // Mount Google Sign-In and core API routers
  app.use('/api', googleAuthRouter);
  app.use('/api', apiRouter);

  // Static / Frontend serving
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Application build not found. Run npm run build.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`  KITA Server running at http://0.0.0.0:${PORT}`);
  });
}

createServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
