import { pathToFileURL } from 'node:url';
import path from 'node:path';

const SYNC_PATH = '/api/admin/jobs/sync';

export async function runJobSync({ env = process.env, fetchImpl = fetch } = {}) {
  const rawUrl = String(env.NOVA_SYNC_API_URL || '').trim();
  const secret = String(env.NOVA_SYNC_SECRET || '');
  if (!rawUrl) throw new Error('NOVA_SYNC_API_URL is required');
  if (!secret) throw new Error('NOVA_SYNC_SECRET is required');

  let endpoint;
  try { endpoint = new URL(rawUrl); } catch { throw new Error('NOVA_SYNC_API_URL must be a valid URL'); }
  const localHttp = endpoint.protocol === 'http:' && ['localhost', '127.0.0.1', '::1'].includes(endpoint.hostname);
  if (endpoint.protocol !== 'https:' && !localHttp) throw new Error('NOVA_SYNC_API_URL must use HTTPS outside localhost');
  if (endpoint.username || endpoint.password || endpoint.pathname !== SYNC_PATH || endpoint.search || endpoint.hash) {
    throw new Error(`NOVA_SYNC_API_URL must point exactly to ${SYNC_PATH}`);
  }

  const response = await fetchImpl(endpoint, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'x-nova-sync-secret': secret,
    },
    body: '{}',
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error(`job_sync_failed_http_${response.status}`);
  let result;
  try { result = await response.json(); } catch { throw new Error('job_sync_returned_invalid_json'); }
  if (!result || result.ok !== true || !Number.isInteger(result.imported) || !Number.isInteger(result.skipped)) {
    throw new Error('job_sync_returned_unexpected_result');
  }
  return {
    ok: true,
    received: Number.isInteger(result.received) ? result.received : null,
    imported: result.imported,
    skipped: result.skipped,
    source: typeof result.source === 'string' ? result.source : 'unknown',
  };
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (invokedPath && import.meta.url === pathToFileURL(invokedPath).href) {
  runJobSync()
    .then((result) => console.log(JSON.stringify(result)))
    .catch((error) => {
      console.error(error instanceof Error ? error.message : 'job_sync_failed');
      process.exitCode = 1;
    });
}
