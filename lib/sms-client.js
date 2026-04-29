/**
 * lib/sms-client.js — Africa's Talking SMS integration
 *
 * The portal uses Africa's Talking as its primary SMS provider for:
 *   • Credential delivery (new staff / parent accounts)
 *   • Fee payment reminders
 *   • Bulk announcements to parents, teachers, or all contacts
 *   • Event alerts
 *
 * Credentials are stored in the DB under 'paav_at_creds' and may be
 * updated by admins via Settings → SMS.
 *
 * Environment fallback (for local/CI use):
 *   AT_USERNAME   — Africa's Talking username  (default: 'sandbox')
 *   AT_API_KEY    — Africa's Talking API key
 *   AT_SENDER_ID  — optional alphanumeric sender ID (e.g. 'PAAV')
 */

const AT_BASE_URL = 'https://api.africastalking.com/version1/messaging';
const AT_SANDBOX  = 'https://api.sandbox.africastalking.com/version1/messaging';

/**
 * Send one or more SMS messages via Africa's Talking.
 *
 * @param {object} opts
 * @param {string|string[]} opts.to       E.164 or local Kenyan numbers, e.g. '+2547...' or '07...'
 * @param {string}          opts.message  Message text (max 160 chars per segment)
 * @param {string}          [opts.username]   AT username (overrides env)
 * @param {string}          [opts.apiKey]     AT API key  (overrides env)
 * @param {string}          [opts.senderId]   Alphanumeric sender ID
 * @returns {Promise<{ success: boolean, data?: object, error?: string }>}
 */
export async function sendSMS({ to, message, username, apiKey, senderId }) {
  const user   = username  || process.env.AT_USERNAME  || 'sandbox';
  const key    = apiKey    || process.env.AT_API_KEY   || '';
  const sender = senderId  || process.env.AT_SENDER_ID || '';

  if (!key) {
    return { success: false, error: 'Africa\'s Talking API key not configured' };
  }

  const isSandbox = user === 'sandbox';
  const url = isSandbox ? AT_SANDBOX : AT_BASE_URL;

  // Normalise to array and format numbers for Kenya
  const recipients = (Array.isArray(to) ? to : [to])
    .map(n => normaliseKenyanNumber(n))
    .filter(Boolean)
    .join(',');

  if (!recipients) {
    return { success: false, error: 'No valid recipient numbers' };
  }

  const body = new URLSearchParams({ username: user, to: recipients, message });
  if (sender) body.set('from', sender);

  try {
    const res = await fetch(url, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/x-www-form-urlencoded',
        'apiKey':        key,
        'Accept':        'application/json',
      },
      body: body.toString(),
    });

    const json = await res.json();

    if (!res.ok) {
      return { success: false, error: json.errorMessage || `AT API error ${res.status}` };
    }

    // Check individual recipient statuses
    const recipients_data = json.SMSMessageData?.Recipients || [];
    const failed = recipients_data.filter(r => r.statusCode !== 101);

    return {
      success: true,
      data:    json.SMSMessageData,
      sentCount:   recipients_data.length - failed.length,
      failedCount: failed.length,
      failed:  failed.map(r => ({ number: r.number, status: r.status })),
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Send credentials to a newly created staff/parent account.
 *
 * @param {object} staff    { name, phone, username, password }
 * @param {object} [creds]  AT credentials { username, apiKey, senderId }
 */
export async function sendCredentialsSMS(staff, creds = {}) {
  const message =
    `PAAV-Gitombo School Portal\n` +
    `Welcome, ${staff.name}!\n` +
    `Username: ${staff.username}\n` +
    `Password: ${staff.password}\n` +
    `Login: portal.paavgitombo.ac.ke\n` +
    `"More Than Academics!"`;

  return sendSMS({ to: staff.phone, message, ...creds });
}

/**
 * Send a fee reminder to a parent.
 *
 * @param {object} opts { parentPhone, learnerName, balance, paybill, admNo }
 * @param {object} [creds]
 */
export async function sendFeeReminderSMS({ parentPhone, learnerName, balance, paybill, admNo }, creds = {}) {
  const message =
    `PAAV-Gitombo School\n` +
    `Fee Reminder: ${learnerName}\n` +
    `Balance: KSH ${Number(balance).toLocaleString()}\n` +
    (paybill
      ? `Pay via M-Pesa Paybill ${paybill}, Account: ${admNo}\n`
      : '') +
    `Call 0758 922 915 for queries.`;

  return sendSMS({ to: parentPhone, message, ...creds });
}

/**
 * Result notification template
 */
export function getResultNotificationMessage(learnerName, term, totalPts, maxPts) {
  return `PAAV-Gitombo School\n` +
         `Term ${term} results for ${learnerName} are out.\n` +
         `Performance: ${totalPts} / ${maxPts} points.\n` +
         `Log in to the school portal to view the full report card.\n` +
         `"More Than Academics!"`;
}

/**
 * Send a bulk SMS to many recipients.
 * AT supports up to 1,000 recipients per request.
 *
 * @param {string[]} phones   array of phone numbers
 * @param {string}   message
 * @param {object}   [creds]
 */
export async function sendBulkSMS(phones, message, creds = {}) {
  // Chunk into batches of 200 to stay within limits
  const CHUNK = 200;
  const results = [];
  for (let i = 0; i < phones.length; i += CHUNK) {
    const batch = phones.slice(i, i + CHUNK);
    const r = await sendSMS({ to: batch, message, ...creds });
    results.push(r);
  }
  const totalSent   = results.reduce((s, r) => s + (r.sentCount   || 0), 0);
  const totalFailed = results.reduce((s, r) => s + (r.failedCount || 0), 0);
  return { success: true, totalSent, totalFailed, batches: results.length };
}

/* ─── Helpers ───────────────────────────────────────────────────────────── */

/**
 * Normalise Kenyan mobile numbers to E.164 (+254...).
 * Accepts: 07xxxxxxxx, 7xxxxxxxx, +2547xxxxxxxx, 2547xxxxxxxx
 */
export function normaliseKenyanNumber(n) {
  if (!n) return null;
  const s = String(n).replace(/\s+/g, '').replace(/-/g, '');
  if (/^\+254[17]\d{8}$/.test(s)) return s;
  if (/^254[17]\d{8}$/.test(s))   return '+' + s;
  if (/^0[17]\d{8}$/.test(s))     return '+254' + s.slice(1);
  if (/^[17]\d{8}$/.test(s))      return '+254' + s;
  return null;  // unrecognised format — skip
}

/**
 * Estimate the number of SMS segments for a message.
 * GSM-7 charset: 160 chars/segment; multi-part: 153 chars/segment.
 */
export function smsSegments(message) {
  const len = (message || '').length;
  if (len <= 160) return 1;
  return Math.ceil(len / 153);
}

/**
 * Format an SMS log entry for storage in paav7_sms.
 */
export function smsLogEntry({ to, message, type = 'manual', status = 'sent', sentBy }) {
  return {
    id:      's' + Date.now(),
    date:    new Date().toISOString(),
    to,
    message,
    type,   // 'credentials' | 'fee_reminder' | 'bulk' | 'manual' | 'event'
    status, // 'sent' | 'failed' | 'pending'
    sentBy,
  };
}
