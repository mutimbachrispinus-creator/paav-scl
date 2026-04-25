'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function TemplatesPage() {
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

  if (loading) return <div className="page on"><p>Loading templates...</p></div>;

  return (
    <div className="page on">
      <div className="page-hdr">
        <div>
          <h2>📄 Report Templates</h2>
          <p>Customize and preview report card designs</p>
        </div>
      </div>
      
      <div className="panel" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontSize: 48, marginBottom: 20 }}>🚧</div>
        <h3>Templates Module</h3>
        <p style={{ opacity: 0.7, maxWidth: 400, margin: '10px auto' }}>
          This module is being restored to match the modernized UI. 
          Soon you will be able to manage Termly Reports, Merit Lists, and Fee Statements templates here.
        </p>
        <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => router.push('/dashboard')}>
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
