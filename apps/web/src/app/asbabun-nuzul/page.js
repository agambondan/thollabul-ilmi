import Section from "@/components/Section";
import AsbabunNuzulForm from "./AsbabunNuzulForm";

export const revalidate = 86400;

export const metadata = {
    alternates: { canonical: "/asbabun-nuzul" },
    title: "Asbabun Nuzul Al-Quran — Thullaabul 'Ilmi Board",
    description:
        "Sebab-sebab turunnya ayat Al-Quran (Asbabun Nuzul) berdasarkan riwayat dan tafsir terpercaya (Ibnu Katsir, Al-Wahidi, Al-Baghawi).",
};

export const AsbabunNuzulContent = ({ quranBasePath = "/quran" }) => {
    return (
        <div className='container mx-auto px-4 max-w-3xl'>
            <div className='text-center mb-8'>
                <p
                    className='text-3xl text-emerald-700 dark:text-emerald-400 mb-2'
                    style={{ fontFamily: "Amiri, serif" }}
                >
                    أَسْبَابُ النُّزُول
                </p>
                <h1 className='text-2xl font-bold text-emerald-900 dark:text-emerald-300 dark:text-white mb-1'>
                    Asbabun Nuzul
                </h1>
                <p className='text-sm text-gray-500 dark:text-gray-300 dark:text-gray-400'>
                    Latar belakang dan sebab diturunkannya ayat-ayat Al-Quran
                </p>
            </div>
            <AsbabunNuzulForm quranBasePath={quranBasePath} />
        </div>
    );
};

export default function AsbabunNuzulPage() {
    return (
        <main className='min-h-screen flex flex-col'>
            <Section>
                <AsbabunNuzulContent />
            </Section>
        </main>
    );
}
