import HadithPage from '@/app/hadith/[slug]/HadithPage';
import ContentWidth from '@/components/layout/ContentWidth';
import HadithThemeError from '@/app/hadith/theme/[slug]/HadithThemeError';
import { getHadithsByThemeSlug } from '@/lib/hadithTheme';

export default async function DashboardHadithThemePage(props) {
    const params = await props.params;
    const { hadiths, isError } = await getHadithsByThemeSlug(params?.slug);

    return (
        <div className='py-2'>
            {isError ? (
                <HadithThemeError />
            ) : (
                <ContentWidth compact='max-w-4xl' className='dark:text-white'>
                    <div className='flex flex-col pt-4'>
                        {hadiths.map((hadith) => (
                            <HadithPage
                                params={params}
                                book={hadith.book}
                                hadith={hadith}
                                key={hadith.id}
                                basePath='/dashboard/hadith'
                            />
                        ))}
                    </div>
                </ContentWidth>
            )}
        </div>
    );
}
