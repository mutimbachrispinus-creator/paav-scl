import { NextResponse } from 'next/server';
import { parseStkCallback } from '@/lib/mpesa';
import { kvRecordPayment, kvGet, kvSet, query } from '@/lib/db';

/**
 * Resolve which tenant owns a given Paybill shortcode.
 * Used as a fallback when CheckoutRequestID lookup fails.
 */
async function resolveTenantByShortcode(shortcode) {
  if (!shortcode) return 'platform-master';
  try {
    const rows = await query(
      `SELECT tenant_id, value FROM kv WHERE key = 'paav_paybill_accounts'`,
      []
    );
    for (const row of rows) {
      let accounts = [];
      try { accounts = JSON.parse(row.value); } catch { continue; }
      const match = accounts.find(acc => String(acc.shortcode).trim() === String(shortcode).trim());
      if (match) return row.tenant_id;
    }
  } catch (e) {
    console.error('[M-Pesa Callback] resolveTenantByShortcode error:', e);
  }
  console.warn(`[M-Pesa Callback] No tenant found for shortcode ${shortcode}, falling back to platform-master`);
  return 'platform-master';
}

export async function POST(req) {
  try {
    const body = await req.json();
    console.log('[M-Pesa Callback]', JSON.stringify(body, null, 2));

    const result = parseStkCallback(body);

    if (result.paid) {
      const checkoutRequestId = body?.Body?.stkCallback?.CheckoutRequestID;
      const businessShortcode  = String(body?.Body?.stkCallback?.BusinessShortCode || '');

      let adm, term, tenantId, pendingKey;

      // ── Strategy 1: Look up the pending payment record by CheckoutRequestID ──
      // This is the primary method and works for admission numbers of ANY length.
      if (checkoutRequestId) {
        // The pending record is stored in the tenant who initiated the STK push.
        // We find it by scanning all tenants' paav_mpesa_pending entries.
        try {
          const rows = await query(
            `SELECT tenant_id, value FROM kv WHERE key = 'paav_mpesa_pending'`,
            []
          );
          for (const row of rows) {
            let pending = {};
            try { pending = JSON.parse(row.value); } catch { continue; }
            if (pending[checkoutRequestId]) {
              const rec = pending[checkoutRequestId];
              adm      = rec.adm;
              term     = rec.term;
              tenantId = rec.tenantId || row.tenant_id;
              pendingKey = { tenantId: row.tenant_id, pending };
              console.log(`[M-Pesa Callback] Resolved via CheckoutRequestID: adm=${adm}, term=${term}, tenant=${tenantId}`);
              break;
            }
          }
        } catch (e) {
          console.error('[M-Pesa Callback] Pending lookup error:', e);
        }
      }

      // ── Strategy 2: Fallback — parse AccountReference + resolve by shortcode ──
      // Handles cases where STK push was initiated outside the portal (e.g. manual USSD).
      if (!adm) {
        const parts = String(result.accountRef || '').split(':');
        adm      = parts[0]?.trim() || result.accountRef;
        term     = parts[1]?.trim() || 'T1';
        tenantId = await resolveTenantByShortcode(businessShortcode);
        console.log(`[M-Pesa Callback] Resolved via shortcode fallback: adm=${adm}, term=${term}, tenant=${tenantId}`);
      }

      // Record the payment in the correct school's database
      await kvRecordPayment({
        adm,
        term:   term,
        amount: result.amount,
        method: 'M-Pesa',
        ref:    result.mpesaCode,
        by:     'M-Pesa STK',
        status: 'approved'   // Safaricom confirmed payment, auto-approve
      }, tenantId);

      console.log(`[M-Pesa Callback] ✅ Payment recorded: adm=${adm}, amount=${result.amount}, ref=${result.mpesaCode}, tenant=${tenantId}`);

      // Fire notification to admin
      try {
        await fetch(`${req.nextUrl.origin}/api/notifications`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'create',
            tenantId,
            to: 'admin',
            title: `M-Pesa Payment Received`,
            message: `Adm: ${adm} • KES ${result.amount.toLocaleString()} • Ref: ${result.mpesaCode}`,
            icon: '💰', type: 'payment', link: '/fees'
          })
        });
      } catch(e) { console.error('[Notification] Failed:', e); }
      // Clean up the pending record
      if (pendingKey) {
        try {
          delete pendingKey.pending[checkoutRequestId];
          await kvSet('paav_mpesa_pending', pendingKey.pending, pendingKey.tenantId);
        } catch (e) { console.error('[M-Pesa Callback] Cleanup error:', e); }
      }

      // Trigger email receipt silently
      try {
        const learners = await kvGet('paav6_learners', [], tenantId) || [];
        const l = learners.find(x => x.adm === adm);
        const feeCfg = await kvGet('paav6_feecfg', {}, tenantId) || {};
        const annual = feeCfg[l?.grade]?.annual || 5000;
        const paid   = (l?.t1||0) + (l?.t2||0) + (l?.t3||0);
        const balance = annual - paid;
        if (l?.parentEmail) {
          fetch(`${req.nextUrl.origin}/api/email/receipt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ adm, amount: result.amount, term, ref: result.mpesaCode, balance })
          }).catch(e => console.error('[M-Pesa Callback] Email trigger error:', e));
        }
      } catch (e) { console.error('[M-Pesa Callback] Post-payment actions error:', e); }
    }

    // Always return 200 with ResultCode 0 — Safaricom retries on non-200
    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (error) {
    console.error('[M-Pesa Callback] Fatal error:', error);
    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted with internal error' });
  }
}
