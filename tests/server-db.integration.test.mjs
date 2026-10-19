import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { Pool } from 'pg';

const databaseUrl = process.env.DATABASE_URL;

async function expectStatus(response, expected) {
  if (response.status !== expected) throw new Error(`Expected HTTP ${expected}, got ${response.status}: ${await response.text()}`);
}

test('PostgreSQL-backed signup, profile, jobs, saved roles, applications, notifications, and logout work end-to-end', { skip: !databaseUrl }, async () => {
  const pool = new Pool({ connectionString: databaseUrl });
  let server;
  let jobId = null;
  const email = `nova-integration-${process.pid}@example.test`;
  let baseUrl;
  try {
    await pool.query('select 1');
    const port = 20000 + (process.pid % 20000);
    baseUrl = `http://127.0.0.1:${port}`;
    server = spawn(process.execPath, ['server/index.mjs'], {
      cwd: process.cwd(),
      env: { ...process.env, PORT: String(port), DATABASE_URL: databaseUrl, FRONTEND_ORIGIN: 'http://localhost:5173', NODE_ENV: 'test' },
      stdio: 'ignore'
    });
    let ready = false;
    for (let attempt = 0; attempt < 100; attempt++) {
      if (server.exitCode !== null) throw new Error(`NOVA server exited before readiness (${server.exitCode})`);
      try {
        const response = await fetch(`${baseUrl}/api/health`);
        if (response.ok && (await response.json()).database === true) { ready = true; break; }
      } catch { /* server is starting */ }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (!ready) throw new Error('NOVA API did not become ready against PostgreSQL within 10 seconds');

    const origin = { origin: 'http://localhost:5173' };
    const jsonHeaders = { ...origin, 'content-type': 'application/json' };
    let cookie = '';
    const signup = await fetch(`${baseUrl}/api/auth/signup`, { method: 'POST', headers: jsonHeaders, body: JSON.stringify({ name: 'NOVA Integration', email, password: 'correct-horse-battery-staple' }) });
    await expectStatus(signup, 201);
    const signupPayload = await signup.json();
    assert.equal(signupPayload.profile.email, email);
    cookie = String(signup.headers.get('set-cookie') || '').split(';')[0];
    assert.match(cookie, /^nova_session=/);

    const authHeaders = { ...jsonHeaders, cookie };
    const me = await fetch(`${baseUrl}/api/auth/me`, { headers: { cookie } });
    assert.equal(me.status, 200);
    assert.equal((await me.json()).profile.email, email);

    const profileUpdate = await fetch(`${baseUrl}/api/profile`, { method: 'PATCH', headers: authHeaders, body: JSON.stringify({ skills: ['React', 'SQL'], preferredModes: ['Remote'], preferredProvinces: ['DKI Jakarta'], targetLevels: ['Junior'], minimumSalaryJt: 8 }) });
    await expectStatus(profileUpdate, 200);
    assert.deepEqual((await profileUpdate.json()).profile.skills, ['React', 'SQL']);

    const inserted = await pool.query(`insert into jobs(external_id,title,company,province,city,source_name,source_url,apply_url,status,posted_at) values($1,$2,$3,$4,$5,$6,$7,$8,'active',now()) returning id`, [email, 'Integration Warehouse Operator', 'PT NOVA Test', 'DKI Jakarta', 'Jakarta Selatan', 'nova-integration-test', 'https://jobs.example.test/roles/integration', 'https://jobs.example.test/apply/integration']);
    jobId = inserted.rows[0].id;
    const jobs = await fetch(`${baseUrl}/api/jobs?q=Integration%20Warehouse`, { headers: { accept: 'application/json' } });
    assert.equal(jobs.status, 200);
    assert.ok((await jobs.json()).jobs.some(job => job.id === jobId));

    const save = await fetch(`${baseUrl}/api/saved`, { method: 'POST', headers: authHeaders, body: JSON.stringify({ jobId }) });
    await expectStatus(save, 201);
    const saved = await fetch(`${baseUrl}/api/saved`, { headers: { cookie } });
    assert.ok((await saved.json()).jobs.some(job => job.id === jobId));

    const application = await fetch(`${baseUrl}/api/applications`, { method: 'POST', headers: authHeaders, body: JSON.stringify({ jobId, status: 'applied', notes: 'Integration test' }) });
    await expectStatus(application, 201);
    const applications = await fetch(`${baseUrl}/api/applications`, { headers: { cookie } });
    assert.ok((await applications.json()).applications.some(item => item.job_id === jobId));

    const notifications = await fetch(`${baseUrl}/api/notifications`, { headers: { cookie } });
    assert.equal(notifications.status, 200);
    assert.ok((await notifications.json()).unreadCount >= 1);

    const logout = await fetch(`${baseUrl}/api/auth/logout`, { method: 'POST', headers: authHeaders, body: '{}' });
    assert.equal(logout.status, 200);
    const afterLogout = await fetch(`${baseUrl}/api/auth/me`, { headers: { cookie } });
    assert.equal(afterLogout.status, 401);

    const login = await fetch(`${baseUrl}/api/auth/login`, { method: 'POST', headers: jsonHeaders, body: JSON.stringify({ email, password: 'correct-horse-battery-staple' }) });
    await expectStatus(login, 200);
    assert.equal((await login.json()).profile.email, email);
  } finally {
    await pool.query('delete from profiles where email=$1', [email]).catch(() => {});
    if (jobId) await pool.query('delete from jobs where id=$1', [jobId]).catch(() => {});
    if (server && server.exitCode === null) {
      server.kill('SIGTERM');
      await new Promise(resolve => server.once('exit', resolve));
    }
    await pool.end();
  }
});
