import { cookies } from "next/headers";
import Link from "next/link";
import Section from "@/components/Section";
import ContentWidth from "@/components/layout/ContentWidth";
import DetailPagerNav from "@/components/DetailPagerNav";
import SourceBadges from "@/components/SourceBadges";
import SirohReportButton from "@/components/SirohReportButton";
import { getLocalizedField } from "@/lib/translation";
import {
    renderBlogContent,
    extractHeadings,
    calculateReadStats,
} from "@/lib/blogContent";

const API_URL =
    process.env.API_INTERNAL_URL ||
    process.env.API_PROXY_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "https://api.thollabulilmi.site";

export const revalidate = 86400;

async function getSirohContent(slug) {
    try {
        const res = await fetch(`${API_URL}/api/v1/siroh/contents/${slug}`, {
            next: { revalidate: 86400 },
        });
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

async function getSirohNav(slug, lang) {
    try {
        const res = await fetch(
            `${API_URL}/api/v1/siroh/contents?size=1000${lang ? `&lang=${encodeURIComponent(lang)}` : ""}`,
            { next: { revalidate: 86400 } },
        );
        if (!res.ok) return { prev: null, next: null };
        const data = await res.json();
        const items = data?.items ?? [];
        const index = items.findIndex((item) => item.slug === slug);
        if (index === -1) return { prev: null, next: null };
        return {
            prev: index > 0 ? items[index - 1] : null,
            next: index < items.length - 1 ? items[index + 1] : null,
        };
    } catch {
        return { prev: null, next: null };
    }
}

export default async function SirohDetailPage(props) {
    const params = await props.params;
    const cookieStore = await cookies();
    const lang =
        cookieStore.get("lang")?.value?.toUpperCase() === "EN" ? "EN" : "ID";
    const [content, nav] = await Promise.all([
        getSirohContent(params.slug),
        getSirohNav(params.slug, lang),
    ]);

    const title = getLocalizedField(content, "title", lang);
    const subtitle = getLocalizedField(content, "subtitle", lang);
    const rawContent =
        getLocalizedField(content, "content", lang) || (content?.content ?? "");

    // Render content with Markdown support
    const htmlContent = renderBlogContent(rawContent);
    const stats = calculateReadStats(rawContent);
    const headings = extractHeadings(htmlContent);

    return (
        <main className='min-h-screen flex flex-col'>
            <Section>
                <ContentWidth compact='max-w-3xl' className='px-4 py-8'>
                    <Link
                        href='/siroh'
                        className='inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 hover:dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors mb-6'
                    >
                        ← Kembali ke Siroh
                    </Link>

                    {!content && (
                        <div className='text-center py-12'>
                            <p className='text-gray-500 dark:text-gray-400'>
                                Tidak ada konten siroh.
                            </p>
                            <Link
                                href='/siroh'
                                className='mt-4 inline-block text-sm text-emerald-600 dark:text-emerald-400 hover:underline'
                            >
                                ← Kembali
                            </Link>
                        </div>
                    )}

                    {content && (
                        <article>
                            <h1 className='text-2xl sm:text-3xl md:text-4xl font-extrabold text-emerald-900 dark:text-white mb-4 leading-tight tracking-tight'>
                                {title}
                            </h1>
                            {subtitle && (
                                <p className='text-gray-500 dark:text-gray-400 mb-6'>
                                    {subtitle}
                                </p>
                            )}

                            <div className='flex flex-wrap items-center justify-between gap-4 pb-6 mb-8 border-b border-gray-100 dark:border-slate-800 text-xs text-gray-500 dark:text-gray-400'>
                                <div className='flex flex-wrap items-center gap-3'>
                                    {stats.minutes > 0 && (
                                        <span className='inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 rounded-full text-xs font-medium'>
                                            {stats.minutes} min baca
                                        </span>
                                    )}
                                    {stats.words > 0 && (
                                        <span className='inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 rounded-full text-xs font-medium'>
                                            {stats.words.toLocaleString()} kata
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Article Body with .blog-content CSS */}
                            <div
                                className='prose dark:prose-invert prose-emerald max-w-none'
                                dangerouslySetInnerHTML={{
                                    __html: htmlContent,
                                }}
                            />

                            {/* Source Badges */}
                            {content.source && (
                                <div className='mt-8 border-t border-gray-100 dark:border-slate-700 pt-6'>
                                    <p className='text-xs font-bold uppercase tracking-wider text-gray-400 mb-3'>
                                        Sumber
                                    </p>
                                    <SourceBadges source={content.source} />
                                </div>
                            )}

                            {/* Table of Contents */}
                            {headings.length > 0 && (
                                <div className='mt-8'>
                                    <p className='text-xs font-bold uppercase tracking-wider text-gray-400 mb-3'>
                                        Daftar Isi
                                    </p>
                                    <nav className='bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4 space-y-1.5'>
                                        {headings.map((h) => (
                                            <a
                                                key={h.id}
                                                href={`#${h.id}`}
                                                className={`block py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors ${
                                                    h.level === 3
                                                        ? "pl-4 text-xs text-gray-500 dark:text-gray-500"
                                                        : "font-medium"
                                                }`}
                                            >
                                                {h.text}
                                            </a>
                                        ))}
                                    </nav>
                                </div>
                            )}

                            <SirohReportButton
                                targetId={String(
                                    content.id ?? content.slug ?? params.slug,
                                )}
                                targetTitle={title || "Siroh"}
                                snippet={rawContent}
                                label='Laporkan Kesalahan'
                            />
                            <DetailPagerNav
                                prevChrome='Sebelumnya'
                                nextChrome='Selanjutnya'
                                prev={
                                    nav.prev
                                        ? {
                                              href: `/siroh/${nav.prev.slug}`,
                                              label: nav.prev.title,
                                          }
                                        : null
                                }
                                next={
                                    nav.next
                                        ? {
                                              href: `/siroh/${nav.next.slug}`,
                                              label: nav.next.title,
                                          }
                                        : null
                                }
                            />
                        </article>
                    )}
                </ContentWidth>
            </Section>
        </main>
    );
}
