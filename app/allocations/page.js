'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AllocationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      const res = await fetch('/api/auth');
      const data = await res.json();
      if (!data.ok) { router.push('/'); return; }
      setLoading(false);
    }
    checkAuth();
  }, [router]);

  if (loading) return <div className="page on"><p>Loading allocations...</p></div>;

  return (
    <div className="page on">
      <div className="page-hdr">
        <div>
          <h2>🖇 Subject Allocations</h2>
          <p>Assign teachers to specific subjects and grades</p>
        </div>
      </div>
      
      <div className="panel" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontSize: 48, marginBottom: 20 }}>🚧</div>
        <h3>Allocations Module</h3>
        <p style={{ opacity: 0.7, maxWidth: 400, margin: '10px auto' }}>
          Restoring the subject allocation interface. 
          Admins will be able to manage teaching workloads and class assignments in this section.
        </p>
        <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => router.push('/dashboard')}>
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
