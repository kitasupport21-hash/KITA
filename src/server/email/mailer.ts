/**
 * KITA - Server-side application email delivery.
 *
 * Uses the Resend HTTP API when RESEND_API_KEY + EMAIL_FROM are configured.
 * No SMTP library is required, so the server remains lightweight.
 * If the provider is not configured, applications are still persisted locally
 * and the delivery log explicitly reports that no external message was sent.
 */
import crypto from 'node:crypto';
import type { Database as SqlJsDatabase } from 'sql.js';
import type { DeliveryStatus } from '../../shared/types.js';

interface ApplicationDeliveryPayload {
  applicationId: string;
  recipientEmail: string;
  companyName: string;
  jobTitle: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone?: string;
  coverLetter: string;
  resumeUrl: string;
  portfolioUrl?: string;
}

function getProviderConfig() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  const appUrl = process.env.APP_URL?.trim().replace(/\/$/, '');
  return {
    configured: Boolean(apiKey && from),
    apiKey,
    from,
    appUrl
  };
}

export function isSmtpConfigured(): boolean {
  return getProviderConfig().configured;
}

export function getEmailEngineStatus() {
  const config = getProviderConfig();
  return {
    isConfigured: config.configured,
    host: 'api.resend.com',
    port: 443,
    sender: config.from || null,
    mode: config.configured ? 'RESEND_HTTP' : 'AUDIT_LOG_ONLY',
    note: config.configured
      ? 'Email eksternal aktif melalui Resend HTTP API.'
      : 'Lamaran disimpan di database KITA. Isi RESEND_API_KEY dan EMAIL_FROM untuk mengaktifkan pengiriman email.'
  };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function buildEmailHtml(payload: ApplicationDeliveryPayload): string {
  const link = payload.resumeUrl
    ? `<p><a href="${escapeHtml(payload.resumeUrl)}">Lihat CV pelamar</a></p>`
    : '';
  const portfolio = payload.portfolioUrl
    ? `<p><a href="${escapeHtml(payload.portfolioUrl)}">Portofolio</a></p>`
    : '';
  return `<!doctype html><html><body style="font-family:Arial,sans-serif;line-height:1.6;color:#222">
    <h2>Lamaran untuk ${escapeHtml(payload.jobTitle)}</h2>
    <p>Halo tim ${escapeHtml(payload.companyName)},</p>
    <p>${escapeHtml(payload.applicantName)} mengirim lamaran melalui KITA.</p>
    <p><strong>Email:</strong> ${escapeHtml(payload.applicantEmail)}<br/>
    <strong>Telepon:</strong> ${escapeHtml(payload.applicantPhone || '-')}</p>
    <h3>Cover letter</h3><p>${escapeHtml(payload.coverLetter).replaceAll('\n', '<br/>')}</p>
    ${link}${portfolio}
    <p style="color:#666;font-size:12px">Application ID: ${escapeHtml(payload.applicationId)}</p>
  </body></html>`;
}

export async function dispatchApplicationEmail(
  db: SqlJsDatabase,
  payload: ApplicationDeliveryPayload
): Promise<{
  success: boolean;
  status: DeliveryStatus;
  logId: string;
  errorMessage?: string;
}> {
  const logId = `elog-${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  const subject = `[Lamaran Kerja KITA] ${payload.jobTitle} - ${payload.applicantName}`;
  const config = getProviderConfig();

  if (!config.configured) {
    const reasonMsg = 'Email eksternal tidak dikirim karena provider belum dikonfigurasi.';
    db.run(
      `INSERT INTO email_delivery_logs (id, application_id, recipient_email, subject, status, provider, error_message, sent_at, attempts)
       VALUES (?, ?, ?, ?, 'RECORDED', 'KITA_INTERNAL_LOGGER', ?, ?, 1)`,
      [logId, payload.applicationId, payload.recipientEmail, subject, reasonMsg, now]
    );
    return { success: true, status: 'SUBMITTED_LOCAL', logId, errorMessage: reasonMsg };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: config.from,
        to: [payload.recipientEmail],
        reply_to: payload.applicantEmail || undefined,
        subject,
        html: buildEmailHtml(payload),
        text: [
          `Lamaran untuk ${payload.jobTitle}`,
          `Pelamar: ${payload.applicantName}`,
          `Email: ${payload.applicantEmail}`,
          `Telepon: ${payload.applicantPhone || '-'}`,
          '',
          payload.coverLetter,
          '',
          `CV: ${payload.resumeUrl || '-'}`,
          `Portofolio: ${payload.portfolioUrl || '-'}`
        ].join('\n')
      }),
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      const detail = (await response.text()).slice(0, 1000);
      throw new Error(`Resend HTTP ${response.status}: ${detail}`);
    }

    db.run(
      `INSERT INTO email_delivery_logs (id, application_id, recipient_email, subject, status, provider, error_message, sent_at, attempts)
       VALUES (?, ?, ?, ?, 'SENT', 'RESEND', NULL, ?, 1)`,
      [logId, payload.applicationId, payload.recipientEmail, subject, now]
    );

    return { success: true, status: 'DELIVERY_CONFIRMED', logId };
  } catch (error: any) {
    const message = error?.message || 'Pengiriman email gagal.';
    db.run(
      `INSERT INTO email_delivery_logs (id, application_id, recipient_email, subject, status, provider, error_message, sent_at, attempts)
       VALUES (?, ?, ?, ?, 'FAILED', 'RESEND', ?, ?, 1)`,
      [logId, payload.applicationId, payload.recipientEmail, subject, message, now]
    );
    return { success: false, status: 'DELIVERY_FAILED', logId, errorMessage: message };
  }
}
