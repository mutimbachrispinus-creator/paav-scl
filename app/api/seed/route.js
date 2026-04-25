import { NextResponse } from 'next/server';
import { kvGet, kvSet } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function GET() {
  try {
    const staff = (await kvGet('paav6_staff')) || [];
    
    // Check if admin already exists
    if (staff.find(s => s.username === 'admin')) {
      return NextResponse.json({ message: 'Admin user already exists', count: staff.length });
    }

    // Create default admin
    const defaultAdmin = {
      id: 'admin_' + Date.now(),
      name: 'SYSTEM ADMIN',
      role: 'admin',
      phone: '0000000000',
      username: 'admin',
      password: await hashPassword('admin123'), // Default password
      status: 'active',
      childAdm: '',
      grade: '',
      teachingAreas: [],
      secQ: '',
      secA: '',
      createdAt: new Date().toISOString(),
    };

    staff.push(defaultAdmin);
    await kvSet('paav6_staff', staff);

    return NextResponse.json({ 
      message: 'Admin user created successfully!', 
      username: 'admin',
      password: 'admin123',
      note: 'Please login and change your password immediately.'
    });

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
