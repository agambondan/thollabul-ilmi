import Section from "@/components/Section";
import { LibraryContent } from "@/app/library/LibraryPageClient";
import { openGraphFor } from "@/lib/site";

export const revalidate = 3600;

const API_URL =
    process.env.API_INTERNAL_URL ||
    process.env.API_PROXY_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "https://api.thollabulilmi.site";

const PAGE_SIZE = 24;

export const metadata = {
    alternates: { canonical: "/library" },
    openGraph: openGraphFor("/library"),
    title: "Perpustakaan",
    description:
        "Katalog kitab dan bahan belajar Islam dari sumber resmi — bisa dibaca online, disimpan, dan diberi catatan belajar di Perpustakaan Thullaabul 'Ilmi.",
};

async function getInitialBooks() {
    try {
        const res = await fetch(
            `${API_URL}/api/v1/library/books?page=0&size=${PAGE_SIZE}`,
            { next: { revalidate: 3600 } },
        );
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

const LibraryPage = async () => {
    const initialData = await getInitialBooks();

    return (
        <main className='flex min-h-screen flex-col'>
            <Section>
                <LibraryContent basePath='/library' initialData={initialData} />
            </Section>
        </main>
    );
};

export { LibraryContent };
export default LibraryPage;
