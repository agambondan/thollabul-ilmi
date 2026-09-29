const unsupportedQueue = [];

export const enqueueMutation = async ({ endpoint, method = "POST", payload = {}, type = "generic" }) => {
    const item = {
        id: `mut-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        type,
        endpoint,
        method,
        payload,
        createdAt: new Date().toISOString(),
        retryCount: 0,
    };
    unsupportedQueue.push(item);
    return item;
};

export const getPendingMutations = async () => [...unsupportedQueue];

export const removeMutation = async (id) => {
    const idx = unsupportedQueue.findIndex((item) => item.id === id);
    if (idx >= 0) unsupportedQueue.splice(idx, 1);
};

export const clearMutationQueue = async () => {
    unsupportedQueue.length = 0;
};

export const flushMutationQueue = async (requestFn) => {
    if (!unsupportedQueue.length || typeof requestFn !== "function") {
        return { processed: 0, failed: 0 };
    }

    let processed = 0;
    let failed = 0;
    const remaining = [];

    for (const item of unsupportedQueue) {
        try {
            await requestFn(item.endpoint, {
                method: item.method,
                body: item.payload,
                auth: true,
            });
            processed++;
        } catch (err) {
            failed++;
            remaining.push({
                ...item,
                retryCount: (item.retryCount || 0) + 1,
                lastError: err?.message || String(err),
            });
            break;
        }
    }

    unsupportedQueue.length = 0;
    unsupportedQueue.push(...remaining, ...unsupportedQueue.slice(processed + failed));
    return { processed, failed };
};