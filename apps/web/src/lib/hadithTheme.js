const normalize = (str) =>
    (str || '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');

export async function getHadithsByThemeSlug(rawSlug) {
    const baseUrl =
        process.env.API_INTERNAL_URL ||
        process.env.API_PROXY_URL ||
        process.env.NEXT_PUBLIC_API_URL ||
        'http://localhost:29900';

    if (!rawSlug) return { hadiths: [], isError: false };

    const decoded = decodeURIComponent(rawSlug).trim();

    let themeId = /^\d+$/.test(decoded) ? parseInt(decoded, 10) : null;

    if (!themeId) {
        try {
            const themesRes = await fetch(`${baseUrl}/api/v1/themes?size=500`);
            const themesData = await themesRes.json();
            const targetNorm = normalize(decoded);

            const match = (themesData?.items ?? []).find((t) => {
                const en = normalize(t?.translation?.en);
                const idn = normalize(t?.translation?.idn);
                const ar = normalize(t?.translation?.ar);
                return (
                    (en && en === targetNorm) ||
                    (idn && idn === targetNorm) ||
                    (ar && ar === targetNorm)
                );
            });

            if (match) {
                themeId = match.id;
            }
        } catch {
            // fallback
        }
    }

    let hadiths = [];
    try {
        const endpoint = themeId
            ? `${baseUrl}/api/v1/hadiths/theme/${themeId}`
            : `${baseUrl}/api/v1/hadiths/theme/slug/${encodeURIComponent(decoded)}`;

        const firstRes = await fetch(`${endpoint}?size=1`);
        const firstData = await firstRes.json();
        const total = firstData?.total ?? 0;

        let page = 0;
        while (hadiths.length < total) {
            const pageRes = await fetch(`${endpoint}?size=1000&page=${page}`);
            const data = await pageRes.json();
            hadiths = hadiths.concat(data?.items ?? []);
            page++;
            if (!data?.items?.length) break;
        }

        return { hadiths, isError: false };
    } catch {
        return { hadiths: [], isError: true };
    }
}
