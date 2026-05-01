'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

const PRIMARY = '#2563EB'; // Deep Blue
const SECONDARY = '#10B981'; // Emerald
const NAVY = '#0F172A';
const SLATE = '#64748B';

export default function ZerakiStyleLanding() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="edu-landing">
      {/* ── HEADER ── */}
      <nav className={`nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="container nav-content">
          <Link href="/" className="logo">
            <img src="/eduvantage-logo.png" alt="EduVantage" />
            <span>EduVantage</span>
          </Link>
          <div className="nav-links">
            <div className="dropdown-wrap">
              <span>Solutions ▾</span>
              <div className="dropdown-menu">
                <a href="#analytics">EduVantage Analytics</a>
                <a href="#finance">EduVantage Finance</a>
                <a href="#messages">EduVantage SMS</a>
                <a href="#learning">EduVantage Learning</a>
              </div>
            </div>
            <a href="#about">About Us</a>
            <a href="#contact">Contact</a>
            <Link href="/saas/signup" className="btn btn-solid">Try for Free</Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-content">
            <h1>Revolutionizing <br/> <span className="text-gradient">School Management</span></h1>
            <p>
              Join 1,000+ top-performing schools across Africa using EduVantage to automate 
              academics, finances, and administration.
            </p>
            <div className="hero-btns">
              <Link href="/saas/signup" className="btn btn-xl btn-solid">Get Started Now</Link>
              <button className="btn btn-xl btn-ghost">📊 See how it works</button>
            </div>
            <div className="hero-stats">
              <div><strong>1.2M+</strong> <span>Students</span></div>
              <div className="divider"></div>
              <div><strong>50K+</strong> <span>Teachers</span></div>
              <div className="divider"></div>
              <div><strong>1K+</strong> <span>Schools</span></div>
            </div>
          </div>
          <div className="hero-image">
            <div className="browser-frame">
              <div className="browser-top">
                <span className="dot"></span><span className="dot"></span><span className="dot"></span>
              </div>
              <img src="/eduvantage-hero.png" alt="Dashboard" />
            </div>
          </div>
        </div>
      </section>

      {/* ── SOLUTIONS ── */}
      <section className="solutions" id="solutions">
        <div className="container">
          <div className="section-hdr">
            <h2 className="tag">OUR SOLUTIONS</h2>
            <h3>Empowering Every Aspect of School Life</h3>
          </div>

          <div className="solution-grid">
            <SolutionCard 
              id="analytics"
              icon="📈" 
              color="#3B82F6"
              title="EduVantage Analytics" 
              desc="Turn your exam results into actionable insights. Identify performance trends, track teacher impact, and boost student scores with data-driven reports."
              features={['Merit Lists', 'Trend Analysis', 'Grade Distribution', 'Subject Ranking']}
            />
            <SolutionCard 
              id="finance"
              icon="💳" 
              color="#10B981"
              title="EduVantage Finance" 
              desc="Simplify fee collection with M-Pesa automation. Track arrears, generate instant receipts, and manage budgets in a secure, transparent environment."
              features={['M-Pesa Paybill Sync', 'Automated Receipts', 'Expense Tracking', 'Fee Reminders']}
            />
            <SolutionCard 
              id="messages"
              icon="💬" 
              color="#F59E0B"
              title="EduVantage SMS" 
              desc="Bridge the gap between home and school. Send bulk SMS alerts for fees, events, and results with 99% delivery rates across all networks."
              features={['Bulk Messaging', 'Custom Templates', 'Delivery Reports', 'Auto-Alerts']}
            />
            <SolutionCard 
              id="learning"
              icon="🎓" 
              color="#8B5CF6"
              title="EduVantage Learning" 
              desc="The classroom of the future. Manage assignments, host online classes, and track curriculum coverage from any device, anywhere."
              features={['Assignment Portal', 'E-Library', 'Progress Tracking', 'Curriculum Mapping']}
            />
          </div>
        </div>
      </section>

      {/* ── TRUSTED BY ── */}
      <section className="trusted">
        <div className="container">
          <p>TRUSTED BY INSTITUTIONS NATIONWIDE</p>
          <div className="logo-strip">
             {/* Use generic school names as placeholders */}
             <span>Alliance High</span>
             <span>Mang'u High</span>
             <span>Kenya High</span>
             <span>Starehe Centre</span>
             <span>Pangani Girls</span>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIAL ── */}
      <section className="testimonial">
        <div className="container">
          <div className="t-box">
             <div className="t-icon">❝</div>
             <p>EduVantage has transformed how we handle data. Our teachers spend less time on paperwork and more time in the classroom. It's simply the best tool for modern schools.</p>
             <div className="t-author">
                <div className="t-avatar">👨‍💼</div>
                <div>
                   <strong>Dr. James Mbugua</strong>
                   <span>Principal, Elite Academy</span>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bottom-cta">
        <div className="container">
           <div className="b-cta-card">
              <h2>Join the EduVantage Network Today</h2>
              <p>Sign up in minutes and take your institution to the next level.</p>
              <Link href="/saas/signup" className="btn btn-xl btn-white">Get Started for Free</Link>
           </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="f-col">
              <div className="logo white">
                <img src="/eduvantage-logo.png" alt="Logo" />
                <span>EduVantage</span>
              </div>
              <p>Building the digital infrastructure for African education.</p>
              <div className="socials">
                 <span>𝕏</span> <span>🅕</span> <span>🅘</span> <span>🅛</span>
              </div>
            </div>
            <div className="f-col">
              <h4>Solutions</h4>
              <a href="#">Analytics</a>
              <a href="#">Finance</a>
              <a href="#">Timetable</a>
              <a href="#">SMS</a>
            </div>
            <div className="f-col">
              <h4>Company</h4>
              <a href="#">About</a>
              <a href="#">Careers</a>
              <a href="#">Contact</a>
              <a href="#">Privacy</a>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; {new Date().getFullYear()} EduVantage Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        .edu-landing { background: #fff; color: ${NAVY}; font-family: 'Inter', sans-serif; overflow-x: hidden; }
        .container { max-width: 1200px; margin: 0 auto; padding: 0 24px; box-sizing: border-box; }
        
        /* Nav */
        .nav { position: fixed; top: 0; left: 0; width: 100%; z-index: 1000; transition: 0.3s; padding: 20px 0; }
        .nav.scrolled { background: #fff; box-shadow: 0 4px 20px rgba(0,0,0,0.06); padding: 12px 0; }
        .nav-content { display: flex; justify-content: space-between; align-items: center; }
        .logo { display: flex; align-items: center; gap: 10px; font-weight: 900; font-size: 20px; color: ${PRIMARY}; text-decoration: none; }
        .logo img { width: 36px; height: 36px; }
        .nav-links { display: flex; align-items: center; gap: 28px; }
        .nav-links a, .dropdown-wrap { font-size: 14.5px; font-weight: 600; color: ${NAVY}; text-decoration: none; cursor: pointer; }
        .dropdown-wrap { position: relative; }
        .dropdown-menu { position: absolute; top: 100%; left: 0; background: #fff; min-width: 220px; padding: 12px; border-radius: 12px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); opacity: 0; visibility: hidden; transform: translateY(10px); transition: 0.3s; }
        .dropdown-wrap:hover .dropdown-menu { opacity: 1; visibility: visible; transform: translateY(0); }
        .dropdown-menu a { display: block; padding: 10px; border-radius: 8px; font-size: 13.5px; }
        .dropdown-menu a:hover { background: #F1F5F9; color: ${PRIMARY}; }

        /* Hero */
        .hero { padding: 160px 0 100px; background: linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%); position: relative; overflow: hidden; }
        .hero-grid { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 80px; align-items: center; }
        .hero-content h1 { font-family: 'Sora', sans-serif; font-size: 68px; font-weight: 800; line-height: 1.05; margin-bottom: 24px; color: ${NAVY}; }
        .text-gradient { background: linear-gradient(135deg, ${PRIMARY}, #8B5CF6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .hero-content p { font-size: 20px; line-height: 1.6; color: ${SLATE}; margin-bottom: 40px; max-width: 550px; }
        .hero-btns { display: flex; gap: 16px; margin-bottom: 50px; }
        .hero-stats { display: flex; gap: 30px; align-items: center; }
        .hero-stats div span { display: block; font-size: 12px; color: ${SLATE}; font-weight: 600; text-transform: uppercase; }
        .hero-stats div strong { font-size: 24px; font-weight: 800; color: ${NAVY}; }
        .divider { width: 1px; height: 30px; background: #CBD5E1; }

        .hero-image { position: relative; }
        .browser-frame { background: #fff; border-radius: 16px; box-shadow: 0 40px 100px rgba(15, 23, 42, 0.12); overflow: hidden; border: 1px solid #E2E8F0; }
        .browser-top { height: 32px; background: #F1F5F9; display: flex; align-items: center; padding: 0 12px; gap: 6px; }
        .dot { width: 8px; height: 8px; border-radius: 50%; background: #CBD5E1; }
        .hero-image img { width: 100%; display: block; }

        /* Solutions */
        .solutions { padding: 120px 0; }
        .section-hdr { text-align: center; margin-bottom: 80px; }
        .tag { color: ${PRIMARY}; font-weight: 800; font-size: 13px; letter-spacing: 2px; margin-bottom: 12px; }
        .section-hdr h3 { font-family: 'Sora', sans-serif; font-size: 42px; font-weight: 800; color: ${NAVY}; }
        .solution-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 32px; }

        /* Cards */
        .btn { padding: 12px 24px; border-radius: 10px; font-weight: 700; font-size: 15px; cursor: pointer; transition: 0.2s; text-decoration: none; display: inline-block; }
        .btn-solid { background: ${PRIMARY}; color: #fff; }
        .btn-solid:hover { background: #1D4ED8; transform: translateY(-2px); box-shadow: 0 10px 20px rgba(37, 99, 235, 0.25); }
        .btn-outline { border: 2px solid ${PRIMARY}; color: ${PRIMARY}; }
        .btn-outline:hover { background: ${PRIMARY}; color: #fff; }
        .btn-ghost { color: ${PRIMARY}; }
        .btn-xl { padding: 18px 40px; font-size: 17px; }
        .btn-white { background: #fff; color: ${PRIMARY}; }

        /* Trusted */
        .trusted { padding: 60px 0; border-top: 1px solid #F1F5F9; border-bottom: 1px solid #F1F5F9; }
        .trusted p { text-align: center; font-size: 11px; font-weight: 800; color: ${SLATE}; letter-spacing: 1px; margin-bottom: 30px; }
        .logo-strip { display: flex; justify-content: space-around; align-items: center; opacity: 0.5; font-weight: 800; font-size: 18px; filter: grayscale(1); }

        /* Testimonial */
        .testimonial { padding: 100px 0; background: #F8FAFC; }
        .t-box { max-width: 800px; margin: 0 auto; text-align: center; }
        .t-icon { font-size: 80px; color: ${PRIMARY}; opacity: 0.1; line-height: 1; margin-bottom: -40px; }
        .t-box p { font-size: 24px; line-height: 1.6; color: ${NAVY}; font-weight: 500; margin-bottom: 40px; font-style: italic; }
        .t-author { display: flex; align-items: center; justify-content: center; gap: 16px; }
        .t-avatar { width: 50px; height: 50px; background: ${PRIMARY}; color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; }
        .t-author div { text-align: left; }
        .t-author strong { display: block; font-size: 16px; }
        .t-author span { font-size: 13px; color: ${SLATE}; }

        /* Bottom CTA */
        .bottom-cta { padding: 100px 0; }
        .b-cta-card { background: ${PRIMARY}; border-radius: 32px; padding: 80px 40px; text-align: center; color: #fff; }
        .b-cta-card h2 { font-family: 'Sora', sans-serif; font-size: 48px; font-weight: 800; margin-bottom: 20px; }
        .b-cta-card p { font-size: 20px; opacity: 0.9; margin-bottom: 40px; }

        /* Footer */
        .footer { background: ${NAVY}; padding: 100px 0 40px; color: #fff; }
        .footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 80px; margin-bottom: 80px; }
        .f-col h4 { font-size: 16px; font-weight: 800; margin-bottom: 24px; color: ${SECONDARY}; }
        .f-col a { display: block; color: rgba(255,255,255,0.6); text-decoration: none; margin-bottom: 12px; font-size: 14.5px; transition: 0.2s; }
        .f-col a:hover { color: #fff; }
        .f-col p { color: rgba(255,255,255,0.6); margin-top: 20px; line-height: 1.6; }
        .logo.white { color: #fff; }
        .socials { display: flex; gap: 16px; margin-top: 24px; font-size: 20px; opacity: 0.6; }
        .footer-bottom { border-top: 1px solid rgba(255,255,255,0.1); padding-top: 40px; text-align: center; color: rgba(255,255,255,0.4); font-size: 13px; }

        @media (max-width: 900px) {
          .hero-grid { grid-template-columns: 1fr; text-align: center; gap: 50px; }
          .hero-content h1 { font-size: 42px; }
          .hero-content p { margin: 0 auto 40px; }
          .hero-btns { justify-content: center; }
          .hero-stats { justify-content: center; }
          .solution-grid { grid-template-columns: 1fr; }
          .b-cta-card h2 { font-size: 32px; }
          .nav-links { display: none; }
          .footer-grid { grid-template-columns: 1fr; gap: 50px; text-align: center; }
          .f-col .logo { justify-content: center; }
          .socials { justify-content: center; }
        }
      `}</style>
    </div>
  );
}

