export function searchInQuranData(data, keyword) {
    const results = [];
    data.forEach((item) => {
        const {
            id,
            number,
            default_language,
            surah_id,
            translation_id,
            translation: {
                idn,
                latin_idn,
                en,
                ar,
                ar_waqaf,
                ar_format,
                ar_html,
            },
        } = item;

        if (
            idn.includes(keyword) ||
            latin_idn.includes(keyword) ||
            en.includes(keyword) ||
            ar.includes(keyword)
        ) {
            results.push({
                id,
                number,
                default_language,
                surah_id,
                translation_id,
                translation: {
                    idn,
                    latin_idn,
                    en,
                    ar,
                    ar_waqaf,
                    ar_format,
                    ar_html,
                },
            });
        }
    });

    return results;
}

export function searchInThemesData(data, keyword) {
    const results = [];
    data.forEach((item) => {
        const {
            id,
            translation_id,
            translation: {
                idn,
                latin_idn,
                en,
                ar,
                ar_waqaf,
                ar_format,
                ar_html,
            },
        } = item;

        if (
            idn.includes(keyword) ||
            latin_idn.includes(keyword) ||
            en.includes(keyword) ||
            ar.includes(keyword)
        ) {
            results.push({
                id,
                translation_id,
                translation: {
                    idn,
                    latin_idn,
                    en,
                    ar,
                    ar_waqaf,
                    ar_format,
                    ar_html,
                },
            });
        }
    });

    return results;
}
