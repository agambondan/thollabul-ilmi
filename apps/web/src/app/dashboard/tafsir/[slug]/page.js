import { TafsirSurahContent } from "@/app/tafsir/[slug]/page";

export default async function DashboardTafsirReaderPage(props) {
    const params = await props.params;

    return (
        <div className='py-4'>
            <TafsirSurahContent
                slug={params.slug}
                tafsirBasePath='/dashboard/tafsir'
                quranBasePath='/dashboard/quran'
            />
        </div>
    );
}
