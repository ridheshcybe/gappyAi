// frontend/components/IncidentCopilot.jsx
import { useState, useRef, useEffect } from 'react';
import { copilotChat, getCopilotConversation } from '../lib/api';

const SUGGESTIONS = [
  'Why is this P0?',
  'Explain for a manager',
  'What should I do first?',
  'Generate summary',
  'Have we seen this before?'
];

export default function IncidentCopilot({ incidentId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    getCopilotConversation(incidentId).then(r => setMessages(r.messages || []));
  }, [incidentId]);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  async function send(text) {
    const userMsg = text || input;
    if (!userMsg.trim() || loading) return;

    const newMessages = [...messages, { role: 'user', content: userMsg }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await copilotChat(incidentId, userMsg, messages);
      setMessages([...newMessages, { role: 'assistant', content: res.reply }]);
    } catch {
      setMessages([...newMessages, {
        role: 'assistant',
        content: '⚠️ Copilot unavailable. Retry.'
      }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="copilot">
      <div className="copilot-header">
        <h3>🤖 Incident Copilot</h3>
        <span className="badge">context-aware</span>
      </div>

      <div className="copilot-messages" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="empty">
            <p>Ask me anything about this incident.</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`msg msg-${m.role}`}>
            <div className="msg-avatar">{m.role === 'user' ? '🧑‍💻' : '🤖'}</div>
            <div className="msg-content">{m.content}</div>
          </div>
        ))}
        {loading && <div className="msg msg-assistant"><div className="msg-avatar">🤖</div><div className="typing">…</div></div>}
      </div>

      {messages.length === 0 && (
        <div className="suggestions">
          {SUGGESTIONS.map(s => (
            <button key={s} className="chip" onClick={() => send(s)}>{s}</button>
          ))}
        </div>
      )}

      <form className="copilot-input" onSubmit={e => { e.preventDefault(); send(); }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask about this incident…"
          disabled={loading}
        />
        <button type="submit" disabled={loading || !input.trim()}>Send</button>
      </form>
    </div>
  );
}
