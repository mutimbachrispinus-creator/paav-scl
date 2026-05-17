import { kvGet } from '@/lib/db';
import DefaultPrivacy from './DefaultPrivacy';

export default async function PrivacyPage() {
  const customContent = await kvGet('paav_legal_privacy', null, 'platform-master');
  
  if (customContent) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0B0F19', color: '#E2E8F0', padding: '60px 20px', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', background: '#1E293B', padding: 40, borderRadius: 16 }}>
          <div dangerouslySetInnerHTML={{ __html: customContent }} />
        </div>
      </div>
    );
  }

  return <DefaultPrivacy />;
}
