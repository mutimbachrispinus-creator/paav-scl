'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import ChatBot from '@/components/ChatBot';

const PRIMARY = '#4F46E5'; // Indigo
const ACCENT  = '#10B981'; // Emerald
const DARK    = '#0F172A';
const SLATE   = '#64748B';

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="landing-wrap">
      {/* ── STICKY NAV ── */}
      <nav className={`nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="container nav-box">
          <Link href="/" className="logo-group">
            <div className="logo-icon">
              <img src="/eduvantage-logo.png" alt="E" />
            </div>
            <span className="logo-text">EduVantage</span>
          </Link>
          
          <div className="nav-actions">
            <div className="nav-links desktop-only">
              <a href="#features">Features</a>
              <a href="#solutions">Solutions</a>
              <a href="#testimonials">Impact</a>
            </div>
            <div className="nav-btns">
              <Link href="/login" className="btn btn-ghost">Sign In</Link>
              <Link href="/saas/signup" className="btn btn-primary btn-glow">Get Started Free</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="hero">
        <div className="hero-bg">
          <div className="blob blob-1"></div>
          <div className="blob blob-2"></div>
        </div>
        
        <div className="container hero-content">
          <div className="badge-pill">🚀 The #1 School Management SaaS in Africa</div>
          <h1 className="hero-title">
            The Future of <span className="text-gradient">School Intelligence</span>
          </h1>
          <p className="hero-subtitle">
            Transform your institution with a high-performance platform for academic analytics, 
            automated fee collection, and seamless communication.
          </p>
          
          <div className="hero-actions">
            <Link href="/saas/signup" className="btn btn-xl btn-primary">Start Your 30-Day Trial</Link>
            <button className="btn btn-xl btn-outline">Watch Demo 🍿</button>
          </div>

          <div className="hero-mockup">
            <div className="mockup-frame">
              <img src="/eduvantage-hero-new.png" alt="Dashboard Mockup" className="mockup-img" />
              
              {/* Floating Glass Cards */}
              <div className="floating-card card-1">
                <div className="icon-wrap">📈</div>
                <div>
                  <div className="card-val">+24%</div>
                  <div className="card-lab">Academic Growth</div>
                </div>
              </div>
              <div className="floating-card card-2">
                <div className="icon-wrap">💰</div>
                <div>
                  <div className="card-val">KES 4.2M</div>
                  <div className="card-lab">Fees Collected</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ── */}
      <section className="stats-strip">
        <div className="container stats-box">
          <div className="stat-item">
            <strong>1,200+</strong>
            <span>Active Schools</span>
          </div>
          <div className="stat-sep"></div>
          <div className="stat-item">
            <strong>500k+</strong>
            <span>Learners Registered</span>
          </div>
          <div className="stat-sep"></div>
          <div className="stat-item">
            <strong>99.9%</strong>
            <span>Uptime Reliability</span>
          </div>
        </div>
      </section>

      {/* ── FEATURES SECTION ── */}
      <section id="features" style={{ padding: '120px 0', background: '#F8FAFC' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 80 }}>
            <div style={{ color: PRIMARY, fontWeight: 800, fontSize: 14, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16 }}>Unmatched Capabilities</div>
            <h2 style={{ fontSize: 56, fontWeight: 900, letterSpacing: '-0.03em', color: DARK, lineHeight: 1.1 }}>Everything you need to <br/> <span style={{ color: PRIMARY }}>scale excellence</span></h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 32 }}>
            <FeatureCard 
              icon="🎓" 
              title="Academic Management" 
              items={['Real-time Attendance Tracking', 'Automated Timetable Generation', 'Dynamic Grading & Merit Lists', 'Digital Learning Hub & Docs', 'Performance Analytics']}
              color="#6366F1"
            />
            <FeatureCard 
              icon="💰" 
              title="Financial Control" 
              items={['Automated Fee Collection', 'Intelligent Ledger Tracking', 'Bulk Payroll & Salary Sync', 'Bank Statement Reconciliation', 'Revenue Projections']}
              color="#10B981"
            />
            <FeatureCard 
              icon="📲" 
              title="Communication Hub" 
              items={['Reliable Bulk SMS Center', 'Secure In-Portal Messaging', 'Push Notifications', 'Automated Email Report Cards', 'Parent Engagement Tools']}
              color="#F59E0B"
            />
            <FeatureCard 
              icon="🏗️" 
              title="SaaS Architecture" 
              items={['Isolated Tenant Databases', 'Global Smart Sign-In', 'Customizable School Branding', 'Subscription Management', 'Super Admin Control Center']}
              color="#EC4899"
            />
            <FeatureCard 
              icon="👤" 
              title="Parent Empowerment" 
              items={['Self-Service Registration', 'Online Payment Gateway', 'Daily Progress Notifications', 'Child Welfare Monitoring', 'Achievement Portfolios']}
              color="#8B5CF6"
            />
            <FeatureCard 
              icon="🛡️" 
              title="Security & Reliability" 
              items={['Role-Based Access Control', 'Encrypted User Sessions', 'Comprehensive Activity Logs', 'High-Availability Hosting', 'Automated Daily Backups']}
              color="#3B82F6"
            />
          </div>
        </div>
      </section>

      {/* ── VIBE SECTION ── */}
      <section className="vibe-section" id="solutions">
        <div className="container vibe-grid">
          <div className="vibe-image">
            <img src="/classroom-vibe.png" alt="Modern Classroom" />
            <div className="vibe-overlay"></div>
          </div>
          <div className="vibe-content">
            <h2 className="tag-line">MODERN LEARNING</h2>
            <h3 style={{ fontSize: 48, fontWeight: 900, marginBottom: 24, lineHeight: 1.1 }}>Empowering the next generation of African leaders</h3>
            <p>
              We believe that technology should be an enabler, not a hurdle. 
              EduVantage is designed to be intuitive, fast, and reliable, 
              giving teachers more time to focus on what matters: teaching.
            </p>
            <ul className="check-list">
              <li><span style={{ color: ACCENT }}>✓</span> Offline-first capability for remote areas</li>
              <li><span style={{ color: ACCENT }}>✓</span> Mobile-responsive for on-the-go access</li>
              <li><span style={{ color: ACCENT }}>✓</span> Multi-tenant isolation for total data security</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIAL ── */}
      <section className="testimonials" id="testimonials">
        <div className="container">
          <div className="testi-card">
            <div className="testi-quote">“</div>
            <p>
              EduVantage has completely transformed how we operate. The academic reporting 
              that used to take us weeks now takes minutes. It's truly world-class software 
              made for our specific needs.
            </p>
            <div className="testi-user">
              <div className="avatar">👨‍🏫</div>
              <div>
                <strong>Principal David Mwangi</strong>
                <span>St. Peters Academy, Nairobi</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="footer">
        <div className="container footer-grid">
          <div className="footer-info">
            <Link href="/" className="logo-group">
              <div className="logo-icon">
                <img src="/eduvantage-logo.png" alt="Logo" />
              </div>
              <span className="logo-text">EduVantage</span>
            </Link>
            <p>The leading school management platform for the digital age. Empowering 1,200+ schools across Africa.</p>
            <div className="social-links">
              <span>𝕏</span> <span>LinkedIn</span> <span>Facebook</span>
            </div>
          </div>
          <div className="footer-links">
            <div>
              <h4>Product</h4>
              <a href="#features">Features</a>
              <a href="/login">Parent Portal</a>
              <a href="/saas/signup">Admin Demo</a>
            </div>
            <div>
              <h4>Company</h4>
              <a href="#">About Us</a>
              <a href="#">Support</a>
              <a href="#">Privacy</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="container">
            <p>&copy; {new Date().getFullYear()} EduVantage Platform. Built with ❤️ for African Education.</p>
          </div>
        </div>
      </footer>

      <ChatBot />

      <style jsx>{`
        .landing-wrap { background: #fff; color: ${DARK}; font-family: var(--font-inter, sans-serif); overflow-x: hidden; max-width: 100vw; }
        .container { max-width: 1200px; margin: 0 auto; padding: 0 24px; position: relative; z-index: 2; width: 100%; box-sizing: border-box; }
        
        /* Nav */
        .nav { position: fixed; top: 0; left: 0; width: 100%; z-index: 1000; transition: 0.4s cubic-bezier(0.4, 0, 0.2, 1); padding: 24px 0; }
        .nav.scrolled { padding: 12px 0; background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(20px); border-bottom: 1px solid rgba(0,0,0,0.05); }
        .nav-box { display: flex; justify-content: space-between; align-items: center; }
        
        .logo-group { display: flex; align-items: center; gap: 12px; text-decoration: none; }
        .logo-icon { width: 40px; height: 40px; background: ${PRIMARY}; border-radius: 12px; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 20px rgba(79, 70, 229, 0.2); }
        .logo-icon img { width: 24px; height: 24px; object-fit: contain; filter: brightness(0) invert(1); }
        .logo-text { font-family: var(--font-sora, sans-serif); font-size: 22px; font-weight: 800; color: ${DARK}; }
        
        .nav-actions { display: flex; align-items: center; gap: 40px; }
        .nav-links { display: flex; gap: 32px; }
        .nav-links a { text-decoration: none; color: ${SLATE}; font-weight: 600; font-size: 15px; transition: 0.2s; }
        .nav-links a:hover { color: ${PRIMARY}; }
        .nav-btns { display: flex; gap: 12px; }
        
        /* Buttons */
        .btn { padding: 10px 24px; border-radius: 14px; font-weight: 700; font-size: 15px; text-decoration: none; transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1); border: none; cursor: pointer; display: inline-flex; align-items: center; }
        .btn-primary { background: ${PRIMARY}; color: #fff; }
        .btn-primary:hover { transform: translateY(-3px); box-shadow: 0 20px 40px rgba(79, 70, 229, 0.25); }
        .btn-ghost { color: ${DARK}; }
        .btn-ghost:hover { background: rgba(0,0,0,0.04); }
        .btn-outline { border: 2.5px solid ${DARK}; color: ${DARK}; }
        .btn-outline:hover { background: ${DARK}; color: #fff; }
        .btn-xl { padding: 18px 42px; font-size: 17px; border-radius: 18px; }
        .btn-glow { position: relative; }
        .btn-glow::after { content: ''; position: absolute; inset: -2px; border-radius: 16px; background: linear-gradient(45deg, ${PRIMARY}, #818CF8); z-index: -1; opacity: 0.4; }
        
        /* Hero */
        .hero { padding: 200px 0 120px; position: relative; text-align: center; }
        .hero-bg { position: absolute; inset: 0; overflow: hidden; pointer-events: none; }
        .blob { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.15; }
        .blob-1 { width: 600px; height: 600px; background: ${PRIMARY}; top: -200px; right: -100px; animation: float 10s infinite alternate; }
        .blob-2 { width: 500px; height: 500px; background: ${ACCENT}; bottom: -100px; left: -100px; animation: float 8s infinite alternate-reverse; }
        @keyframes float { from { transform: translate(0,0); } to { transform: translate(50px, 50px); } }

        .badge-pill { display: inline-block; padding: 8px 16px; background: rgba(79, 70, 229, 0.08); color: ${PRIMARY}; border-radius: 99px; font-weight: 800; font-size: 13px; margin-bottom: 24px; }
        .hero-title { font-family: var(--font-sora, sans-serif); font-size: 82px; font-weight: 800; line-height: 1.1; letter-spacing: -2px; margin-bottom: 32px; color: ${DARK}; }
        .text-gradient { background: linear-gradient(135deg, ${PRIMARY}, #818CF8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .hero-subtitle { font-size: 22px; color: ${SLATE}; line-height: 1.6; max-width: 800px; margin: 0 auto 48px; }
        .hero-actions { display: flex; gap: 20px; justify-content: center; margin-bottom: 80px; }
        
        .hero-mockup { perspective: 1000px; margin-top: 40px; }
        .mockup-frame { position: relative; background: #fff; padding: 12px; border-radius: 32px; box-shadow: 0 100px 150px -50px rgba(15, 23, 42, 0.25); border: 1px solid rgba(0,0,0,0.05); display: inline-block; transform: rotateX(5deg); transition: 0.5s; }
        .mockup-frame:hover { transform: rotateX(0deg) scale(1.02); }
        .mockup-img { width: 1000px; max-width: 90vw; border-radius: 24px; display: block; }
        
        .floating-card { position: absolute; background: rgba(255,255,255,0.8); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.3); padding: 20px; border-radius: 20px; display: flex; align-items: center; gap: 16px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); text-align: left; animation: bounce 4s infinite ease-in-out; }
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
        .card-1 { top: 20%; left: -60px; }
        .card-2 { bottom: 15%; right: -60px; animation-delay: 2s; }
        .icon-wrap { width: 48px; height: 48px; background: #fff; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; box-shadow: 0 5px 15px rgba(0,0,0,0.05); }
        .card-val { font-family: var(--font-sora, sans-serif); font-size: 20px; font-weight: 800; color: ${DARK}; }
        .card-lab { font-size: 13px; color: ${SLATE}; font-weight: 600; }

        /* Stats */
        .stats-strip { padding: 40px 0; border-top: 1px solid rgba(0,0,0,0.05); border-bottom: 1px solid rgba(0,0,0,0.05); }
        .stats-box { display: flex; justify-content: space-around; align-items: center; }
        .stat-item { text-align: center; }
        .stat-item strong { display: block; font-family: var(--font-sora, sans-serif); font-size: 32px; font-weight: 800; color: ${DARK}; }
        .stat-item span { color: ${SLATE}; font-weight: 600; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; }
        .stat-sep { width: 1px; height: 50px; background: rgba(0,0,0,0.05); }

        /* Vibe */
        .vibe-section { padding: 120px 0; }
        .vibe-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; }
        .vibe-image { position: relative; border-radius: 40px; overflow: hidden; box-shadow: 0 40px 100px rgba(0,0,0,0.1); }
        .vibe-image img { width: 100%; display: block; transform: scale(1.05); transition: 1s; }
        .vibe-image:hover img { transform: scale(1); }
        .vibe-overlay { position: absolute; inset: 0; background: linear-gradient(to bottom, transparent, rgba(0,0,0,0.2)); }
        .vibe-content h3 { font-family: var(--font-sora, sans-serif); }
        .vibe-content p { font-size: 18px; color: ${SLATE}; line-height: 1.7; margin-bottom: 32px; }
        .check-list { list-style: none; padding: 0; }
        .check-list li { margin-bottom: 16px; font-weight: 700; color: ${DARK}; display: flex; align-items: center; gap: 12px; }
        .tag-line { color: ${PRIMARY}; font-weight: 800; font-size: 14px; letter-spacing: 2px; margin-bottom: 16px; }

        /* Testimonials */
        .testimonials { padding: 120px 0; background: ${DARK}; color: #fff; }
        .testi-card { max-width: 800px; margin: 0 auto; text-align: center; }
        .testi-quote { font-size: 120px; font-family: serif; color: ${PRIMARY}; opacity: 0.3; line-height: 1; margin-bottom: -40px; }
        .testi-card p { font-size: 32px; font-weight: 500; font-style: italic; line-height: 1.5; margin-bottom: 48px; }
        .testi-user { display: flex; align-items: center; justify-content: center; gap: 20px; }
        .avatar { width: 64px; height: 64px; background: rgba(255,255,255,0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 32px; }
        .testi-user strong { display: block; font-size: 18px; font-weight: 700; }
        .testi-user span { opacity: 0.6; font-size: 14px; }

        /* Footer */
        .footer { padding: 100px 0 0; background: #FAFAFB; border-top: 1px solid rgba(0,0,0,0.05); }
        .footer-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 100px; margin-bottom: 80px; }
        .footer-info p { color: ${SLATE}; margin: 24px 0 32px; font-size: 16px; max-width: 300px; }
        .social-links { display: flex; gap: 24px; font-weight: 700; color: ${DARK}; }
        .footer-links { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
        .footer-links h4 { font-family: var(--font-sora, sans-serif); margin-bottom: 24px; font-weight: 800; }
        .footer-links a { display: block; text-decoration: none; color: ${SLATE}; margin-bottom: 12px; font-weight: 600; }
        .footer-links a:hover { color: ${PRIMARY}; }
        .footer-bottom { padding: 40px 0; border-top: 1px solid rgba(0,0,0,0.05); text-align: center; color: ${SLATE}; font-weight: 600; font-size: 14px; }

        @media (max-width: 1000px) {
          .hero-title { font-size: 52px; }
          .hero-subtitle { font-size: 18px; }
          .vibe-grid, .footer-grid { grid-template-columns: 1fr; gap: 60px; }
          .card-1, .card-2 { display: none; }
          .mockup-img { width: 100%; }
          .desktop-only { display: none; }
        }
      `}</style>
    </div>
  );
}

function FeatureCard({ icon, title, items, color }) {
  return (
    <div className="f-card">
      <div className="f-icon" style={{ background: color + '15', color: color }}>{icon}</div>
      <h4>{title}</h4>
      <ul className="f-list">
        {items.map(item => <li key={item}>• {item}</li>)}
      </ul>
      <style jsx>{`
        .f-card { padding: 40px; background: #fff; border-radius: 32px; border: 1px solid rgba(0,0,0,0.03); transition: 0.4s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 10px 30px rgba(0,0,0,0.02); }
        .f-card:hover { transform: translateY(-10px); border-color: ${PRIMARY}22; box-shadow: 0 40px 80px rgba(0,0,0,0.08); }
        .f-icon { width: 64px; height: 64px; border-radius: 20px; display: flex; align-items: center; justify-content: center; font-size: 32px; margin-bottom: 24px; }
        h4 { font-family: var(--font-sora, sans-serif); font-size: 22px; font-weight: 800; margin-bottom: 16px; color: ${DARK}; }
        .f-list { list-style: none; padding: 0; margin: 0; }
        .f-list li { color: ${SLATE}; line-height: 2; font-size: 14px; font-weight: 500; }
      `}</style>
    </div>
  );
}
