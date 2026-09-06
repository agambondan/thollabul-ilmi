import Section from "@/components/Section";
import HijriClient from "./HijriClient";

export const revalidate = 86400;

const API_URL =
    process.env.API_INTERNAL_URL ||
    process.env.API_PROXY_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "https://api-thollabul.jangkauin.site";

const toAladhanDate = (isoDate) => {
    const [y, m, d] = isoDate.split("-");
    return `${d}-${m}-${y}`;
};

const parseAladhanHijri = (data) => ({
    hijri_day: data.hijri.day,
    hijri_month: data.hijri.month.number,
    hijri_year: data.hijri.year,
    hijri_arabic: `${data.hijri.day} ${data.hijri.month.ar} ${data.hijri.year}`,
});

async function getInitialData() {
    let today = null;
    let events = [];
    try {
        const todayIso = new Date().toISOString().slice(0, 10);
        const res = await fetch(
            `https://api.aladhan.com/v1/gToH/${toAladhanDate(todayIso)}`,
            { next: { revalidate: 86400 } },
        );
        if (res.ok) {
            const json = await res.json();
            if (json.code === 200 && json.data) {
                today = parseAladhanHijri(json.data);
            }
        }
    } catch {}
    try {
        const res = await fetch(`${API_URL}/api/v1/hijri/events`, {
            next: { revalidate: 86400 },
        });
        if (res.ok) {
            const data = await res.json();
            events = Array.isArray(data) ? data : [];
        }
    } catch {}
    return { today, events };
}

const HijriPage = async () => {
    const { today, events } = await getInitialData();

    return (
        <main className='min-h-screen flex flex-col'>
            <Section>
                <HijriClient
                    initialToday={today}
                    initialEvents={events}
                />
            </Section>
        </main>
    );
};

export default HijriPage;
