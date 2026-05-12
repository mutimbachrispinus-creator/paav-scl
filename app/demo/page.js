'use client';
export const runtime = 'edge';
import Link from 'next/link';

const ROLES = [
  {
    id: 'teacher',
    emoji: '👩‍🏫',
    title: 'Teacher Demo',
    subtitle: 'Mark Books · Attendance · Analytics',
    desc: "Experience the digital classroom from a teacher's perspective — enter marks, take attendance, view merit lists, and print professional report cards instantly.",
    gradient: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
    features: ['Digital Mark Entry (CBC / Cambridge / British)', 'One-Click Attendance', 'Instant Merit List & Rankings', 'Print Report Cards & Templates'],
    href: '/demo/teacher',
  },
  {
    id: 'parent',
    emoji: '👨‍👩‍👧',
    title: 'Parent Portal Demo',
    subtitle: 'Fees · Report Cards · Messages',
    desc: 'See what parents experience — live fee statements, digital report cards with QR verification, real-time SMS alerts, and a transparent academic tracker.',
    gradient: 'linear-gradient(135deg, #065f46 0%, #10b981 100%)',
    features: ['Live Fee Balance & Payment History', 'Digital Report Card (QR-Verified)', 'Real-Time SMS & Push Notifications', 'Academic Performance Tracker'],
    href: '/demo/parent',
  },
  {
    id: 'staff',
    emoji: '🏢',
    title: 'Admin & Staff Demo',
    subtitle: 'Dashboard · Payroll · Analytics',
    desc: 'Explore the full administrative suite — manage learners, run payroll, view revenue dashboards, generate school-wide exam summaries, and control all platform settings.',
    gradient: 'linear-gradient(135deg, #4c1d95 0%, #8b5cf6 100%)',
    features: ['Revenue Integrity Dashboard', 'Automated Payroll Engine', 'School-Wide Exam Summary Reports', 'Multi-Role Staff Management'],
    href: '/demo/staff',
  },
];

export default function DemoHubPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0F172A', fontFamily: 'Sora, sans-serif', color: '#fff', overflow: 'hidden', position: 'relative' }}>
      {/* Background mesh */}
      <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(circle at 20% 20%, rgba(79,70,229,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(16,185,129,0.1) 0%, transparent 50%)', pointerEvents: 'none', zIndex: 0 }} />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800;900&display=swap');
        @keyframes fadeUp { from { opacity: 0; transform: translateY(32px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shimmer { 0%,100% { opacity: .6; } 50% { opacity: 1; } }
        .demo-card { transition: transform .35s cubic-bezier(.16,1,.3,1), box-shadow .35s; border: 1px solid rgba(255,255,255,.08); }
        .demo-card:hover { transform: translateY(-10px) scale(1.01); box-shadow: 0 40px 80px rgba(0,0,0,.5); }
        .feat-li::before { content: '✓'; color: rgba(255,255,255,.7); margin-right: 8px; font-weight: 900; }
        .back-link { color: rgba(255,255,255,.5); font-size: 13px; font-weight: 700; text-decoration: none; transition: color .2s; }
        .back-link:hover { color: #fff; }
      `}</style>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1160, margin: '0 auto', padding: '60px 24px 80px' }}>
        {/* Back link */}
        <Link href="/" className="back-link">← Back to EduVantage</Link>

        {/* Hero text */}
        <div style={{ textAlign: 'center', marginTop: 48, marginBottom: 72, animation: 'fadeUp .8s ease forwards' }}>
          <div style={{ display: 'inline-block', padding: '6px 20px', borderRadius: 99, background: 'rgba(79,70,229,.15)', border: '1px solid rgba(79,70,229,.3)', fontSize: 13, fontWeight: 800, color: '#818CF8', marginBottom: 24 }}>🚀 Live Demo Experience</div>
          <h1 style={{ fontSize: 'clamp(36px,6vw,72px)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-0.03em', margin: '0 0 20px' }}>
            See EduVantage<br />
            <span style={{ background: 'linear-gradient(135deg, #818CF8, #34D399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>in action.</span>
          </h1>
          <p style={{ fontSize: 20, color: 'rgba(255,255,255,.6)', maxWidth: 560, margin: '0 auto', lineHeight: 1.6 }}>
            Choose your role below to explore a fully-detailed walkthrough of exactly what each stakeholder experiences daily.
          </p>
        </div>

        {/* Role cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px,1fr))', gap: 28 }}>
          {ROLES.map((role, i) => (
            <Link key={role.id} href={role.href} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="demo-card" style={{ borderRadius: 28, overflow: 'hidden', background: 'rgba(255,255,255,.03)', animation: `fadeUp .8s ${i * 0.12}s ease both` }}>
                {/* Card gradient top */}
                <div style={{ background: role.gradient, padding: '36px 32px 28px', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: -30, right: -30, width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,.05)' }} />
                  <div style={{ fontSize: 56, marginBottom: 12, animation: 'shimmer 4s infinite' }}>{role.emoji}</div>
                  <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 4 }}>{role.title}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.75, textTransform: 'uppercase', letterSpacing: 1 }}>{role.subtitle}</div>
                </div>

                {/* Card body */}
                <div style={{ padding: '28px 32px 32px' }}>
                  <p style={{ fontSize: 14.5, color: 'rgba(255,255,255,.65)', lineHeight: 1.65, marginBottom: 24 }}>{role.desc}</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
                    {role.features.map(f => (
                      <div key={f} className="feat-li" style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,.85)' }}>{f}</div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 20, borderTop: '1px solid rgba(255,255,255,.08)' }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: 1 }}>Launch Demo</span>
                    <span style={{ fontSize: 22, color: 'rgba(255,255,255,.5)' }}>→</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Bottom CTA */}
        <div style={{ textAlign: 'center', marginTop: 72 }}>
          <p style={{ color: 'rgba(255,255,255,.4)', marginBottom: 20, fontSize: 14 }}>Ready to onboard your school?</p>
          <Link href="/saas/signup" style={{ display: 'inline-block', background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', color: '#fff', padding: '14px 40px', borderRadius: 99, fontWeight: 800, fontSize: 16, textDecoration: 'none', boxShadow: '0 20px 40px rgba(79,70,229,.4)', transition: 'transform .2s' }}
            onMouseOver={e => e.currentTarget.style.transform = 'translateY(-3px)'}
            onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
            Start Free Trial →
          </Link>
        </div>
      </div>
    </div>
  );
}
