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
  const [stats, setStats] = useState({ schools: 0, learners: 0 });

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll);
    
    async function loadStats() {
      try {
        const res = await fetch('/api/saas/config?tenant=platform-master');
        const data = await res.json();
        if (data.stats) setStats(data.stats);
      } catch (e) {}
    }
    loadStats();

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
            <strong>{stats.schools ? `${stats.schools.toLocaleString()}+` : '1,200+'}</strong>
            <span>Active Schools</span>
          </div>
          <div className="stat-sep"></div>
          <div className="stat-item">
            <strong>{stats.learners ? `${(stats.learners / 1000).toFixed(0)}k+` : '500k+'}</strong>
            <span>Learners Registered</span>
          </div>
          <div className="stat-sep"></div>
          <div className="stat-item">
            <strong>99.9%</strong>
            <span>Uptime Reliability</span>
          </div>
        </div>
      </section>

      {/* ── MODULES SECTION ── */}
      <section id="features" className="modules-section">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 80 }}>
            <div className="badge-pill">Premium Modules</div>
            <h2 className="section-title">A unified suite for <br/> <span className="text-gradient">total school management</span></h2>
            <p className="section-subtitle">Replace fragmented systems with one seamlessly integrated platform.</p>
          </div>

          <div className="module-grid">
            {/* Analytics */}
            <div className="module-card">
              <div className="mod-icon" style={{ background: '#EEF2FF', color: '#4F46E5' }}>📊</div>
              <div className="mod-content">
                <h3>EduVantage Analytics</h3>
                <p>Actionable insights into academic performance. Instantly generate comprehensive report cards, dynamic merit lists, and multi-term performance trend graphs. Identify strengths and areas for improvement with AI-driven grading.</p>
                <ul className="mod-features">
                  <li>CBC & 8-4-4 Ready Grading</li>
                  <li>Automated Merit Lists & Rankings</li>
                  <li>Subject-level Trend Analysis</li>
                </ul>
              </div>
            </div>

            {/* Finance */}
            <div className="module-card reverse">
              <div className="mod-content">
                <h3>EduVantage Finance</h3>
                <p>Take absolute control of your institution's financial health. Automate fee collection, reconcile M-Pesa payments instantly, and generate detailed fee arrears reports. Eliminate manual ledger errors and streamline payroll processing.</p>
                <ul className="mod-features">
                  <li>Automated Fee Reconciliation</li>
                  <li>Instant Parent E-Receipts</li>
                  <li>Staff Payroll & Bulk Sync</li>
                </ul>
              </div>
              <div className="mod-icon" style={{ background: '#ECFDF5', color: '#10B981' }}>💰</div>
            </div>

            {/* Timetable */}
            <div className="module-card">
              <div className="mod-icon" style={{ background: '#FFFBEB', color: '#D97706' }}>📅</div>
              <div className="mod-content">
                <h3>EduVantage Timetable</h3>
                <p>Intelligent, conflict-free timetable generation. Automatically allocate teachers, subjects, and classrooms while respecting complex constraints and availability. Keep staff and students aligned with real-time digital schedules.</p>
                <ul className="mod-features">
                  <li>Auto-resolve Scheduling Conflicts</li>
                  <li>Teacher Workload Optimization</li>
                  <li>Digital Class & Exam Routines</li>
                </ul>
              </div>
            </div>

            {/* Communication */}
            <div className="module-card reverse">
              <div className="mod-content">
                <h3>EduVantage Communication</h3>
                <p>Bridge the gap between school and home. Send instant bulk SMS notifications, digital fee statements, and termly academic reports directly to parents' phones. Foster a transparent and engaged school community.</p>
                <ul className="mod-features">
                  <li>Targeted Bulk SMS Campaigns</li>
                  <li>Automated Absence Alerts</li>
                  <li>Direct Parent-Teacher Messaging</li>
                </ul>
              </div>
              <div className="mod-icon" style={{ background: '#F5F3FF', color: '#8B5CF6' }}>📲</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STAKEHOLDER SOLUTIONS ── */}
      <section style={{ padding: '100px 0', background: '#fff' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <h2 style={{ fontSize: 42, fontWeight: 900, color: DARK }}>Solutions for <span className="text-gradient">Every Stakeholder</span></h2>
            <p style={{ color: SLATE, fontSize: 18 }}>A unified ecosystem that keeps everyone connected and informed.</p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            <SolutionCard 
              target="School Administrators" 
              desc="Total oversight of finances, staff performance, and platform-wide metrics with automated daily reports."
              features={['M-Pesa Reconciliation', 'Bulk Payroll', 'SaaS Command Center']}
            />
            <SolutionCard 
              target="Teachers & Educators" 
              desc="Reduce paperwork with digital attendance, instant grade entry, and automated timetable generation."
              features={['Digital Markbooks', 'Attendance Logs', 'Lesson Planning']}
            />
            <SolutionCard 
              target="Parents & Guardians" 
              desc="Real-time transparency into fees, academic progress, and student welfare from any mobile device."
              features={['Instant Fee Statements', 'Report Card Access', 'SMS Alerts']}
            />
            <SolutionCard 
              target="Students" 
              desc="Stay organized with personalized timetables, digital learning resources, and achievement tracking."
              features={['Exam Rankings', 'Student Diary', 'Resource Hub']}
            />
          </div>
        </div>
      </section>

      {/* ── COMPARISON SECTION ── */}
      <section style={{ padding: '100px 0', background: '#F8FAFC' }}>
        <div className="container">
          <div className="comparison-box">
             <div className="comp-hdr">
               <h3>Why Switch to EduVantage?</h3>
               <p>The difference between "Managing" and "Optimising" your institution.</p>
             </div>
             <div className="tbl-wrap">
               <table className="comp-table">
                 <thead>
                   <tr>
                     <th>Capability</th>
                     <th className="bad">Legacy Systems / Manual</th>
                     <th className="good">EduVantage AI Platform</th>
                   </tr>
                 </thead>
                 <tbody>
                   <tr><td>Fee Reconciliation</td><td>3-5 Days (Manual Audit)</td><td className="hl">Instant (Auto-Sync)</td></tr>
                   <tr><td>Report Generation</td><td>Weeks of Paperwork</td><td className="hl">30 Seconds (One-Click)</td></tr>
                   <tr><td>Parent Communication</td><td>Reactive (Calls/Notes)</td><td className="hl">Proactive (Auto-SMS)</td></tr>
                   <tr><td>Data Security</td><td>Risk of Loss / Leaks</td><td className="hl">Encrypted Multi-Tenant</td></tr>
                   <tr><td>Payroll Processing</td><td>Hours of Spreadsheet Work</td><td className="hl">2 Minutes (Bulk Sync)</td></tr>
                 </tbody>
               </table>
             </div>
          </div>
        </div>
      </section>

      {/* ── PRICING SECTION ── */}
      <section id="pricing" style={{ padding: '120px 0', background: DARK, color: '#fff' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 80 }}>
            <div className="badge-pill" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff' }}>Simple, Transparent Pricing</div>
            <h2 style={{ fontSize: 52, fontWeight: 900, letterSpacing: '-0.02em' }}>Invest in <span className="text-gradient">Excellence</span></h2>
          </div>

          <div className="pricing-grid">
            <PriceCard 
              name="Basic" 
              price="150" 
              desc="Perfect for growing primary schools."
              features={['Learner Management', 'Academic Grading', 'Basic Reporting', 'SMS Integration', 'Email Support']}
            />
            <PriceCard 
              name="Premium" 
              price="300" 
              featured={true}
              desc="Comprehensive control for top-tier institutions."
              features={['Everything in Basic', 'M-Pesa Auto-Payment', 'Bulk Payroll Engine', 'Advanced Analytics', 'Priority 24/7 Support', 'Custom Branding']}
            />
            <PriceCard 
              name="Enterprise" 
              price="Custom" 
              desc="Multi-campus networks & universities."
              features={['Unlimited Institutions', 'Dedicated Database Instance', 'Custom API Integrations', 'On-Site Training', 'White-Label Branding']}
            />
          </div>
          <p style={{ textAlign: 'center', marginTop: 40, opacity: 0.6, fontSize: 14 }}>* Prices in KES per student per term. Annual discounts available.</p>
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
              <a href="#pricing">Pricing</a>
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

        .comparison-box { background: #fff; border-radius: 40px; padding: 60px; box-shadow: 0 40px 100px rgba(0,0,0,0.05); border: 1px solid rgba(0,0,0,0.03); }
        .comp-hdr { text-align: center; margin-bottom: 50px; }
        .comp-hdr h3 { font-family: var(--font-sora, sans-serif); font-size: 32px; font-weight: 800; color: ${DARK}; margin-bottom: 12px; }
        .comp-hdr p { color: ${SLATE}; font-size: 16px; }
        .comp-table { width: 100%; border-collapse: collapse; }
        .comp-table th { padding: 24px; text-align: left; border-bottom: 2px solid #F1F5F9; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: ${SLATE}; }
        .comp-table td { padding: 24px; border-bottom: 1px solid #F1F5F9; font-size: 15px; font-weight: 600; color: ${DARK}; }
        .comp-table td.hl { color: ${PRIMARY}; font-weight: 800; }
        .bad { color: #EF4444; }
        .good { color: ${ACCENT}; }

        .pricing-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 32px; align-items: stretch; }

        .modules-section { padding: 120px 0; background: #fff; }
        .section-title { font-size: 56px; font-weight: 900; letter-spacing: -0.03em; color: ${DARK}; line-height: 1.1; margin-bottom: 24px; font-family: var(--font-sora, sans-serif); }
        .section-subtitle { font-size: 20px; color: ${SLATE}; }
        .module-grid { display: flex; flex-direction: column; gap: 60px; margin-top: 40px; }
        .module-card { display: flex; gap: 40px; align-items: center; padding: 40px; background: #F8FAFC; border-radius: 32px; border: 1px solid rgba(0,0,0,0.03); transition: 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
        .module-card:hover { transform: translateY(-10px); box-shadow: 0 40px 80px rgba(0,0,0,0.05); background: #fff; border-color: rgba(79, 70, 229, 0.1); }
        .module-card.reverse { flex-direction: row-reverse; }
        .mod-icon { width: 120px; height: 120px; border-radius: 32px; display: flex; align-items: center; justify-content: center; font-size: 60px; flex-shrink: 0; box-shadow: 0 20px 40px rgba(0,0,0,0.05); }
        .mod-content { flex: 1; }
        .mod-content h3 { font-family: var(--font-sora, sans-serif); font-size: 32px; font-weight: 800; margin-bottom: 16px; color: ${DARK}; }
        .mod-content p { color: ${SLATE}; font-size: 16px; line-height: 1.8; margin-bottom: 24px; }
        .mod-features { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 12px; }
        .mod-features li { display: flex; align-items: center; gap: 12px; font-weight: 700; color: ${DARK}; font-size: 15px; }
        .mod-features li::before { content: '✓'; color: #10B981; font-weight: 900; font-size: 18px; }

        @media (max-width: 1000px) {
          .module-card { flex-direction: column; text-align: center; padding: 30px; }
          .module-card.reverse { flex-direction: column; }
          .mod-features li { justify-content: center; }
          .section-title { font-size: 42px; }
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

function SolutionCard({ target, desc, features }) {
  return (
    <div className="s-card">
      <div style={{ fontWeight: 800, fontSize: 13, textTransform: 'uppercase', color: PRIMARY, marginBottom: 12 }}>{target}</div>
      <p style={{ color: SLATE, fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>{desc}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {features.map(f => <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, color: DARK }}> <span style={{ color: ACCENT }}>✓</span> {f}</div>)}
      </div>
      <style jsx>{`
        .s-card { padding: 32px; background: #fff; border-radius: 24px; border: 1px solid rgba(0,0,0,0.05); transition: 0.3s; }
        .s-card:hover { transform: translateY(-5px); box-shadow: 0 20px 40px rgba(0,0,0,0.05); border-color: ${PRIMARY}33; }
      `}</style>
    </div>
  );
}

function PriceCard({ name, price, desc, features, featured }) {
  return (
    <div className={`p-card ${featured ? 'featured' : ''}`}>
      {featured && <div className="feat-badge">MOST POPULAR</div>}
      <div style={{ marginBottom: 30 }}>
        <h4 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>{name}</h4>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span style={{ fontSize: 42, fontWeight: 900 }}>{price === 'Custom' ? '' : 'KES '}{price}</span>
          {price !== 'Custom' && <span style={{ opacity: 0.6, fontSize: 14 }}>/ student</span>}
        </div>
        <p style={{ fontSize: 14, opacity: 0.7, marginTop: 12 }}>{desc}</p>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 40 }}>
        {features.map(f => <div key={f} style={{ display: 'flex', gap: 10, fontSize: 14, fontWeight: 500 }}> <span>✨</span> {f}</div>)}
      </div>
      <Link href="/saas/signup" className={`btn ${featured ? 'btn-primary' : 'btn-outline'}`} style={{ width: '100%', justifyContent: 'center' }}>Get Started</Link>
      <style jsx>{`
        .p-card { padding: 48px; border-radius: 32px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.03); display: flex; flex-direction: column; position: relative; transition: 0.4s; }
        .p-card.featured { background: rgba(255,255,255,0.08); border-color: ${PRIMARY}; transform: scale(1.05); z-index: 2; }
        .p-card:hover { border-color: ${PRIMARY}; background: rgba(255,255,255,0.1); }
        .feat-badge { position: absolute; top: -15px; left: 50%; transform: translateX(-50%); background: ${ACCENT}; color: #fff; padding: 6px 16px; border-radius: 99px; font-size: 11px; font-weight: 800; }
      `}</style>
    </div>
  );
}
