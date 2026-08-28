import { authFetch } from './api';

const API_URL = typeof window === 'undefined' ? '' : process.env.NEXT_PUBLIC_API_URL || '';
const MSG_KEY = 'tholabul_komunitas_messages';
const CHANNEL = 'tholabul_komunitas';
const MAX_MESSAGES = 200;

const normalizeMessage = (m) => ({
    ...m,
    authorId: m.authorId || m.author_id || null,
    timestamp: m.timestamp || Date.now(),
});

const readLocalMessages = () => {
    if (typeof window === 'undefined') return [];
    try {
        return JSON.parse(localStorage.getItem(MSG_KEY) || '[]').map(normalizeMessage);
    } catch {
        return [];
    }
};

const writeLocalMessages = (msgs) => {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(MSG_KEY, JSON.stringify(msgs.slice(-MAX_MESSAGES)));
    } catch {}
};

const broadcast = (msg) => {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel(CHANNEL);
        bc.postMessage(msg);
        bc.close();
    }
};

export const getChatMessages = async () => {
    try {
        const res = await fetch(`${API_URL}/api/v1/komunitas/chat?limit=50`);
        if (!res.ok) throw new Error('backend unavailable');
        const data = await res.json();
        const items = (data?.data?.items || data?.items || []).map(normalizeMessage);
        writeLocalMessages(items);
        return items;
    } catch {
        return readLocalMessages();
    }
};

export const postChatMessage = async (message) => {
    if (!message?.text?.trim()) return null;
    try {
        const res = await authFetch('/api/v1/komunitas/chat', {
            method: 'POST',
            body: JSON.stringify({ text: message.text.trim(), author: message.author || 'Anonim' }),
        });
        if (!res.ok) throw new Error('send failed');
        const data = await res.json();
        return normalizeMessage(data?.data || data);
    } catch {
        const newMsg = normalizeMessage({
            id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            text: message.text.trim(),
            author: message.author || 'Anonim',
            authorId: message.authorId || null,
            timestamp: Date.now(),
        });
        const msgs = [...readLocalMessages(), newMsg];
        writeLocalMessages(msgs);
        broadcast(newMsg);
        return newMsg;
    }
};

export const deleteChatMessage = async (id) => {
    try {
        const res = await authFetch(`/api/v1/komunitas/chat/${id}`, { method: 'DELETE' });
        return res.ok;
    } catch {
        const msgs = readLocalMessages().filter((m) => m.id !== id);
        writeLocalMessages(msgs);
        return true;
    }
};

export const subscribeChat = (onMessage) => {
    if (typeof window === 'undefined') return () => {};
    const cleanups = [];

    try {
        const stream = new EventSource(`${API_URL}/api/v1/komunitas/chat/stream`);
        stream.addEventListener('message', (event) => {
            try {
                onMessage(normalizeMessage(JSON.parse(event.data)));
            } catch {}
        });
        cleanups.push(() => stream.close());
    } catch {}

    if ('BroadcastChannel' in window) {
        const bc = new BroadcastChannel(CHANNEL);
        bc.onmessage = (event) => onMessage(normalizeMessage(event.data));
        cleanups.push(() => bc.close());
    }

    return () => cleanups.forEach((fn) => fn());
};
