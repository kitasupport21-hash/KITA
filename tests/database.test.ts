import { describe, it, expect, beforeAll } from 'vitest';
import initSqlJs, { Database } from 'sql.js';

describe('Relational SQLite Database & Constraint Tests', () => {
  let db: Database;

  beforeAll(async () => {
    const SQL = await initSqlJs();
    db = new SQL.Database();
    db.run('PRAGMA foreign_keys = ON;');
    db.run(`
      CREATE TABLE users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE TABLE job_listings (
        id TEXT PRIMARY KEY,
        employer_id TEXT NOT NULL,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        city TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (employer_id) REFERENCES users(id)
      );
      CREATE TABLE job_applications (
        id TEXT PRIMARY KEY,
        job_id TEXT NOT NULL,
        seeker_id TEXT NOT NULL,
        cover_letter TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (job_id) REFERENCES job_listings(id),
        FOREIGN KEY (seeker_id) REFERENCES users(id),
        UNIQUE(job_id, seeker_id)
      );
    `);
  });

  it('inserts users and jobs with relational integrity', () => {
    db.run(`INSERT INTO users VALUES ('u1', 'emp@kita.id', 'hash', 'UMKM Budi', 'employer', '2026-01-01')`);
    db.run(`INSERT INTO users VALUES ('u2', 'seeker@kita.id', 'hash', 'Pelamar Sari', 'seeker', '2026-01-01')`);
    db.run(`INSERT INTO job_listings VALUES ('j1', 'u1', 'Barista Kopi', 'F&B', 'Bandung', 'published', '2026-01-01')`);

    const res = db.exec(`SELECT title FROM job_listings WHERE employer_id = 'u1'`);
    expect(res[0].values[0][0]).toBe('Barista Kopi');
  });

  it('strictly enforces unique application constraint (no duplicates)', () => {
    db.run(`INSERT INTO job_applications VALUES ('app1', 'j1', 'u2', 'Saya berminat', 'submitted', '2026-01-01')`);
    const count = db.exec(`SELECT COUNT(*) FROM job_applications`)[0].values[0][0];
    expect(count).toBe(1);

    // Second application with same job_id and seeker_id must throw UNIQUE constraint error
    expect(() => {
      db.run(`INSERT INTO job_applications VALUES ('app2', 'j1', 'u2', 'Saya coba lagi', 'submitted', '2026-01-02')`);
    }).toThrow();
  });
});
