import { useEffect, useRef, useState } from 'react';
import { Send, MessageCircle, AlertTriangle, Wifi } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useMessages } from '../context/MessagesContext';
import { useApp } from '../context/AppContext';
import { isFirebaseConfigured } from '../lib/firebase';

const CHILDREN = [
  { id: '1', name: '小明', age: 7, avatar: '🦊' },
  { id: '2', name: '小華', age: 9, avatar: '🐼' },
  { id: '3', name: '小芸', age: 6, avatar: '🦋' },
];

function formatTime(ms: number) {
  const d = new Date(ms);
  const now = new Date();
  const isToday =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  return isToday
    ? d.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function Messages() {
  const { messages, send, markAllRead, unreadCount } = useMessages();
  const { selectedChild, setSelectedChild } = useApp();
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    markAllRead('doctor');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    setSending(true);
    await send(text, 'doctor');
    setSending(false);
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex h-full gap-6" style={{ fontFamily: 'Inter, Nunito, sans-serif' }}>
      {/* Left panel — patient list */}
      <aside
        className="w-64 flex-shrink-0 rounded-3xl border border-slate-100 bg-white shadow-sm flex flex-col overflow-hidden"
      >
        <div className="p-5 border-b border-slate-100">
          <div style={{ fontWeight: 800, fontSize: 16, color: '#0f172a' }}>患者列表</div>
          <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>點擊切換對話</div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {CHILDREN.map(child => {
            const active = child.id === selectedChild.id;
            return (
              <button
                key={child.id}
                onClick={() => setSelectedChild(child)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all text-left"
                style={{
                  background: active ? 'linear-gradient(135deg, #e0f9f0, #dbeafe)' : 'transparent',
                  border: active ? '1.5px solid #99f6e4' : '1.5px solid transparent',
                }}
              >
                <span className="text-2xl">{child.avatar}</span>
                <div className="flex-1 min-w-0">
                  <div style={{ fontWeight: 700, fontSize: 14, color: active ? '#0f766e' : '#334155' }}>
                    {child.name}
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>{child.age} 歲</div>
                </div>
                {active && unreadCount > 0 && (
                  <span
                    className="rounded-full px-1.5 py-0.5 text-white"
                    style={{ fontSize: 10, fontWeight: 800, background: '#f43f5e', minWidth: 18, textAlign: 'center' }}
                  >
                    {unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </aside>

      {/* Right panel — chat window */}
      <div className="flex-1 flex flex-col rounded-3xl border border-slate-100 bg-white shadow-sm overflow-hidden">
        {/* Header */}
        <div
          className="flex items-center gap-4 px-6 py-4 border-b border-slate-100"
          style={{ background: 'linear-gradient(135deg,#f0fdfa,#eff6ff)' }}
        >
          <span className="text-3xl">{selectedChild.avatar}</span>
          <div className="flex-1">
            <div style={{ fontWeight: 800, fontSize: 17, color: '#0f172a' }}>
              {selectedChild.name}
            </div>
            <div className="flex items-center gap-1.5">
              <Wifi size={11} className="text-emerald-500" />
              <span style={{ fontSize: 12, color: '#10b981', fontWeight: 600 }}>
                {isFirebaseConfigured ? '即時連線中' : '示範模式（未連接 Firebase）'}
              </span>
            </div>
          </div>
          <MessageCircle size={20} className="text-teal-400" />
        </div>

        {/* Firebase not configured notice */}
        {!isFirebaseConfigured && (
          <div
            className="flex items-center gap-3 px-5 py-3 border-b border-amber-100"
            style={{ background: '#fffbeb' }}
          >
            <AlertTriangle size={15} className="text-amber-500 flex-shrink-0" />
            <span style={{ fontSize: 12, color: '#92400e', fontWeight: 600 }}>
              Firebase 尚未設定，目前為本機示範模式。訊息不會跨裝置同步。
              請依照 <code style={{ background: '#fef3c7', borderRadius: 4, padding: '1px 4px' }}>.env.example</code> 設定後重啟。
            </span>
          </div>
        )}

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          <AnimatePresence initial={false}>
            {messages.map(msg => {
              const isDoctor = msg.senderId === 'doctor';
              return (
                <motion.div
                  key={msg.id}
                  className={`flex ${isDoctor ? 'justify-end' : 'justify-start'}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {!isDoctor && (
                    <span className="text-2xl mr-2 self-end mb-1">{selectedChild.avatar}</span>
                  )}
                  <div className="max-w-[66%]">
                    <div
                      className={`flex items-center gap-2 mb-1 ${isDoctor ? 'justify-end' : 'justify-start'}`}
                    >
                      <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>
                        {msg.senderName} · {formatTime(msg.timestamp)}
                      </span>
                    </div>
                    <div
                      className="px-4 py-3 rounded-3xl"
                      style={{
                        background: isDoctor
                          ? 'linear-gradient(135deg,#0d9488,#0891b2)'
                          : '#f1f5f9',
                        color: isDoctor ? '#fff' : '#0f172a',
                        fontWeight: 500,
                        fontSize: 14,
                        lineHeight: 1.6,
                        borderRadius: isDoctor ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                        boxShadow: isDoctor
                          ? '0 4px 14px rgba(13,148,136,0.28)'
                          : '0 2px 8px rgba(0,0,0,0.06)',
                      }}
                    >
                      {msg.text}
                    </div>
                  </div>
                  {isDoctor && (
                    <span className="text-xl ml-2 self-end mb-1">👨‍⚕️</span>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>

          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-48 text-slate-300">
              <MessageCircle size={48} strokeWidth={1.2} />
              <p className="mt-3" style={{ fontWeight: 600, fontSize: 14 }}>
                還沒有訊息，發送第一則訊息給 {selectedChild.name} 吧！
              </p>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div
          className="px-5 py-4 border-t border-slate-100 flex items-end gap-3"
          style={{ background: '#fafafa' }}
        >
          <textarea
            rows={1}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder={`傳送訊息給 ${selectedChild.name}…`}
            className="flex-1 resize-none rounded-2xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-transparent"
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: '#0f172a',
              fontFamily: 'Inter, Nunito, sans-serif',
              maxHeight: 120,
              overflowY: 'auto',
              background: '#fff',
            }}
            onInput={e => {
              const t = e.target as HTMLTextAreaElement;
              t.style.height = 'auto';
              t.style.height = `${t.scrollHeight}px`;
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="flex items-center justify-center rounded-2xl transition-all"
            style={{
              width: 48,
              height: 48,
              background: input.trim()
                ? 'linear-gradient(135deg,#0d9488,#0891b2)'
                : '#e2e8f0',
              flexShrink: 0,
              boxShadow: input.trim() ? '0 4px 14px rgba(13,148,136,0.32)' : 'none',
            }}
          >
            <Send size={18} color={input.trim() ? '#fff' : '#94a3b8'} />
          </button>
        </div>
      </div>
    </div>
  );
}
