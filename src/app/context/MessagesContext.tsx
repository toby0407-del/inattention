import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { subscribeMessages, sendMessage as dbSend, markRead, Message } from '../lib/db';
import { useApp } from './AppContext';

interface MessagesContextType {
  messages: Message[];
  unreadCount: number;
  send: (text: string, role: 'doctor' | 'child') => Promise<void>;
  markAllRead: (role: 'doctor' | 'child') => Promise<void>;
  isConfigured: boolean;
}

const MessagesContext = createContext<MessagesContextType>({
  messages: [],
  unreadCount: 0,
  send: async () => {},
  markAllRead: async () => {},
  isConfigured: false,
});

export function MessagesProvider({ children }: { children: React.ReactNode }) {
  const { selectedChild, isParentAuth } = useApp();
  const [messages, setMessages] = useState<Message[]>([]);
  const childId = selectedChild.id;

  useEffect(() => {
    const unsub = subscribeMessages(childId, setMessages);
    return unsub;
  }, [childId]);

  const unreadCount = messages.filter(m => !m.read && m.senderId === 'child').length;

  async function send(text: string, role: 'doctor' | 'child') {
    const name = role === 'doctor' ? '林醫師' : selectedChild.name;
    await dbSend(childId, role, name, text);
  }

  async function markAllRead(role: 'doctor' | 'child') {
    await markRead(childId, role);
  }

  // Import isFirebaseConfigured lazily to avoid circular dep
  const [isCfg] = useState(() => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mod = (globalThis as any).__FIREBASE_CONFIGURED__;
      return mod !== false;
    } catch {
      return true;
    }
  });

  return (
    <MessagesContext.Provider value={{ messages, unreadCount, send, markAllRead, isConfigured: isCfg }}>
      {children}
    </MessagesContext.Provider>
  );
}

export function useMessages() {
  return useContext(MessagesContext);
}
