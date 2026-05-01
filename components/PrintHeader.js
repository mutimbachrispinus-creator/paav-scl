'use client';
import { useEffect, useState } from 'react';

const CACHE_KEY = 'paav_cache_db_paav_school_profile';

function readProfileFromCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { v } = JSON.parse(raw);
    return typeof v === 'string' ? JSON.parse(v) : v;
  } catch { return null; }
}

export default function PrintHeader() {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    // Read directly from localStorage — always up-to-date after save()
    function loadProfile() {
      const p = readProfileFromCache();
      if (p) setProfile(p);
    }

    loadProfile();

    // Re-read whenever admin saves settings
    const handleSync = (e) => {
      if (e.detail?.changed?.includes('paav_school_profile')) {
        loadProfile();
      }
    };
    window.addEventListener('paav:sync', handleSync);
    return () => window.removeEventListener('paav:sync', handleSync);
  }, []);

  if (!profile) return null;

  return (
    <div className="print-header no-print-hide">
      <div className="ph-content">
        {profile.logo && (
          <div className="ph-logo-container">
            <img src={profile.logo} alt="School Logo" className="ph-logo" />
          </div>
        )}
        <div className="ph-details">
          <h1 className="ph-name">{profile.name || 'SCHOOL NAME'}</h1>
          {profile.motto && <div className="ph-motto">"{profile.motto}"</div>}
          <div className="ph-contacts">
            {profile.address && <span>📍 {profile.address}</span>}
            {profile.phone && <span>📞 {profile.phone}</span>}
            {profile.email && <span>✉️ {profile.email}</span>}
            {profile.website && <span>🌐 {profile.website}</span>}
          </div>
        </div>
      </div>
      <style jsx>{`
        .print-header {
          display: none;
          text-align: center;
          margin-bottom: 20px;
          border-bottom: 3px double #000;
          padding-bottom: 15px;
        }
        .ph-content {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 20px;
        }
        .ph-logo-container {
          width: 80px;
          height: 80px;
          flex-shrink: 0;
        }
        .ph-logo {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
        .ph-details {
          text-align: center;
        }
        .ph-name {
          font-size: 28px;
          font-weight: 900;
          color: #000;
          margin: 0 0 5px 0;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .ph-motto {
          font-size: 14px;
          font-style: italic;
          font-weight: 600;
          color: #333;
          margin-bottom: 8px;
        }
        .ph-contacts {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 10px 15px;
          font-size: 11px;
          color: #222;
        }
        
        @media print {
          .print-header {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
}
