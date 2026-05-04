import { NextResponse } from 'next/server';
import { kvGet, PAAV_KEYS } from '@/lib/db';
import { uploadBackup } from '@/lib/storage';

export async function GET(req) {
  // Simple auth check (e.g. CRON_SECRET)
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('Starting automated backup...');
    const snapshot = {};

    // Fetch all keys defined in PAAV_KEYS
    for (const key of PAAV_KEYS) {
      try {
        const val = await kvGet(key);
        snapshot[key] = val;
      } catch (e) {
        console.error(`Backup failed for key ${key}:`, e);
      }
    }

    const filename = `paav_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const content = JSON.stringify(snapshot, null, 2);

    const result = await uploadBackup(filename, content);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    console.log(`Backup successful: ${filename}`);
    return NextResponse.json({ success: true, filename });
  } catch (err) {
    console.error('Backup API error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
