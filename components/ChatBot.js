'use client';
import { useState, useEffect, useRef } from 'react';

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Hello! I am your EduVantage assistant. How can I help you today? 🎓' }
  ]);
  const [input, setInput] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const responses = {
    'features': 'EduVantage offers Academic Management, Financial Control, Communication Hub, and more! 🚀',
    'price': 'We offer a 30-day free trial. Afterwards, plans start from just $1 per student per term. 💰',
    'trial': 'You can start your 30-day free trial by clicking the "Get Started Free" button! ✨',
    'contact': 'You can reach our support team at support@eduvantage.app or call 0700111222. 📞',
    'default': 'That is a great question! I am still learning, but you can explore our features or start a trial to see for yourself! 🌟'
  };

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');

    setTimeout(() => {
      let botResponse = responses.default;
      const q = userMsg.toLowerCase();
      if (q.includes('feature')) botResponse = responses.features;
      else if (q.includes('price') || q.includes('cost')) botResponse = responses.price;
      else if (q.includes('trial')) botResponse = responses.trial;
      else if (q.includes('contact') || q.includes('help')) botResponse = responses.contact;

      setMessages(prev => [...prev, { role: 'bot', text: botResponse }]);
    }, 1000);
  };

  return (
    <div className="chatbot-root">
      {!isOpen && (
        <button className="chat-trigger" onClick={() => setIsOpen(true)}>
          <span className="icon">💬</span>
          <span className="label">Need Help?</span>
        </button>
      )}

      {isOpen && (
        <div className="chat-window">
          <div className="chat-hdr">
            <div className="bot-info">
              <div className="avatar">🤖</div>
              <div>
                <div className="name">EduBot</div>
                <div className="status">Online</div>
              </div>
            </div>
            <button className="close" onClick={() => setIsOpen(false)}>✕</button>
          </div>

          <div className="chat-body" ref={scrollRef}>
            {messages.map((m, i) => (
              <div key={i} className={`msg-wrap ${m.role}`}>
                <div className="msg-bubble">{m.text}</div>
              </div>
            ))}
          </div>

          <div className="chat-input">
            <input 
              value={input} 
              onChange={e => setInput(e.target.value)} 
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Type your question..."
            />
            <button onClick={handleSend}>➔</button>
          </div>
        </div>
      )}

      <style jsx>{`
        .chatbot-root { position: fixed; bottom: 40px; right: 40px; z-index: 2000; }
        
        .chat-trigger { 
          display: flex; align-items: center; gap: 12px; padding: 12px 24px;
          background: #4F46E5; color: #fff; border-radius: 99px; border: none;
          cursor: pointer; font-weight: 800; box-shadow: 0 20px 40px rgba(79, 70, 229, 0.4);
          transition: 0.3s;
        }
        .chat-trigger:hover { transform: scale(1.05) translateY(-5px); }
        .chat-trigger .icon { fontSize: 24px; }

        .chat-window {
          width: 380px; height: 500px; background: #fff; border-radius: 24px;
          display: flex; flex-direction: column; overflow: hidden;
          box-shadow: 0 40px 100px rgba(0,0,0,0.15); border: 1px solid rgba(0,0,0,0.05);
          animation: slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        @keyframes slideUp { from { opacity: 0; transform: translateY(40px); } }

        .chat-hdr { 
          padding: 20px; background: #4F46E5; color: #fff; 
          display: flex; justify-content: space-between; align-items: center;
        }
        .bot-info { display: flex; gap: 12px; align-items: center; }
        .bot-info .avatar { width: 40px; height: 40px; background: rgba(255,255,255,0.2); border-radius: 12px; display: flex; align-items: center; justify-content: center; fontSize: 20px; }
        .name { font-weight: 800; }
        .status { font-size: 11px; opacity: 0.8; display: flex; align-items: center; gap: 4px; }
        .status::before { content: ''; width: 6px; height: 6px; background: #10B981; border-radius: 50%; }
        .close { background: none; border: none; color: #fff; cursor: pointer; fontSize: 18px; opacity: 0.6; }
        .close:hover { opacity: 1; }

        .chat-body { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 16px; background: #F8FAFC; }
        .msg-wrap { display: flex; width: 100%; }
        .msg-wrap.bot { justify-content: flex-start; }
        .msg-wrap.user { justify-content: flex-end; }
        .msg-bubble { 
          max-width: 80%; padding: 12px 16px; border-radius: 16px; font-size: 14px; line-height: 1.5; font-weight: 500;
        }
        .bot .msg-bubble { background: #fff; color: #1E293B; border-bottom-left-radius: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
        .user .msg-bubble { background: #4F46E5; color: #fff; border-bottom-right-radius: 4px; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.2); }

        .chat-input { padding: 16px; background: #fff; display: flex; gap: 12px; border-top: 1px solid #F1F5F9; }
        .chat-input input { flex: 1; border: none; background: #F1F5F9; padding: 12px 16px; border-radius: 12px; font-size: 14px; outline: none; }
        .chat-input button { width: 44px; height: 44px; background: #4F46E5; color: #fff; border: none; border-radius: 12px; cursor: pointer; font-weight: 800; display: flex; align-items: center; justify-content: center; transition: 0.2s; }
        .chat-input button:hover { transform: scale(1.1); }
      `}</style>
    </div>
  );
}
