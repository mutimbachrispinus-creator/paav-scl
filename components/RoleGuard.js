'use client';
/**
 * components/RoleGuard.js — Protects routes / UI sections by role
 *
 * Usage:
 *   <RoleGuard allow={['admin','teacher']}>
 *     <SensitiveComponent />
 *   </RoleGuard>
 *
 * If the current user's role is not in `allow`, renders `fallback` (default: null).
 * When `redirect` is true, pushes to /dashboard instead of hiding.
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RoleGuard({
  allow       = [],        // e.g. ['admin', 'teacher']
  children,
  fallback    = null,      // what to render if not allowed
  redirect    = false,     // redirect to /dashboard instead of hiding
  loadingUI   = null,      // shown while session is being fetched
}) {
  const router  = useRouter();
  const [role,  setRole]  = useState(null);   // null = not yet loaded
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetch('/api/auth')
      .then(r => r.json())
      .then(data => {
        setRole(data?.user?.role || '');
        setReady(true);
      })
      .catch(() => { setRole(''); setReady(true); });
  }, []);

  if (!ready) return loadingUI;

  const allowed = allow.length === 0 || allow.includes(role);

  if (!allowed) {
    if (redirect) {
      router.push('/dashboard');
      return loadingUI;
    }
    return fallback;
  }

  return children;
}

/**
 * Convenience wrapper: only renders children for admins.
 */
export function AdminOnly({ children, fallback = null }) {
  return <RoleGuard allow={['admin']} fallback={fallback}>{children}</RoleGuard>;
}

/**
 * Convenience wrapper: renders for admin + teacher.
 */
export function TeacherAndAdmin({ children, fallback = null }) {
  return <RoleGuard allow={['admin','teacher']} fallback={fallback}>{children}</RoleGuard>;
}
