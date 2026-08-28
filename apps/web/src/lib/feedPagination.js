export function getFeedItems(payload) {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.items)) return payload.items;
    if (Array.isArray(payload?.data?.items)) return payload.data.items;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
}

export function getFeedTotal(payload, page, size, itemCount) {
    const explicitTotal = payload?.total ?? payload?.data?.total;
    const numericTotal = Number(explicitTotal);
    if (Number.isFinite(numericTotal)) return numericTotal;
    if (payload?.last === false || payload?.data?.last === false) {
        return (
            (Math.max(1, Number(page) || 1) - 1) * Number(size) + itemCount + 1
        );
    }
    return itemCount;
}
