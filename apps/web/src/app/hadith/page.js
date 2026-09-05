import Section from "@/components/Section";
import { Suspense } from "react";
import HadithContent from "./HadithContent";

export const revalidate = 86400;

const API_URL =
    process.env.API_INTERNAL_URL ||
    process.env.API_PROXY_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "https://api-thollabul.jangkauin.site";

async function getInitialBooks() {
    try {
        const res = await fetch(`${API_URL}/api/v1/books?size=20`, {
            next: { revalidate: 86400 },
        });
        if (!res.ok) return null;
        const data = await res.json();
        return { ...data, items: data?.items ?? (Array.isArray(data) ? data : []) };
    } catch {
        return null;
    }
}

const Page = async () => {
    const initialBooks = await getInitialBooks();

    return (
        <main className='min-h-screen flex flex-col'>
            <Section>
                <Suspense fallback={<div className='py-4' />}>
                    <HadithContent initialBooks={initialBooks} />
                </Suspense>
            </Section>
        </main>
    );
};

export default Page;
