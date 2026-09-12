import { cookies } from "next/headers";
import Link from "next/link";
import Section from "@/components/Section";
import ContentWidth from "@/components/layout/ContentWidth";
import SourceBadges from "@/components/SourceBadges";
import SirohReportButton from "@/components/SirohReportButton";
import { getLocalizedField } from "@/lib/translation";

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

export default async function SirohDetailPage(props) {
    const params = await props.params;
    const cookieStore = await cookies();
    const lang =
        cookieStore.get("lang")?.value?.toUpperCase() === "EN" ? "EN" : "ID";
    const content = await getSirohContent(params.slug);

    const title = getLocalizedField(content, "title", lang);
    const subtitle = getLocalizedField(content, "subtitle", lang);
    const body =
        getLocalizedField(content, "content", lang) || content?.content;

    return (
        <main className='min-h-screen flex flex-col'>
            <Section>
                <ContentWidth compact='max-w-3xl' className='px-4'>
                    <Link
                        href='/siroh'
                        className='inline-flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400 hover:underline mb-6'
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
                            <h1 className='text-2xl font-bold text-emerald-900 dark:text-white mb-2'>
                                {title}
                            </h1>
                            {subtitle && (
                                <p className='text-gray-500 dark:text-gray-400 mb-6'>
                                    {subtitle}
                                </p>
                            )}
                            <div className='prose dark:prose-invert prose-emerald max-w-none text-gray-700 dark:text-gray-300 leading-relaxed'>
                                {body
                                    ?.split("\n")
                                    .filter(Boolean)
                                    .map((para, i) => (
                                        <p key={i} className='mb-4'>
                                            {para}
                                        </p>
                                    ))}
                            </div>
                            {content.source && (
                                <div className='mt-8 border-t border-gray-100 dark:border-slate-700 pt-4'>
                                    <p className='text-xs text-gray-400'>
                                        Sumber:
                                    </p>
                                    <SourceBadges source={content.source} />
                                </div>
                            )}
                            <SirohReportButton
                                targetId={String(
                                    content.id ?? content.slug ?? params.slug,
                                )}
                                targetTitle={title || "Siroh"}
                                snippet={body}
                                label='Laporkan Kesalahan'
                            />
                        </article>
                    )}
                </ContentWidth>
            </Section>
        </main>
    );
}
