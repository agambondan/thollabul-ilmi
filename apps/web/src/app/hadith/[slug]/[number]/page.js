import { OG_IMAGE, SITE_NAME, SITE_URL } from "@/lib/site";
import HadithNumberContent, {
    fetchHadithByBookNumber,
    getHadithTitle,
    normalizeHadithNumber,
} from "@/app/hadith/[slug]/[number]/HadithNumberContent";
import Footer from "@/components/Footer";
import { NavbarTailwindCss } from "@/components/Navbar";
import Section from "@/components/Section";
import { getLocalizedTranslation } from "@/lib/translation";


export async function generateMetadata(props) {
    const params = await props.params;
    const number = normalizeHadithNumber(params.number);
    const hadith = await fetchHadithByBookNumber(params.slug, number);

    if (!hadith) {
        return {
            title: `Hadith — Thullaabul 'Ilmi`,
        };
    }

    const title = `${getHadithTitle(hadith, params.slug, number)} — Hadith`;
    const translation =
        getLocalizedTranslation(hadith.translation, "ID") ||
        getLocalizedTranslation(hadith.translation, "EN") ||
        "";
    const description =
        translation.length > 160
            ? `${translation.slice(0, 157)}...`
            : translation;
    const canonicalUrl = `${SITE_URL}/hadith/${params.slug}/${number}`;

    return {
        title,
        description,
        alternates: { canonical: canonicalUrl },
        openGraph: {
            type: "website",
            siteName: SITE_NAME,
            title,
            description,
            url: canonicalUrl,
            images: [OG_IMAGE],
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: [OG_IMAGE.url],
        },
    };
}

export default async function Page(props) {
    const params = await props.params;

    return (
        <main className='min-h-screen flex flex-col'>
            <NavbarTailwindCss />
            <Section>
                <div className='dark:text-white'>
                    <HadithNumberContent params={params} basePath='/hadith' />
                </div>
            </Section>
            <Footer />
        </main>
    );
}
