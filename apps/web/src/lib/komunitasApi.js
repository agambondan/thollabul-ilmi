// Komunitas realtime chat API.
// Ponytail: Backend SSE will replace BroadcastChannel fallback when endpoint ready.

const MSG_KEY = 'tholabul_komunitas_messages';
const CHANNEL = 'tholabul_komunitas';
const MAX_MESSAGES = 200;

const readMessages = () => {
    if (typeof window === 'undefined') return [];
    try {
        return JSON.parse(localStorage.getItem(MSG_KEY) || '[]');
    } catch {
        return [];
    }
};

const writeMessages = (msgs) => {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(MSG_KEY, JSON.stringify(msgs.slice(-MAX_MESSAGES)));
    } catch {}
};

export const getChatMessages = () => readMessages();

export const postChatMessage = (message) => {
    if (!message?.text?.trim()) return;
    const newMsg = {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        text: message.text.trim(),
        author: message.author || 'Anonim',
        authorId: message.authorId || null,
        timestamp: Date.now(),
    };
    const msgs = [...readMessages(), newMsg];
    writeMessages(msgs);
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel(CHANNEL);
        bc.postMessage(newMsg);
        bc.close();
    }
    return newMsg;
};

export const subscribeChat = (onMessage) => {
    if (typeof window === 'undefined') return () => {};
    if (!('BroadcastChannel' in window)) return () => {};
    const bc = new BroadcastChannel(CHANNEL);
    bc.onmessage = (event) => onMessage(event.data);
    return () => bc.close();
};
