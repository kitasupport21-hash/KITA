import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';

let server;
let baseUrl;

before(async () => {
  const port = 19000 + (process.pid % 1000);
  baseUrl = `http://127.0.0.1:${port}`;
  server = spawn(process.execPath, ['server/index.mjs'], {
    env: { ...process.env, PORT: String(port), DATABASE_URL: '', NODE_ENV: 'test' },
    stdio: 'ignore'
  });
  let ready = false;
  for (let i = 0; i < 50; i++) {
    if (server.exitCode !== null) throw new Error(`Server exited before starting (${server.exitCode})`);
    try {
      const response = await fetch(baseUrl);
      if (response.ok) { ready = true; break; }
    } catch { /* server is still starting */ }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  if (!ready) throw new Error('Server did not become ready within 5 seconds');
});

after(() => { if (server && server.exitCode === null) server.kill('SIGTERM'); });

test('production server serves the built NOVA frontend', async () => {
  const response = await fetch(baseUrl);
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(html, /NOVA — Intelligent Career Platform/);
  const asset = html.match(/src="([^"]+\.js)"/);
  assert.ok(asset, 'built JavaScript bundle is referenced');
  const assetResponse = await fetch(new URL(asset[1], baseUrl));
  assert.equal(assetResponse.status, 200);
  assert.match(assetResponse.headers.get('content-type') || '', /javascript/);
});

test('client-side routes fall back to the app shell', async () => {
  const response = await fetch(`${baseUrl}/applications`);
  assert.equal(response.status, 200);
  assert.match(await response.text(), /id="root"/);
});

test('API fails closed with a useful 503 when database configuration is absent', async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { error: 'DATABASE_URL is not configured' });
});

test('unsafe API requests reject untrusted browser origins before database access', async () => {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST', headers: { origin: 'https://attacker.example', 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'nobody@example.id', password: 'not-a-real-password' })
  });
  assert.equal(response.status, 403);
  assert.deepEqual(await response.json(), { error: 'origin_not_allowed' });
});

test('cookie-authenticated mutations require an Origin header', async () => {
  const response = await fetch(`${baseUrl}/api/auth/logout`, {
    method: 'POST', headers: { cookie: 'nova_session=deadbeef', 'content-type': 'application/json' }, body: '{}'
  });
  assert.equal(response.status, 403);
  assert.deepEqual(await response.json(), { error: 'origin_not_allowed' });
});

test('preflight requests return credentialed CORS policy', async () => {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'OPTIONS', headers: { origin: 'http://localhost:5173', 'access-control-request-method': 'POST' }
  });
  assert.equal(response.status, 204);
  assert.equal(response.headers.get('access-control-allow-origin'), 'http://localhost:5173');
  assert.equal(response.headers.get('access-control-allow-credentials'), 'true');
});
