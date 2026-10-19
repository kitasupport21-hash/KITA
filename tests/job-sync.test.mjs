import test from 'node:test';
import assert from 'node:assert/strict';
import { runJobSync } from '../scripts/sync-jobs.mjs';

const env = {
  NOVA_SYNC_API_URL: 'https://nova.example/api/admin/jobs/sync',
  NOVA_SYNC_SECRET: 'test-secret-never-logged',
};

test('scheduled sync sends secret only in header and returns safe import counts', async () => {
  let captured;
  const result = await runJobSync({
    env,
    fetchImpl: async (url, options) => {
      captured = { url: String(url), options };
      return { ok: true, json: async () => ({ ok: true, received: 12, imported: 9, skipped: 3, source: 'partner.example' }) };
    },
  });
  assert.equal(captured.url, env.NOVA_SYNC_API_URL);
  assert.equal(captured.options.method, 'POST');
  assert.equal(captured.options.headers['x-nova-sync-secret'], env.NOVA_SYNC_SECRET);
  assert.equal(captured.options.body, '{}');
  assert.deepEqual(result, { ok: true, received: 12, imported: 9, skipped: 3, source: 'partner.example' });
  assert.equal(JSON.stringify(result).includes(env.NOVA_SYNC_SECRET), false);
});

test('scheduled sync refuses missing secrets and non-HTTPS remote URLs', async () => {
  await assert.rejects(() => runJobSync({ env: { ...env, NOVA_SYNC_SECRET: '' } }), /NOVA_SYNC_SECRET is required/);
  await assert.rejects(() => runJobSync({ env: { ...env, NOVA_SYNC_API_URL: 'http://nova.example/api/admin/jobs/sync' } }), /must use HTTPS/);
});

test('scheduled sync only accepts the exact sync endpoint and successful result shape', async () => {
  await assert.rejects(() => runJobSync({ env: { ...env, NOVA_SYNC_API_URL: 'https://nova.example/api/health' } }), /must point exactly/);
  await assert.rejects(() => runJobSync({ env, fetchImpl: async () => ({ ok: false, status: 503 }) }), /job_sync_failed_http_503/);
  await assert.rejects(() => runJobSync({ env, fetchImpl: async () => ({ ok: true, json: async () => ({ ok: false }) }) }), /unexpected_result/);
});
