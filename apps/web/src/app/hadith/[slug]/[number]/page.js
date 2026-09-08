import { OG_IMAGE, serializeJsonLd, SITE_NAME, SITE_URL } from "@/lib/site";
import HadithNumberContent, {
    fetchHadithByBookNumber,
    getHadithTitle,
    normalizeHadithNumber,
} from "@/app/hadith/[slug]/[number]/HadithNumberContent";
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
    const number = normalizeHadithNumber(params.number);
    const hadith = await fetchHadithByBookNumber(params.slug, number);
    const title = getHadithTitle(hadith, params.slug, number);
    const breadcrumbJsonLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
            {
                "@type": "ListItem",
                position: 1,
                name: "Beranda",
                item: `${SITE_URL}/`,
            },
            {
                "@type": "ListItem",
                position: 2,
                name: "Hadits",
                item: `${SITE_URL}/hadith`,
            },
            {
                "@type": "ListItem",
                position: 3,
                name: params.slug,
                item: `${SITE_URL}/hadith/${params.slug}`,
            },
            {
                "@type": "ListItem",
                position: 4,
                name: title,
                item: `${SITE_URL}/hadith/${params.slug}/${number}`,
            },
        ],
    };

    return (
        <main className='min-h-screen flex flex-col'>
            <script
                type='application/ld+json'
                dangerouslySetInnerHTML={{
                    __html: serializeJsonLd(breadcrumbJsonLd),
                }}
            />
            <Section>
                <div className='dark:text-white'>
                    <HadithNumberContent params={params} basePath='/hadith' />
                </div>
            </Section>
        </main>
    );
}
