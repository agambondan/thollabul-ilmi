import HadithPage from '@/app/hadith/[slug]/HadithPage';
import Footer from '@/components/Footer';
import ContentWidth from '@/components/layout/ContentWidth';
import { NavbarTailwindCss } from '@/components/Navbar';
import Section from '@/components/Section';
import HadithThemeError from './HadithThemeError';

const Page = async props => {
    const params = await props.params;
    const slugLowercase = (params.slug ?? '').replaceAll('-', ' ').toLowerCase();

    let hadiths = [];
    let isError = false;

    try {
		const res = await fetch(
			`${(process.env.API_INTERNAL_URL || process.env.API_PROXY_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:29900')}/api/v1/hadiths/theme/slug/${slugLowercase}?size=1`
		);
		const tempHadiths = await res.json();
		const total = tempHadiths?.total ?? 0;

		let page = 0;
		while (hadiths.length < total) {
			const pageRes = await fetch(
				`${(process.env.API_INTERNAL_URL || process.env.API_PROXY_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:29900')}/api/v1/hadiths/theme/slug/${slugLowercase}?size=1000&page=${page}`
			);
			const data = await pageRes.json();
			hadiths = hadiths.concat(data?.items ?? []);
			page++;
			if (!data?.items?.length) break;
		}
	} catch {
		isError = true;
	}

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
