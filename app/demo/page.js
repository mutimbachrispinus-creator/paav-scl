'use client';
export const runtime = 'edge';
import { useState, useEffect } from 'react';
import Link from 'next/link';

const slides = [
  {
    title: "PAAV School Management Portal",
    subtitle: "Modernizing Education, One Click at a Time",
    content: "A comprehensive digital ecosystem for progressive schools.",
    bg: "linear-gradient(135deg, #8B1A1A, #4A0E0E)",
    color: "#fff",
    icon: "🏫"
  },
  {
    title: "Centralized Management",
    subtitle: "Efficiency Redefined",
    content: "Manage Learners, Staff, and Academic data in one unified dashboard. Eliminate paper trail and data redundancy.",
    bg: "linear-gradient(135deg, #1e293b, #0f172a)",
    color: "#fff",
    icon: "📊",
    features: ["Digital Student Files", "Staff Records", "Attendance Tracking"]
  },
  {
    title: "CBC Academic Engine",
    subtitle: "Compliant & Automated",
    content: "Automated Competency-Based Assessment tracking. Generate premium A4 report cards and merit lists instantly.",
    bg: "linear-gradient(135deg, #059669, #064e3b)",
    color: "#fff",
    icon: "📝",
    features: ["Custom Assessment Rubrics", "Automated Grading", "Instant Report Cards"]
  },
  {
    title: "Smart Financials",
    subtitle: "Transparency & Growth",
    content: "Real-time fee collection, arrears tracking, and digital statement generation for every parent.",
    bg: "linear-gradient(135deg, #2563eb, #1e3a8a)",
    color: "#fff",
    icon: "💰",
    features: ["Collection Analytics", "Instant Statements", "Arrears Management"]
  },
  {
    title: "Real-Time Communication",
    subtitle: "Bridging the Gap",
    content: "Connect with parents via integrated SMS and private messaging. Keep everyone informed with global announcements.",
    bg: "linear-gradient(135deg, #d97706, #92400e)",
    color: "#fff",
    icon: "💬",
    features: ["Integrated SMS API", "Staff-Parent Messaging", "Global Banner Alerts"]
  },
  {
    title: "Premium Value",
    subtitle: "A Sound Investment",
    content: "Empower your school with technology valued at KES 50,000. Low operational costs, high institutional impact.",
    bg: "linear-gradient(135deg, #7c3aed, #4c1d95)",
    color: "#fff",
    icon: "💎",
    cta: "Launch Portal"
  }
];

export default function DemoPage() {
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);

  const next = () => {
    if (animating) return;
    setAnimating(true);
    setCurrent((prev) => (prev + 1) % slides.length);
    setTimeout(() => setAnimating(false), 600);
  };

  const prev = () => {
    if (animating) return;
    setAnimating(true);
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
    setTimeout(() => setAnimating(false), 600);
  };

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [animating]);

  const slide = slides[current];

  return (
    <div style={{ 
      height: '100vh', 
      width: '100vw', 
      background: slide.bg, 
      color: slide.color, 
      transition: 'background 0.8s ease',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Sora, sans-serif',
      overflow: 'hidden',
      position: 'relative'
    }}>
      <style jsx global>{`
        @keyframes slideIn {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes iconBounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        .animate-in { animation: slideIn 0.8s ease forwards; }
        .icon-anim { animation: iconBounce 3s infinite ease-in-out; }
      `}</style>

      <div className="animate-in" style={{ textAlign: 'center', maxWidth: 800, padding: '0 40px' }}>
        <div className="icon-anim" style={{ fontSize: 120, marginBottom: 20 }}>{slide.icon}</div>
        <h1 style={{ fontSize: '3.5rem', fontWeight: 900, marginBottom: 10, lineHeight: 1.1 }}>{slide.title}</h1>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 500, opacity: 0.8, marginBottom: 30 }}>{slide.subtitle}</h2>
        <p style={{ fontSize: '1.25rem', lineHeight: 1.6, opacity: 0.9, marginBottom: 40 }}>{slide.content}</p>
        
        {slide.features && (
          <div style={{ display: 'flex', gap: 15, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 40 }}>
            {slide.features.map(f => (
              <span key={f} style={{ background: 'rgba(255,255,255,0.15)', padding: '10px 24px', borderRadius: 50, fontSize: 14, fontWeight: 600, border: '1px solid rgba(255,255,255,0.2)' }}>
                {f}
              </span>
            ))}
          </div>
        )}

        {slide.cta && (
          <Link href="/dashboard" style={{ 
            display: 'inline-block',
            background: '#fff',
            color: slide.bg.includes('#7c3aed') ? '#7c3aed' : '#8B1A1A',
            padding: '16px 40px',
            borderRadius: 50,
            fontSize: 18,
            fontWeight: 800,
            textDecoration: 'none',
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
            transition: 'transform 0.2s'
          }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>
            {slide.cta}
          </Link>
        )}
      </div>

      {/* Controls */}
      <div style={{ position: 'absolute', bottom: 40, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 20, alignItems: 'center' }}>
        <button onClick={prev} style={{ background: 'rgba(255,255,255,0.1)', border: '1.5px solid rgba(255,255,255,0.3)', borderRadius: '50%', width: 50, height: 50, color: '#fff', cursor: 'pointer', fontSize: 20 }}>←</button>
        <div style={{ display: 'flex', gap: 8 }}>
          {slides.map((_, i) => (
            <div key={i} style={{ width: i === current ? 30 : 8, height: 8, background: i === current ? '#fff' : 'rgba(255,255,255,0.3)', borderRadius: 10, transition: 'all 0.3s' }} />
          ))}
        </div>
        <button onClick={next} style={{ background: 'rgba(255,255,255,0.1)', border: '1.5px solid rgba(255,255,255,0.3)', borderRadius: '50%', width: 50, height: 50, color: '#fff', cursor: 'pointer', fontSize: 20 }}>→</button>
      </div>

      <div style={{ position: 'absolute', top: 40, left: 40, fontSize: 14, fontWeight: 700, letterSpacing: 2, opacity: 0.5 }}>
        PAAV PORTAL // 2026
      </div>
      <div style={{ position: 'absolute', top: 40, right: 40, fontSize: 14, fontWeight: 700, opacity: 0.5 }}>
        {current + 1} / {slides.length}
      </div>
    </div>
  );
}
