import Link from "next/link";
import { notFound } from "next/navigation";
import Section from "@/components/Section";
import SourceBadges from "@/components/SourceBadges";
import DetailPagerNav from "@/components/DetailPagerNav";

const API_URL =
    process.env.API_INTERNAL_URL ||
    process.env.API_PROXY_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "https://api.thollabulilmi.site";

async function getFiqhItem(slug) {
    try {
        const res = await fetch(
            `${API_URL}/api/v1/fiqh/item/${encodeURIComponent(slug)}`,
            { next: { revalidate: 86400 } },
        );
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

async function getFiqhNav(slug) {
    try {
        const res = await fetch(`${API_URL}/api/v1/fiqh/items?size=500`, {
            next: { revalidate: 86400 },
        });
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

export const revalidate = 86400;

export default async function FiqhItemPage(props) {
    const params = await props.params;
    const [item, nav] = await Promise.all([
        getFiqhItem(params.slug),
        getFiqhNav(params.slug),
    ]);

    if (!item) notFound();

    const category = item.category_ref;

    return (
        <main className='min-h-screen flex flex-col'>
            <Section>
                <div className='container mx-auto px-4 max-w-3xl py-8'>
                    <Link
                        href='/fiqh'
                        className='text-sm text-emerald-600 dark:text-emerald-400 font-medium'
                    >
                        ← Fiqh Ringkas
                    </Link>
                    {category?.name && (
                        <p className='text-xs text-gray-400 mt-3'>
                            {category.name}
                        </p>
                    )}
                    <h1 className='text-2xl font-bold text-emerald-900 dark:text-white mt-1 mb-4'>
                        {item.title}
                    </h1>
                    <div className='text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line'>
                        {item.content}
                    </div>
                    {item.source && (
                        <div className='mt-4'>
                            <SourceBadges source={item.source} />
                        </div>
                    )}
                    <DetailPagerNav
                        prevChrome='Sebelumnya'
                        nextChrome='Selanjutnya'
                        prev={
                            nav.prev
                                ? {
                                      href: `/fiqh/${nav.prev.slug}`,
                                      label: nav.prev.title,
                                  }
                                : null
                        }
                        next={
                            nav.next
                                ? {
                                      href: `/fiqh/${nav.next.slug}`,
                                      label: nav.next.title,
                                  }
                                : null
                        }
                    />
                </div>
            </Section>
        </main>
    );
}
