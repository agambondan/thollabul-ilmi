/* eslint-disable @next/next/no-img-element */
import ContentWidth from "@/components/layout/ContentWidth";
import Section from "@/components/Section";
import Link from "next/link";
import { BsPlayCircle, BsSearch, BsYoutube } from "react-icons/bs";
import { MdOutlinePlayLesson } from "react-icons/md";
import KajianClient from "./KajianClient";

export const revalidate = 3600;

const API_URL =
    process.env.API_INTERNAL_URL ||
    process.env.API_PROXY_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "https://api-thollabul.jangkauin.site";

const getYouTubeId = (url) => {
    if (!url) return null;
    const m = url.match(
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    );
    return m ? m[1] : null;
};

async function getInitialItems() {
    try {
        const res = await fetch(`${API_URL}/api/v1/kajian?page=0&size=20`, {
            next: { revalidate: 3600 },
        });
        if (!res.ok) return [];
        const data = await res.json();
        return data?.items ?? (Array.isArray(data) ? data : []);
    } catch {
        return [];
    }
}

export default async function KajianPage(props) {
    const searchParams = await props.searchParams;
    const tab = searchParams?.tab || "list";
    const kajian = await getInitialItems();

    if (tab === "transcript" || searchParams?.q || searchParams?.category) {
        return (
            <main className='min-h-screen flex flex-col'>
                <Section>
                    <KajianClient kajian={kajian} initialTab={tab} />
                </Section>
            </main>
        );
    }

    const youtubeCount = kajian.filter((k) => k.platform === "youtube").length;

    return (
        <main className='min-h-screen flex flex-col'>
            <Section>
                <div className='container mx-auto px-4 max-w-3xl'>
                    <div className='flex items-center gap-3 mb-4'>
                        <div className='w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center'>
                            <MdOutlinePlayLesson className='text-xl text-emerald-700 dark:text-emerald-400' />
                        </div>
                        <div>
                            <h1 className='text-xl font-bold text-emerald-900 dark:text-emerald-300 dark:text-white'>
                                Koleksi Kajian
                            </h1>
                            <p className='text-xs text-gray-500 dark:text-gray-300 dark:text-gray-400'>
                                Ceramah & kajian Islam dari ustadz terpercaya
                            </p>
                        </div>
                    </div>

                    <div className='flex gap-1 bg-gray-100 dark:bg-slate-800 p-1 rounded-xl mb-4'>
                        <Link
                            href='/kajian?tab=transcript'
                            className='flex-1 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors text-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                        >
                            🔍 Cari di Transkrip
                        </Link>
                        <span className='flex-1 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors text-center bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-sm'>
                            📚 Semua Kajian
                        </span>
                    </div>

                    <div className='grid grid-cols-3 gap-2 sm:gap-3 mb-4'>
                        <div className='rounded-xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-3'>
                            <p className='text-[10px] uppercase tracking-wide text-gray-400'>
                                Total Kajian
                            </p>
                            <p className='text-lg font-bold text-emerald-700 dark:text-emerald-400'>
                                {kajian.length}
                            </p>
                        </div>
                        <div className='rounded-xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-3'>
                            <p className='text-[10px] uppercase tracking-wide text-gray-400'>
                                Platform YouTube
                            </p>
                            <p className='text-lg font-bold text-emerald-700 dark:text-emerald-400'>
                                {youtubeCount}
                            </p>
                        </div>
                        <div className='rounded-xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-3'>
                            <p className='text-[10px] uppercase tracking-wide text-gray-400'>
                                Kategori
                            </p>
                            <p className='text-lg font-bold text-emerald-700 dark:text-emerald-400'>
                                7
                            </p>
                        </div>
                    </div>

                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                        {kajian.map((k) => (
                            <a
                                key={k.id}
                                href={k.url}
                                target='_blank'
                                rel='noopener noreferrer'
                                className='group bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-sm transition-all p-4 flex flex-col gap-3'
                            >
                                {k.platform === "youtube" && (
                                    <BsYoutube className='text-red-500 text-lg' />
                                )}
                                {getYouTubeId(k.url) && (
                                    <div className='aspect-video rounded-lg overflow-hidden bg-black relative group/thumb'>
                                        <img
                                            src={`https://img.youtube.com/vi/${getYouTubeId(k.url)}/mqdefault.jpg`}
                                            alt={k.title}
                                            loading='lazy'
                                            className='w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300'
                                        />
                                        <div className='absolute inset-0 bg-black/20 flex items-center justify-center group-hover/thumb:bg-black/30 transition-colors'>
                                            <div className='w-12 h-12 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-lg group-hover/thumb:scale-110 transition-transform'>
                                                <BsPlayCircle className='text-2xl ml-0.5' />
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div>
                                    <p className='font-semibold text-gray-800 dark:text-gray-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors mb-1'>
                                        {k.title}
                                    </p>
                                    <p className='text-xs text-gray-400'>
                                        {k.speaker} ·{" "}
                                        {k.duration
                                            ? `${Math.floor(k.duration / 60)}m`
                                            : ""}
                                    </p>
                                </div>
                            </a>
                        ))}
                    </div>

                    <p className='text-center text-xs text-gray-400 mt-8'>
                        Konten kajian mengarah ke platform eksternal (YouTube). Thullaabul Ilmi tidak menghosting konten video.
                    </p>
                </div>
            </Section>
        </main>
    );
}
