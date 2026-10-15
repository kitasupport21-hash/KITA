/**
 * KITA - Authentication & Authorization Engine
 * Secure Token generation, verification, and RBAC middleware
 */
import crypto from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import type { User, UserRole } from '../shared/types.js';

const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'local-development-only-change-me-before-deploying');
if (process.env.NODE_ENV === 'production' && JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be configured with at least 32 characters in production.');
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  exp: number;
}

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

/**
 * Generate a cryptographically signed HMAC-SHA256 bearer token
 */
export function generateToken(user: User): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60 // 7 days validity
  };

  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const data = `${encodedHeader}.${encodedPayload}`;

  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(data)
    .digest('base64url');

  return `${data}.${signature}`;
}

/**
 * Verify token and return decoded payload if valid and not expired
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, signature] = parts;
    const data = `${encodedHeader}.${encodedPayload}`;

    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(data)
      .digest('base64url');

    const supplied = Buffer.from(signature, 'utf8');
    const expected = Buffer.from(expectedSignature, 'utf8');
    if (supplied.length !== expected.length || !crypto.timingSafeEqual(supplied, expected)) {
      return null;
    }

    const header = JSON.parse(Buffer.from(encodedHeader, 'base64url').toString('utf-8'));
    if (header?.alg !== 'HS256' || header?.typ !== 'JWT') return null;

    const payloadText = Buffer.from(encodedPayload, 'base64url').toString('utf-8');
    const payload: TokenPayload = JSON.parse(payloadText);
    if (typeof payload.userId !== 'string' || typeof payload.email !== 'string' || !['seeker', 'employer', 'admin'].includes(payload.role) || typeof payload.exp !== 'number') return null;

    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Express middleware to attach authenticated user to request
 */
export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const cookieToken = req.cookies?.kita_token;

  let token: string | undefined;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (cookieToken) {
    token = cookieToken;
  }

  if (token) {
    const decoded = verifyToken(token);
    if (decoded) {
      req.user = decoded;
    }
  }

  next();
}

/**
 * Strict gatekeeper: requires user to be logged in
 */
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Autentikasi diperlukan. Silakan masuk terlebih dahulu.'
    });
    return;
  }
  next();
}

/**
 * Strict role gatekeeper
 */
export function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Sesi tidak ditemukan. Silakan masuk.'
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: `Akses ditolak. Fitur ini memerlukan peran: ${allowedRoles.join(', ')}.`
      });
      return;
    }

    next();
  };
}
