import Section from "@/components/Section";
import TasbihContent from "./TasbihClient";

export const revalidate = 86400;

export const metadata = {
    alternates: { canonical: "/tasbih" },
    title: "Tasbih Digital & Counter Dzikir — Thullaabul 'Ilmi Board",
    description:
        "Tasbih digital online untuk menghitung dzikir harian dengan target, getar haptic, dan pilihan kalimat thoyyibah.",
};

export default function TasbihPage() {
    return (
        <main className='min-h-screen flex flex-col'>
            <Section>
                <TasbihContent />
            </Section>
        </main>
    );
}
