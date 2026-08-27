import HadithPage from '@/app/hadith/[slug]/HadithPage';
import Footer from '@/components/Footer';
import ContentWidth from '@/components/layout/ContentWidth';
import { NavbarTailwindCss } from '@/components/Navbar';
import Section from '@/components/Section';
import HadithThemeError from './HadithThemeError';
import { getHadithsByThemeSlug } from '@/lib/hadithTheme';

const Page = async props => {
    const params = await props.params;
    const { hadiths, isError } = await getHadithsByThemeSlug(params?.slug);

    return (
		<main className='min-h-screen flex flex-col'>
			<NavbarTailwindCss />
			<Section>
				{isError ? (
					<HadithThemeError />
				) : (
				<ContentWidth compact='max-w-4xl' className='dark:text-white'>
					<div className='flex flex-col pt-4'>
						{hadiths.map((hadith) => (
							<HadithPage params={params} book={hadith.book} hadith={hadith} key={hadith.id} />
						))}
					</div>
				</ContentWidth>
				)}
			</Section>
			<Footer />
		</main>
	);
};

export default Page;
