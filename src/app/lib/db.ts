/**
 * Firestore service layer
 *
 * Collections:
 *   /conversations/{childId}/messages/{msgId}
 *   /children/{childId}   — profile, progress, doctor-set settings
 */
import {
  collection,
  doc,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  updateDoc,
  setDoc,
  getDoc,
  Timestamp,
  Unsubscribe,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Message {
  id: string;
  senderId: 'doctor' | 'child';
  senderName: string;
  text: string;
  timestamp: number;  // ms epoch
  read: boolean;
}

export interface ChildRecord {
  id: string;
  name: string;
  age: number;
  avatar: string;
  currentLevel: number;
  completedLevels: number[];
  totalStars: number;
  lastActive: number;
  /** Doctor-controlled difficulty settings (mirrors AppContext fields) */
  settings?: {
    spotTimeLimitSec?: number;
    spotMaxMistakes?: number;
    memoryShowSeconds?: number;
    memoryPlayLimitSec?: number;
    distractorLevel?: string;
  };
}

// ─── In-memory demo store (used when Firebase is not configured) ──────────────

let _demoMessages: Message[] = [
  {
    id: 'demo-1',
    senderId: 'doctor',
    senderName: '林醫師',
    text: '你好！今天的星座關卡練習得很棒，繼續加油！⭐',
    timestamp: Date.now() - 1000 * 60 * 60 * 2,
    read: true,
  },
  {
    id: 'demo-2',
    senderId: 'child',
    senderName: '小明',
    text: '謝謝醫師！我今天解鎖了金牛座 🐂',
    timestamp: Date.now() - 1000 * 60 * 30,
    read: true,
  },
];
const _demoListeners = new Set<(msgs: Message[]) => void>();

function notifyDemoListeners() {
  _demoListeners.forEach(fn => fn([..._demoMessages]));
}

// ─── Messages ─────────────────────────────────────────────────────────────────

/** Subscribe to messages for a child in real-time. Returns unsubscribe fn. */
export function subscribeMessages(childId: string, onMessages: (msgs: Message[]) => void): Unsubscribe {
  if (!isFirebaseConfigured || !db) {
    _demoListeners.add(onMessages);
    onMessages([..._demoMessages]);
    return () => { _demoListeners.delete(onMessages); };
  }

  const q = query(
    collection(db, 'conversations', childId, 'messages'),
    orderBy('timestamp', 'asc'),
  );
  return onSnapshot(q, snap => {
    const msgs: Message[] = snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        senderId: data.senderId,
        senderName: data.senderName,
        text: data.text,
        timestamp: (data.timestamp as Timestamp)?.toMillis?.() ?? Date.now(),
        read: data.read ?? false,
      };
    });
    onMessages(msgs);
  });
}

/** Send a message */
export async function sendMessage(
  childId: string,
  senderId: 'doctor' | 'child',
  senderName: string,
  text: string,
): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    const msg: Message = {
      id: `demo-${Date.now()}`,
      senderId,
      senderName,
      text,
      timestamp: Date.now(),
      read: false,
    };
    _demoMessages = [..._demoMessages, msg];
    notifyDemoListeners();
    return;
  }

  await addDoc(collection(db, 'conversations', childId, 'messages'), {
    senderId,
    senderName,
    text,
    timestamp: serverTimestamp(),
    read: false,
  });
}

/** Mark all unread messages as read (for a given reader role) */
export async function markRead(childId: string, readerRole: 'doctor' | 'child'): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    _demoMessages = _demoMessages.map(m =>
      m.senderId !== readerRole ? { ...m, read: true } : m,
    );
    notifyDemoListeners();
    return;
  }
  // Firestore: batch update is better but batching requires extra import — simplified here
  // In production, use a Cloud Function trigger instead
}

// ─── Child profile / progress sync ──────────────────────────────────────────

/** Push updated progress from child session to Firestore */
export async function syncChildProgress(childId: string, update: Partial<ChildRecord>): Promise<void> {
  if (!isFirebaseConfigured || !db) return;
  const ref = doc(db, 'children', childId);
  await setDoc(ref, { ...update, lastActive: serverTimestamp() }, { merge: true });
}

/** Doctor pushes new difficulty settings for a child */
export async function pushDoctorSettings(
  childId: string,
  settings: NonNullable<ChildRecord['settings']>,
): Promise<void> {
  if (!isFirebaseConfigured || !db) return;
  const ref = doc(db, 'children', childId);
  await setDoc(ref, { settings }, { merge: true });
}

/** Subscribe to a child's Firestore record (progress + doctor settings) */
export function subscribeChildRecord(
  childId: string,
  onRecord: (record: Partial<ChildRecord>) => void,
): Unsubscribe {
  if (!isFirebaseConfigured || !db) {
    return () => {};
  }
  const ref = doc(db, 'children', childId);
  return onSnapshot(ref, snap => {
    if (snap.exists()) onRecord(snap.data() as Partial<ChildRecord>);
  });
}
