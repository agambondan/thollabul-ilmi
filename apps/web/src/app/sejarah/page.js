import Section from "@/components/Section";
import SejarahClient from "./SejarahClient";

export const revalidate = 86400;

export const metadata = {
    alternates: { canonical: "/sejarah" },
    title: "Garis Waktu Sejarah Islam — Thullaabul 'Ilmi Board",
    description:
        "Timeline dan kronologi sejarah peradaban Islam: era kenabian, khulafaur rasyidin, dinasti kekhalifahan, dan tokoh ulama besar.",
};

const API_URL =
    process.env.API_INTERNAL_URL ||
    process.env.API_PROXY_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "https://api-thollabul.jangkauin.site";

async function getInitialEvents() {
    try {
        const res = await fetch(`${API_URL}/api/v1/history`, {
            next: { revalidate: 86400 },
        });
        if (!res.ok) return [];
        const data = await res.json();
        return Array.isArray(data) ? data : (data?.items ?? []);
    } catch {
        return [];
    }
}

export default async function SejarahPage() {
    const events = await getInitialEvents();

    return (
        <main className='min-h-screen flex flex-col'>
            <Section>
                <SejarahClient initialEvents={events} />
            </Section>
        </main>
    );
}
