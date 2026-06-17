import { useState, useEffect, useRef, useCallback } from 'react';
import { chatAPI } from '../services/api';

const SUGGESTED = [
  'What are Shivakumar\'s key skills?',
  'Tell me about his projects',
  'Is he available for work?',
  'How can I contact him?',
  'What technologies does he use?',
];

const BOT_AVATAR = (
  <div style={{
    width: 28, height: 28, borderRadius: 8, flexShrink: 0,
    background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '.65rem', fontWeight: 900, color: '#fff', letterSpacing: '-.5px',
  }}>SB</div>
);

function TypingDots() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 0' }}>
      {[0, 1, 2].map((i) => (
        <span key={i} style={{
          width: 6, height: 6, borderRadius: '50%',
          background: 'var(--text-muted)',
          animation: `chatDot .9s ease-in-out ${i * .18}s infinite`,
          display: 'inline-block',
        }} />
      ))}
    </div>
  );
}

function Message({ msg }) {
  const isBot = msg.role === 'assistant';
  return (
    <div style={{
      display: 'flex', gap: '.625rem', alignItems: 'flex-start',
      justifyContent: isBot ? 'flex-start' : 'flex-end',
      marginBottom: '.875rem',
    }}>
      {isBot && BOT_AVATAR}
      <div style={{
        maxWidth: '80%',
        background: isBot ? 'var(--surface-alt)' : 'linear-gradient(135deg,#3b82f6,#2563eb)',
        color: isBot ? 'var(--text)' : '#fff',
        borderRadius: isBot ? '4px 14px 14px 14px' : '14px 4px 14px 14px',
        padding: '.625rem .875rem',
        fontSize: '.84rem', lineHeight: 1.65,
        boxShadow: isBot ? 'none' : '0 4px 14px rgba(37,99,235,.3)',
        whiteSpace: 'pre-wrap', wordBreak: 'break-word',
      }}>
        {msg.content}
        {msg.streaming && (
          <span style={{
            display: 'inline-block', width: 2, height: '1em',
            background: 'currentColor', marginLeft: 2, verticalAlign: 'text-bottom',
            animation: 'chatCursor .6s step-end infinite',
          }} />
        )}
      </div>
    </div>
  );
}

