import { describe, it, expect } from 'vitest';
import bcrypt from 'bcryptjs';
import { generateToken, verifyToken } from '../src/server/auth.js';
import type { User } from '../src/shared/types.js';

describe('Auth & Cryptographic Signature Tests', () => {
  const dummyUser: User = {
    id: 'test-user-123',
    email: 'test@kita.id',
    full_name: 'Dewi Lestari',
    role: 'seeker',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  it('correctly generates and verifies signed tokens', () => {
    const token = generateToken(dummyUser);
    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(3);

    const verified = verifyToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.userId).toBe(dummyUser.id);
    expect(verified?.email).toBe(dummyUser.email);
    expect(verified?.role).toBe('seeker');
  });

  it('rejects tampered tokens', () => {
    const token = generateToken(dummyUser);
    const tampered = token.slice(0, -4) + 'abcd';
    const verified = verifyToken(tampered);
    expect(verified).toBeNull();
  });

  it('hashes and compares passwords securely with bcrypt', async () => {
    const plainPassword = 'passwordRahasia123!';
    const hash = await bcrypt.hash(plainPassword, 10);
    expect(hash).not.toBe(plainPassword);

    const match = await bcrypt.compare(plainPassword, hash);
    expect(match).toBe(true);

    const wrongMatch = await bcrypt.compare('wrongPassword', hash);
    expect(wrongMatch).toBe(false);
  });
});
