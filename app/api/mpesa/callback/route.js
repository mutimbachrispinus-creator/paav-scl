import { NextResponse } from 'next/server';
import { parseStkCallback } from '@/lib/mpesa';
import { kvRecordPayment, kvGet, query } from '@/lib/db';

/**
 * Resolve which tenant owns the Paybill shortcode that received the payment.
 * Scans all tenants' paav_paybill_accounts in the kv table for a matching shortcode.
 *
 * @param {string} shortcode  e.g. "400200"
 * @returns {Promise<string>}  The matching tenantId, or 'platform-master' as fallback
 */
async function resolveTenantByShortcode(shortcode) {
  if (!shortcode) return 'platform-master';

  try {
    // Fetch all rows with key = paav_paybill_accounts across ALL tenants
    const rows = await query(
      `SELECT tenant_id, value FROM kv WHERE key = 'paav_paybill_accounts'`,
      []
    );

    for (const row of rows) {
      let accounts = [];
      try { accounts = JSON.parse(row.value); } catch { continue; }

      const match = accounts.find(
        acc => String(acc.shortcode).trim() === String(shortcode).trim()
      );
      if (match) {
        console.log(`[M-Pesa Callback] Shortcode ${shortcode} → tenant: ${row.tenant_id}`);
        return row.tenant_id;
      }
    }

    console.warn(`[M-Pesa Callback] No tenant found for shortcode ${shortcode}, falling back to platform-master`);
    return 'platform-master';
  } catch (e) {
    console.error('[M-Pesa Callback] resolveTenantByShortcode error:', e);
    return 'platform-master';
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    console.log('M-Pesa Callback:', JSON.stringify(body, null, 2));

    const result = parseStkCallback(body);

    if (result.paid) {
      // accountRef was formatted as "ADM:TERM" (e.g. "101:T1")
      const [adm, term] = result.accountRef.split(':');

      // The Safaricom callback also tells us which Paybill was paid to
      const businessShortcode = String(
        body?.Body?.stkCallback?.BusinessShortCode || ''
      );

      // Resolve the correct school (tenant) from the shortcode
      const tenantId = await resolveTenantByShortcode(businessShortcode);

      await kvRecordPayment({
        adm:    adm,
        term:   term || 'T1',
        amount: result.amount,
        method: 'M-Pesa',
        ref:    result.mpesaCode,
        by:     'M-Pesa STK',
        status: 'approved'    // Auto-approve since Safaricom confirmed payment
      }, tenantId);

      console.log(`[M-Pesa Callback] Payment recorded: adm=${adm}, amount=${result.amount}, ref=${result.mpesaCode}, tenant=${tenantId}`);

      // Trigger email receipt silently
      try {
        const learners = await kvGet('paav6_learners', [], tenantId) || [];
        const l = learners.find(x => x.adm === adm);
        const feeCfg = await kvGet('paav6_feecfg', {}, tenantId) || {};
        const gradeCfg = feeCfg[l?.grade] || {};
        const annual = gradeCfg.annual || 5000;
        const paid = (l?.t1||0) + (l?.t2||0) + (l?.t3||0);
        const balance = annual - paid;

        if (l?.parentEmail) {
          fetch(`${req.nextUrl.origin}/api/email/receipt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              adm:     adm,
              amount:  result.amount,
              term:    term || 'T1',
              ref:     result.mpesaCode,
              balance: balance
            })
          }).catch(e => console.error('M-Pesa email trigger error:', e));
        }
      } catch (e) { console.error('M-Pesa post-payment actions error:', e); }
    }

    // Always respond 200 with ResultCode 0 — Safaricom retries on non-200
    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (error) {
    console.error('M-Pesa Callback Error:', error);
    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted with internal error' });
  }
}