function SolutionCard({ icon, title, desc, features, color, id }) {
  return (
    <div className="s-card" id={id}>
      <div className="s-icon" style={{ background: color + '15', color: color }}>{icon}</div>
      <h4>{title}</h4>
      <p>{desc}</p>
      <ul className="s-list">
        {features.map(f => <li key={f}><span>✓</span> {f}</li>)}
      </ul>
      <style jsx>{`
        .s-card { padding: 48px; background: #fff; border-radius: 24px; border: 1px solid #F1F5F9; transition: 0.3s; }
        .s-card:hover { border-color: ${PRIMARY}33; transform: translateY(-8px); box-shadow: 0 30px 60px rgba(15, 23, 42, 0.08); }
        .s-icon { width: 64px; height: 64px; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 32px; margin-bottom: 28px; }
        h4 { font-family: 'Sora', sans-serif; font-size: 24px; font-weight: 800; margin-bottom: 16px; color: ${NAVY}; }
        p { color: ${SLATE}; line-height: 1.7; margin-bottom: 24px; font-size: 15.5px; }
        .s-list { list-style: none; padding: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .s-list li { font-size: 13.5px; font-weight: 600; color: ${NAVY}; display: flex; align-items: center; gap: 8px; }
        .s-list li span { color: ${PRIMARY}; font-weight: 900; }
      `}</style>
    </div>
  );
}
