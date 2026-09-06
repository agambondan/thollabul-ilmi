import Section from "@/components/Section";
import { AsmaulWiridContent } from "./AsmaulWiridContent";

export { AsmaulWiridContent };

export const metadata = {
    title: "Wirid Asmaul Husna - Tholabul 'Ilmi",
    description:
        "Hitung wirid 99 nama Allah dengan mudah. Wirid harian interaktif dengan penyimpanan otomatis.",
};

export default function AsmaulWiridPage() {
    return (
        <main className='min-h-screen flex flex-col bg-gradient-to-b from-emerald-50 via-white to-emerald-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950'>
            <Section>
                <AsmaulWiridContent />
            </Section>
        </main>
    );
}
