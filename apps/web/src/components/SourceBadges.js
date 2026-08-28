"use client";

import Link from "next/link";

const SUNNAH_SLUG_MAP = {
    bukhari: "bukhari",
    muslim: "muslim",
    abudawud: "abudawud",
    tirmidzi: "tirmidzi",
    ibnumajah: "ibnmajah",
    nasai: "nasai",
    ahmad: "ahmad",
};

const normalizeBookKey = (value) => value.toLowerCase().replaceAll(" ", "");

const quranSourceHref = (surah, ayah) =>
    `/quran/surah/${encodeURIComponent(surah.trim())}#ayah-${ayah}`;

export function parseSource(source) {
    if (!source) return [];
    return source
        .split(";")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((part) => {
            const hrMatch = part.match(
                /HR\.\s*(Bukhari|Muslim|Abu Dawud|Tirmidzi|Ibnu Majah|Nasai|Ahmad)\s+No\.\s*(\d+)/i,
            );
            if (hrMatch) {
                const key = normalizeBookKey(hrMatch[1]);
                const no = hrMatch[2];
                const slug = SUNNAH_SLUG_MAP[key];
                if (!slug) return { text: part, url: null };
                return {
                    external: true,
                    text: part,
                    url: `https://sunnah.com/${slug}:${no}`,
                };
            }
            const qsMatch = part.match(/QS\.\s*([^:]+):\s*(\d+)/i);
            if (qsMatch) {
                const surah = qsMatch[1].trim();
                const ayat = qsMatch[2];
                return {
                    external: false,
                    text: part,
                    url: quranSourceHref(surah, ayat),
                };
            }
            return { text: part, url: null };
        });
}

export default function SourceBadges({ source }) {
    if (!source) return null;
    const refs = parseSource(source);
    if (refs.length === 0) return null;

    return (
        <div className='flex flex-wrap gap-x-2 gap-y-1 mt-1'>
            {refs.map((ref, i) =>
                ref.url && ref.external ? (
                    <a
                        key={i}
                        href={ref.url}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='text-xs text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300'
                    >
                        {ref.text}
                    </a>
                ) : ref.url ? (
                    <Link
                        key={i}
                        href={ref.url}
                        className='text-xs text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300'
                    >
                        {ref.text}
                    </Link>
                ) : (
                    <span
                        key={i}
                        className='text-xs text-gray-400'
                    >
                        {ref.text}
                    </span>
                ),
            )}
        </div>
    );
}
