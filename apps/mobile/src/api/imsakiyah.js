import { fetchCached } from "./apiCache";
import { requestJson } from "./client";

const IMSAKIYAH_CACHE_TTL = 30 * 60 * 1000;

const pickSchedule = (payload) => {
    const data = payload?.data ?? payload;
    if (Array.isArray(data?.schedule)) return data.schedule;
    if (Array.isArray(data)) return data;
    return [];
};

export const getImsakiyahMonth = async ({ month, year }) => {
    const payload = await fetchCached(
        `imsakiyah:${year}-${month}`,
        () => requestJson(`/api/v1/imsakiyah?year=${year}&month=${month}`),
        { ttl: IMSAKIYAH_CACHE_TTL },
    );
    return pickSchedule(payload);
};