export default function PortfolioChat() {
  const [open, setOpen]         = useState(false);
  const [online, setOnline]     = useState(null);   // null=checking, true/false
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState('');
  const [busy, setBusy]         = useState(false);
  const [showSugg, setShowSugg] = useState(true);
  const bottomRef               = useRef(null);
  const inputRef                = useRef(null);
  const abortRef                = useRef(null);

  // Check Ollama status once on mount
  useEffect(() => {
    chatAPI.status()
      .then((r) => setOnline(r.data.online))
      .catch(() => setOnline(false));
  }, []);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150);
  }, [open]);

  const sendMessage = useCallback(async (text) => {
    const userText = (text || input).trim();
    if (!userText || busy) return;

    setInput('');
    setShowSugg(false);
    setBusy(true);

    const userMsg = { role: 'user', content: userText };
    const history = [...messages, userMsg];
    setMessages([...history, { role: 'assistant', content: '', streaming: true }]);

    try {
      const res = await chatAPI.stream(
        history.map((m) => ({ role: m.role, content: m.content }))
      );

      if (!res.ok) {
        throw new Error('AI service error');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = '';

      abortRef.current = reader;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(Boolean);

        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.message?.content) {
              full += data.message.content;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  role: 'assistant', content: full, streaming: !data.done,
                };
                return updated;
              });
            }
          } catch { /* partial JSON line — skip */ }
        }
      }

      // Final — remove streaming cursor
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'assistant', content: full, streaming: false };
        return updated;
      });
    } catch (err) {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: 'assistant',
          content: online === false
            ? '⚠️ AI service is offline. Please make sure Ollama is running locally with llama3.2.'
            : '⚠️ Something went wrong. Please try again.',
          streaming: false,
        };
        return updated;
      });
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  }, [input, messages, busy, online]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const clearChat = () => {
    setMessages([]);
    setShowSugg(true);
    setInput('');
  };

  return (
    <>
      {/* CSS */}
      <style>{`
        @keyframes chatDot {
          0%,60%,100% { transform: translateY(0); opacity:.4; }
          30% { transform: translateY(-5px); opacity:1; }
        }
        @keyframes chatCursor {
          0%,100% { opacity:1; } 50% { opacity:0; }
        }
        @keyframes chatSlideUp {
          from { opacity:0; transform:translateY(24px) scale(.97); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
        @keyframes chatPulse {
          0%,100%{ box-shadow: 0 0 0 0 rgba(59,130,246,.5); }
          50%    { box-shadow: 0 0 0 10px rgba(59,130,246,0); }
        }
        .chat-panel { animation: chatSlideUp .22s ease both; }
        .chat-fab { animation: chatPulse 2.5s ease infinite; }
        .chat-send:hover { opacity:.88 !important; transform: scale(1.05); }
        .chat-msg-input:focus { outline:none; border-color: var(--primary) !important; box-shadow: 0 0 0 3px var(--primary-lt); }
        .sugg-chip:hover { background: var(--primary-lt) !important; color: var(--primary) !important; border-color: var(--primary) !important; }
      `}</style>

      {/* Floating Action Button */}
      {!open && (
        <button
          className={online ? 'chat-fab' : ''}
          onClick={() => setOpen(true)}
          title="Ask about Shivakumar"
          style={{
            position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 300,
            display: 'flex', alignItems: 'center', gap: '.625rem',
            padding: '.75rem 1.375rem',
            background: 'linear-gradient(135deg,#3b82f6,#2563eb)',
            color: '#fff', border: 'none', borderRadius: 100,
            fontWeight: 700, fontSize: '.875rem', cursor: 'pointer',
            boxShadow: '0 8px 32px rgba(37,99,235,.45)',
            fontFamily: 'inherit', transition: 'all .2s',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
          </svg>
          Ask AI
          {online !== null && (
            <span style={{
              width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
              background: online ? '#34d399' : '#f87171',
            }} />
          )}
        </button>
      )}

      {/* Chat Panel */}
      {open && (
        <div
          className="chat-panel"
          style={{
            position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 300,
            width: 380, maxHeight: 580,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 20,
            boxShadow: '0 24px 64px rgba(0,0,0,.22)',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{
            padding: '1rem 1.125rem .875rem',
            background: 'linear-gradient(135deg,#1e3a5f,#2d1b69)',
            display: 'flex', alignItems: 'center', gap: '.75rem',
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '.85rem', fontWeight: 900, color: '#fff', flexShrink: 0,
            }}>SB</div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: '.9rem', color: '#fff', lineHeight: 1.3 }}>
                Shivakumar's AI
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: .375 + 'rem', marginTop: '.1rem' }}>
                <span style={{
                  width: 6, height: 6, borderRadius: '50', flexShrink: 0,
                  background: online ? '#34d399' : '#f87171',
                }} />
                <span style={{ fontSize: '.7rem', color: 'rgba(255,255,255,.65)', fontWeight: 500 }}>
                  {online === null ? 'Connecting…' : online ? 'Online · llama3.2' : 'Offline · Start Ollama'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
              {messages.length > 0 && (
                <button onClick={clearChat} title="Clear chat" style={{
                  background: 'rgba(255,255,255,.1)', border: 'none', cursor: 'pointer',
                  width: 30, height: 30, borderRadius: 8,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,.7)',
                }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/>
                  </svg>
                </button>
              )}
              <button onClick={() => setOpen(false)} title="Close" style={{
                background: 'rgba(255,255,255,.1)', border: 'none', cursor: 'pointer',
                width: 30, height: 30, borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,.7)',
              }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: '1rem',
            scrollbarWidth: 'thin', scrollbarColor: 'var(--border) transparent',
            minHeight: 0,
          }}>
            {/* Welcome */}
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', padding: '1rem 0 .5rem' }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 14, margin: '0 auto .875rem',
                  background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.1rem', fontWeight: 900, color: '#fff',
                }}>SB</div>
                <div style={{ fontWeight: 800, fontSize: '.95rem', marginBottom: '.375rem' }}>
                  Hi! I'm Shivakumar's AI
                </div>
                <div style={{ fontSize: '.8rem', color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: 260, margin: '0 auto' }}>
                  Ask me anything about Shivakumar's skills, experience, projects, or availability.
                </div>
              </div>
            )}

            {/* Suggested questions */}
            {showSugg && messages.length === 0 && (
              <div style={{ marginTop: '.875rem' }}>
                <div style={{ fontSize: '.7rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '.5rem', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                  Suggested questions
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.375rem' }}>
                  {SUGGESTED.map((q) => (
                    <button
                      key={q}
                      className="sugg-chip"
                      onClick={() => sendMessage(q)}
                      style={{
                        textAlign: 'left', padding: '.5rem .75rem',
                        background: 'var(--surface-alt)', border: '1px solid var(--border)',
                        borderRadius: 10, fontSize: '.8rem', fontWeight: 600,
                        color: 'var(--text-sec)', cursor: 'pointer', fontFamily: 'inherit',
                        transition: 'all .15s',
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Chat messages — skip empty streaming placeholder, dots handle that */}
            {messages.map((msg, i) => {
              if (msg.streaming && msg.content === '') return null;
              return <Message key={i} msg={msg} />;
            })}

            {/* Typing dots — only while waiting for first character */}
            {busy && messages[messages.length - 1]?.content === '' && (
              <div style={{ display: 'flex', gap: '.625rem', alignItems: 'flex-start', marginBottom: '.875rem' }}>
                {BOT_AVATAR}
                <div style={{
                  background: 'var(--surface-alt)', borderRadius: '4px 14px 14px 14px',
                  padding: '.625rem .875rem',
                }}>
                  <TypingDots />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: '.875rem 1rem',
            borderTop: '1px solid var(--border)',
            background: 'var(--surface)',
          }}>
            <div style={{ display: 'flex', gap: '.5rem', alignItems: 'flex-end' }}>
              <textarea
                ref={inputRef}
                className="chat-msg-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask about Shivakumar…"
                rows={1}
                disabled={busy || online === false}
                style={{
                  flex: 1, resize: 'none', padding: '.65rem .875rem',
                  border: '1.5px solid var(--border)',
                  borderRadius: 12, background: 'var(--bg-alt)',
                  color: 'var(--text)', fontSize: '.855rem',
                  fontFamily: 'inherit', lineHeight: 1.5,
                  transition: 'border-color .15s, box-shadow .15s',
                  maxHeight: 100, overflowY: 'auto',
                  scrollbarWidth: 'none',
                  opacity: (busy || online === false) ? .6 : 1,
                }}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
                }}
              />
              <button
                className="chat-send"
                onClick={() => sendMessage()}
                disabled={!input.trim() || busy || online === false}
                style={{
                  width: 40, height: 40, borderRadius: 12, border: 'none',
                  background: !input.trim() || busy || online === false
                    ? 'var(--surface-alt)' : 'linear-gradient(135deg,#3b82f6,#2563eb)',
                  color: !input.trim() || busy || online === false ? 'var(--text-muted)' : '#fff',
                  cursor: !input.trim() || busy ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  transition: 'all .15s', boxShadow: input.trim() && !busy ? '0 4px 12px rgba(37,99,235,.3)' : 'none',
                }}
              >
                {busy
                  ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin .7s linear infinite' }}><circle cx="12" cy="12" r="10" strokeOpacity=".25"/><path d="M12 2a10 10 0 0110 10" /></svg>
                  : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                }
              </button>
            </div>
            <div style={{
              fontSize: '.65rem', color: 'var(--text-muted)', textAlign: 'center',
              marginTop: '.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.3rem',
            }}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              Powered by Ollama · Only knows about Shivakumar
            </div>
          </div>
        </div>
      )}
    </>
  );
}
