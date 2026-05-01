'use client';
import { useState, useEffect, useRef } from 'react';

const QA = [
  { q: "How do I add marks?", a: "Go to the 'Grades' tab, select your grade and assessment, then enter scores in the table. They save automatically!" },
  { q: "How much does it cost?", a: "EduVantage offers flexible pricing starting from a free 30-day trial. Schools can choose Termly or Annual billing cycles." },
  { q: "Can parents see fees?", a: "Yes! Parents have a dedicated login where they can view their child's fee statements and pay via M-Pesa." },
  { q: "What is the Merit List?", a: "The Merit List automatically ranks students based on CBE points across all subjects, complete with medals for top performers." },
  { q: "How do I contact support?", a: "You can reach us at support@eduvantage.ke or via the 'Profile' section within your portal." }
];

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([{ type: 'bot', text: 'Hi! I am the EduVantage Assistant. How can I help you today?' }]);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleAsk = (item) => {
    setMessages(prev => [...prev, { type: 'user', text: item.q }]);
    setTimeout(() => {
      setMessages(prev => [...prev, { type: 'bot', text: item.a }]);
    }, 600);
  };

  return (
    <div className="chatbot-wrapper">
      {!isOpen && (
        <button className="chat-fab" onClick={() => setIsOpen(true)}>
           <span>💬</span>
           <div className="fab-label">Chat with us</div>
        </button>
      )}

      {isOpen && (
        <div className="chat-window">
          <div className="chat-hdr">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="bot-avatar">🤖</div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 14 }}>EduVantage Bot</div>
                <div style={{ fontSize: 10, opacity: 0.8 }}>Online & ready to help</div>
              </div>
            </div>
            <button className="chat-close" onClick={() => setIsOpen(false)}>✕</button>
          </div>

          <div className="chat-body" ref={scrollRef}>
            {messages.map((m, i) => (
              <div key={i} className={`chat-msg ${m.type}`}>
                <div className="msg-bubble">{m.text}</div>
              </div>
            ))}
          </div>

          <div className="chat-ftr">
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', marginBottom: 8 }}>Quick Questions:</div>
            <div className="quick-replies">
              {QA.map((item, i) => (
                <button key={i} className="qr-btn" onClick={() => handleAsk(item)}>{item.q}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .chatbot-wrapper { position: fixed; bottom: 30px; right: 30px; z-index: 9999; font-family: inherit; }
        .chat-fab { 
          background: linear-gradient(135deg, #2563EB, #1D4ED8);
          color: #fff; border: none; padding: 15px 25px; border-radius: 50px;
          font-size: 24px; cursor: pointer; display: flex; align-items: center; gap: 10px;
          box-shadow: 0 10px 25px rgba(37,99,235,0.4); transition: 0.3s;
        }
        .chat-fab:hover { transform: translateY(-5px) scale(1.05); }
        .fab-label { font-size: 14px; fontWeight: 700; }

        .chat-window {
          width: 350px; height: 500px; background: #fff; border-radius: 20px;
          box-shadow: 0 15px 50px rgba(0,0,0,0.15); display: flex; flexDirection: column;
          overflow: hidden; border: 1.5px solid #E2E8F0; animation: slideUp 0.3s ease-out;
        }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

        .chat-hdr { background: #0F172A; color: #fff; padding: 20px; display: flex; justify-content: space-between; alignItems: center; }
        .bot-avatar { background: #1E293B; width: 32px; height: 32px; border-radius: 50%; display: flex; alignItems: center; justifyContent: center; font-size: 18px; }
        .chat-close { background: none; border: none; color: #fff; fontSize: 20px; cursor: pointer; opacity: 0.6; }
        .chat-close:hover { opacity: 1; }

        .chat-body { flex: 1; padding: 20px; overflow-y: auto; background: #F8FAFC; display: flex; flexDirection: column; gap: 15px; }
        .chat-msg { display: flex; }
        .chat-msg.bot { justify-content: flex-start; }
        .chat-msg.user { justify-content: flex-end; }
        .msg-bubble { 
          max-width: 85%; padding: 10px 15px; border-radius: 15px; font-size: 13px; line-height: 1.5; 
          box-shadow: 0 2px 5px rgba(0,0,0,0.05);
        }
        .bot .msg-bubble { background: #fff; color: #1E293B; border-bottom-left-radius: 2px; }
        .user .msg-bubble { background: #2563EB; color: #fff; border-bottom-right-radius: 2px; }

        .chat-ftr { padding: 15px; background: #fff; border-top: 1.5px solid #E2E8F0; }
        .quick-replies { display: flex; flex-wrap: wrap; gap: 6px; }
        .qr-btn { 
          background: #F1F5F9; border: 1px solid #E2E8F0; border-radius: 20px;
          padding: 6px 12px; font-size: 11px; cursor: pointer; transition: 0.2s; color: #475569;
        }
        .qr-btn:hover { background: #2563EB; color: #fff; border-color: #2563EB; }
      `}</style>
    </div>
  );
}
