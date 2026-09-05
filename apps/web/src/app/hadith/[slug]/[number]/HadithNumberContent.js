import HadithPage from "@/app/hadith/[slug]/HadithPage";
import { getLocalizedTranslation } from "@/lib/translation";
import Link from "next/link";
import { notFound } from "next/navigation";

const API_URL =
    process.env.API_INTERNAL_URL ||
    process.env.API_PROXY_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:29900";

export const normalizeHadithNumber = (value) => {
    const number = Number(value);
    return Number.isInteger(number) && number > 0 ? number : null;
};

export const fetchHadithByBookNumber = async (slug, number, options = {}) => {
    const hadithNumber = normalizeHadithNumber(number);
    if (!slug || !hadithNumber) return null;

    const res = await fetch(
        `${API_URL}/api/v1/hadiths/book/${encodeURIComponent(slug)}/number/${hadithNumber}`,
        {
            next: { revalidate: 3600 },
            ...options,
        },
    );
    if (!res.ok) return null;
    return res.json();
};

const SUNNAH_SLUG_MAP = {
    bukhari: "bukhari",
    muslim: "muslim",
    abudaud: "abudawud",
    abudawud: "abudawud",
    tirmidzi: "tirmidhi",
    ibnumajah: "ibnmajah",
    nasai: "nasai",
    ahmad: "ahmad",
    malik: "malik",
    darimi: "darimi",
};

export const getSunnahComUrl = (slug, number) => {
    const s = SUNNAH_SLUG_MAP[slug?.toLowerCase()?.replace(/[^a-z]/g, "")];
    return s && number ? `https://sunnah.com/${s}:${number}` : null;
};

export const getHadithTitle = (hadith, slug, number) => {
    const bookName =
        getLocalizedTranslation(hadith?.book?.translation, "ID") ||
        getLocalizedTranslation(hadith?.book?.translation, "EN") ||
        hadith?.book?.slug ||
        slug;
    return `${bookName} No. ${hadith?.number ?? number}`;
};

export default async function HadithNumberContent({
    params,
    basePath = "/hadith",
}) {
    const number = normalizeHadithNumber(params.number);
    const hadith = await fetchHadithByBookNumber(params.slug, number);

    if (!hadith) {
        notFound();
    }

    const book = hadith.book ?? { slug: params.slug };
    const sunnahUrl = getSunnahComUrl(book.slug ?? params.slug, number);

    return (
        <div className='p-4'>
            <Link
                href={`${basePath}/${params.slug}`}
                className='inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline mb-4'
            >
                ← Kembali ke daftar hadith
            </Link>
            <div className='mb-4 rounded-xl border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/70 dark:bg-emerald-900/10 px-4 py-3'>
                <p className='text-xs uppercase tracking-wider text-emerald-700 dark:text-emerald-400 dark:text-emerald-300 font-semibold'>
                    Detail Hadith
                </p>
                <h1 className='text-xl font-bold text-emerald-950 dark:text-emerald-300 dark:text-white mt-1'>
                    {getHadithTitle(hadith, params.slug, number)}
                </h1>
                {sunnahUrl ? (
                    <a
                        href={sunnahUrl}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='mt-2 inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 underline hover:text-blue-800'
                    >
                        Buka di sunnah.com →
                    </a>
                ) : null}
            </div>
            <HadithPage
                params={{ slug: params.slug }}
                book={book}
                hadith={hadith}
                basePath={basePath}
            />
        </div>
    );
}
