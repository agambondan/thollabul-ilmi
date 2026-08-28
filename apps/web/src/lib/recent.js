const RECENT_KEY = 'tholabul_belajar_recent';

export const pushRecentBelajar = (item) => {
    if (typeof window === 'undefined') return;
    try {
        const raw = localStorage.getItem(RECENT_KEY);
        let items = raw ? JSON.parse(raw) : [];
        items = items.filter((i) => i.href !== item.href);
        items.unshift({ ...item, timestamp: Date.now() });
        localStorage.setItem(RECENT_KEY, JSON.stringify(items.slice(0, 5)));
    } catch {}
};

export const getRecentBelajar = () => {
    if (typeof window === 'undefined') return [];
    try {
        const raw = localStorage.getItem(RECENT_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
};
