'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

const INDIGO = '#4F46E5';
const GOLD = '#D4AF37';
const SLATE = '#1E293B';

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="landing">
      {/* ── NAVBAR ── */}
      <nav className={`nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="container nav-content">
          <div className="logo">
            <img src="/eduvantage-logo.png" alt="EduVantage Logo" />
            <span>EduVantage</span>
          </div>
          <div className="nav-links">
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <Link href="/login?tenant=platform-master" className="btn btn-ghost">Console</Link>
            <Link href="/saas/signup" className="btn btn-primary">Start Free Trial</Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <header className="hero">
        <div className="container hero-grid">
          <div className="hero-text">
            <div className="badge">New: AI-Powered CBC Reports</div>
            <h1>The Future of <span className="highlight">School Management</span> is Here.</h1>
            <p>
              Empower your institution with a high-performance, multi-tenant portal. 
              Automate grades, track finances, and engage parents—all in one secure platform.
            </p>
            <div className="hero-btns">
              <Link href="/saas/signup" className="btn btn-lg btn-primary">Get Started for Free</Link>
              <button className="btn btn-lg btn-secondary">Watch Demo</button>
            </div>
            <div className="trust">
              <span>Trusted by 50+ schools across East Africa</span>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-img-wrapper">
              <img src="/eduvantage-hero.png" alt="EduVantage Interface" className="hero-img" />
              <div className="floating-card">
                <div className="fc-icon">📈</div>
                <div>
                  <div className="fc-label">Real-time Revenue</div>
                  <div className="fc-val">+24% This Month</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── FEATURES ── */}
      <section id="features" className="features">
        <div className="container">
          <div className="section-hdr">
            <h2>Everything you need to <span className="highlight">scale</span>.</h2>
            <p>EduVantage is built for high-growth institutions that value speed and data integrity.</p>
          </div>
          <div className="feature-grid">
            <FeatureCard 
              icon="🛡️" 
              title="Secure Multi-Tenancy" 
              desc="Total data isolation between schools with military-grade encryption."
            />
            <FeatureCard 
              icon="💰" 
              title="M-Pesa Automation" 
              desc="Real-time fee reconciliation with instant parent receipts via SMS."
            />
            <FeatureCard 
              icon="📊" 
              title="CBC Analytics" 
              desc="Comprehensive merit lists and performance tracking for JSS & Primary."
            />
            <FeatureCard 
              icon="📱" 
              title="PWA Ready" 
              desc="Install on any device. Works offline for rural staff access."
            />
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="cta">
        <div className="container">
          <div className="cta-box">
            <h2>Ready to transform your school?</h2>
            <p>Join the digital revolution. Start your 30-day free trial today.</p>
            <Link href="/saas/signup" className="btn btn-lg btn-white">Create My School Portal</Link>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div>
              <div className="logo" style={{ marginBottom: 20 }}>
                <img src="/eduvantage-logo.png" alt="EduVantage Logo" />
                <span style={{ color: '#fff' }}>EduVantage</span>
              </div>
              <p style={{ color: '#94A3B8', fontSize: 14 }}>The ultimate SaaS command center for modern education.</p>
            </div>
            <div className="footer-links">
              <h4>Product</h4>
              <a href="#">Features</a>
              <a href="#">Security</a>
              <a href="#">Roadmap</a>
            </div>
            <div className="footer-links">
              <h4>Company</h4>
              <a href="#">About</a>
              <a href="#">Contact</a>
              <a href="#">Privacy</a>
            </div>
          </div>
          <div className="footer-bottom">
            &copy; {new Date().getFullYear()} EduVantage Platform. All rights reserved.
          </div>
        </div>
      </footer>

      <style jsx>{`
        .landing { background: #fff; color: ${SLATE}; font-family: var(--font-sora); }
        .container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
        
        .nav { position: fixed; top: 0; left: 0; width: 100%; z-index: 1000; transition: all 0.3s; padding: 24px 0; }
        .nav.scrolled { background: rgba(255,255,255,0.9); backdrop-filter: blur(20px); padding: 12px 0; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
        .nav-content { display: flex; justify-content: space-between; align-items: center; }
        .logo { display: flex; align-items: center; gap: 12px; font-weight: 800; font-size: 22px; color: ${INDIGO}; }
        .logo img { width: 40px; height: 40px; }
        .nav-links { display: flex; align-items: center; gap: 32px; }
        .nav-links a { font-weight: 600; color: ${SLATE}; text-decoration: none; font-size: 15px; }

        .hero { padding: 180px 0 100px; background: radial-gradient(circle at top right, #EEF2FF, #fff); overflow: hidden; }
        .hero-grid { display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 60px; align-items: center; }
        .badge { display: inline-block; padding: 6px 16px; background: ${INDIGO}15; color: ${INDIGO}; border-radius: 100px; font-size: 13px; font-weight: 700; margin-bottom: 24px; }
        .hero h1 { font-size: 64px; font-weight: 800; line-height: 1.1; margin-bottom: 24px; }
        .highlight { color: ${INDIGO}; }
        .hero p { font-size: 19px; color: #64748B; line-height: 1.6; margin-bottom: 40px; max-width: 500px; }
        .hero-btns { display: flex; gap: 16px; margin-bottom: 40px; }

        .hero-img-wrapper { position: relative; }
        .hero-img { width: 100%; border-radius: 24px; box-shadow: 0 40px 100px rgba(79, 70, 229, 0.15); border: 8px solid #fff; }
        .floating-card { position: absolute; bottom: -20px; left: -40px; background: #fff; padding: 20px 24px; border-radius: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); display: flex; gap: 15px; align-items: center; }
        .fc-icon { font-size: 24px; }
        .fc-label { font-size: 12px; font-weight: 700; color: #94A3B8; text-transform: uppercase; }
        .fc-val { font-size: 18px; font-weight: 800; color: #10B981; }

        .btn { padding: 12px 28px; border-radius: 12px; font-weight: 700; cursor: pointer; transition: all 0.2s; border: none; font-size: 15px; text-decoration: none; display: inline-block; }
        .btn-primary { background: ${INDIGO}; color: #fff; }
        .btn-primary:hover { background: #4338CA; transform: translateY(-2px); box-shadow: 0 10px 20px ${INDIGO}4D; }
        .btn-secondary { background: #fff; color: ${SLATE}; border: 2px solid #E2E8F0; }
        .btn-ghost { background: transparent; color: ${SLATE}; }
        .btn-lg { padding: 18px 40px; font-size: 17px; }
        .btn-white { background: #fff; color: ${INDIGO}; }

        .features { padding: 100px 0; }
        .section-hdr { text-align: center; margin-bottom: 80px; }
        .section-hdr h2 { font-size: 42px; font-weight: 800; margin-bottom: 16px; }
        .highlight { color: ${INDIGO}; }
        .section-hdr p { font-size: 18px; color: #64748B; }
        .feature-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 32px; }

        .cta { padding: 60px 0 120px; }
        .cta-box { background: ${INDIGO}; border-radius: 32px; padding: 80px; text-align: center; color: #fff; background-image: radial-gradient(circle at top right, rgba(255,255,255,0.15), transparent); }
        .cta-box h2 { font-size: 48px; font-weight: 800; margin-bottom: 20px; }
        .cta-box p { font-size: 20px; opacity: 0.9; margin-bottom: 40px; }

        .footer { background: ${SLATE}; padding: 80px 0 40px; color: #fff; }
        .footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 80px; margin-bottom: 60px; }
        .footer-links { display: flex; flexDirection: column; gap: 12px; }
        .footer-links h4 { font-size: 16px; font-weight: 700; margin-bottom: 8px; color: ${GOLD}; }
        .footer-links a { color: #94A3B8; text-decoration: none; font-size: 14px; transition: color 0.2s; }
        .footer-links a:hover { color: #fff; }
        .footer-bottom { border-top: 1px solid rgba(255,255,255,0.1); padding-top: 40px; text-align: center; color: #64748B; font-size: 13px; }

        @media (max-width: 900px) {
          .hero-grid { grid-template-columns: 1fr; text-align: center; }
          .hero h1 { font-size: 42px; }
          .hero-btns { justify-content: center; }
          .hero-visual { display: none; }
          .nav-links a { display: none; }
          .cta-box { padding: 40px 20px; }
          .cta-box h2 { font-size: 32px; }
        }
      `}</style>
    </div>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <div className="f-card">
      <div className="f-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{desc}</p>
      <style jsx>{`
        .f-card { padding: 40px; background: #fff; border-radius: 24px; border: 1.5px solid #F1F5F9; transition: all 0.3s; }
        .f-card:hover { border-color: ${INDIGO}4D; transform: translateY(-5px); box-shadow: 0 20px 40px rgba(0,0,0,0.03); }
        .f-icon { font-size: 32px; margin-bottom: 24px; }
        h3 { font-size: 20px; font-weight: 800; margin-bottom: 12px; }
        p { font-size: 15px; color: #64748B; line-height: 1.6; }
      `}</style>
    </div>
  );
}
