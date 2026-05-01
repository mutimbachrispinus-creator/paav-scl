/**
 * lib/audit.js — Centralized audit logging utility
 * Logs critical system actions to 'paav_audit_logs'
 */
import { getCachedUser } from './client-cache';

export async function logAction(action, details) {
  try {
    const user = await getCachedUser();
    const logEntry = {
      id: Date.now() + Math.random().toString(36).substring(7),
      time: new Date().toISOString(),
      user: user?.username || 'system',
      role: user?.role || 'system',
      action,
      details: typeof details === 'string' ? details : JSON.stringify(details)
    };

    // Get current logs
    const res = await fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests: [{ type: 'get', key: 'paav_audit_logs' }] })
    });
    const db = await res.json();
    const logs = db.results?.[0]?.value || [];
    
    // Prepend new log and keep last 1000
    const updated = [logEntry, ...logs].slice(0, 1000);

    await fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests: [{ type: 'set', key: 'paav_audit_logs', value: updated }] })
    });
  } catch (e) {
    console.error('[Audit] Failed to log action:', e);
  }
}
