"use client";

import Link from "next/link";

const HADITH_SLUG_MAP = {
    abudaud: "abudaud",
    abudawud: "abudaud",
    ahmad: "ahmad",
    annasai: "nasai",
    "an-nasai": "nasai",
    "at-tirmidzi": "tirmidzi",
    bukhari: "bukhari",
    darimi: "darimi",
    "ibnu-majah": "ibnumajah",
    ibnmajah: "ibnumajah",
    ibnumajah: "ibnumajah",
    malik: "malik",
    muslim: "muslim",
    nasai: "nasai",
    tirmidzi: "tirmidzi",
    tirmidhi: "tirmidzi",
    "abu-daud": "abudaud",
};

const normalizeBookKey = (value) =>
    value.toLowerCase().replace(/['’.]/g, "").replace(/\s+/g, "");

const quranSourceHref = (surah, ayah) =>
    `/quran/surah/${encodeURIComponent(surah.trim())}#ayah-${String(ayah).split("-")[0]}`;

const HADITH_BOOKS =
    "Bukhari|Muslim|Abu Dawud|Tirmidzi|Ibnu Majah|Nasai|Ahmad|Malik|Darimi|at-Tirmidzi|an-Nasa'i";

const QS_PATTERN = /QS\.\s*([^:]+):\s*([\d-]+)/i;

const tokenizeParts = (source) =>
    source
        .split(/[;\n]/)
        .flatMap((segment) => segment.split(/\s*,\s*|\s*&\s*|\s+\bdan\b\s+/i))
        .map((s) => s.trim())
        .filter(Boolean);

const buildHadithRef = (book, number) => {
    const slug = HADITH_SLUG_MAP[normalizeBookKey(book)];
    if (!slug) return null;
    return {
        text: `HR. ${book.trim()} No. ${number}`,
        url: `/hadith/${slug}/${number}`,
    };
};

export function parseSource(source) {
    if (!source) return [];
    const refs = [];

    for (const part of tokenizeParts(source)) {
        const hrMatch = part.match(
            new RegExp(
                `^(?:HR\\.?|H\\.R\\.?)?\\s*(${HADITH_BOOKS})\\s+(?:No\\.\\s*)?(\\d+)`,
                "i",
            ),
        );
        if (hrMatch) {
            const ref = buildHadithRef(hrMatch[1], hrMatch[2]);
            if (ref) {
                refs.push(ref);
                continue;
            }
        }

        const qsMatch = part.match(QS_PATTERN);
        if (qsMatch) {
            refs.push({
                text: part,
                url: quranSourceHref(qsMatch[1], qsMatch[2]),
            });
            continue;
        }

        refs.push({ text: part, url: null });
    }

    return refs;
}

export default function SourceBadges({ source }) {
    if (!source) return null;
    const refs = parseSource(source);
    if (refs.length === 0) return null;

    return (
        <div className='flex flex-wrap gap-x-2 gap-y-1 mt-1'>
            {refs.map((ref, i) =>
                ref.url ? (
                    <Link
                        key={i}
                        href={ref.url}
                        className='text-xs text-blue-600 dark:text-blue-400 underline hover:text-blue-800 hover:dark:text-blue-300 dark:hover:text-blue-300'
                    >
                        {ref.text}
                    </Link>
                ) : (
                    <span key={i} className='text-xs text-gray-400'>
                        {ref.text}
                    </span>
                ),
            )}
        </div>
    );
}
