export function getAchievementItems(payload) {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.items)) return payload.items;
    if (Array.isArray(payload?.achievements)) return payload.achievements;
    if (Array.isArray(payload?.data?.items)) return payload.data.items;
    if (Array.isArray(payload?.data?.achievements)) return payload.data.achievements;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
}
