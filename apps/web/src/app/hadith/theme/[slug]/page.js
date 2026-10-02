import Section from "@/components/Section";
import HadithThemeError from "./HadithThemeError";
import HadithThemeClient from "./HadithThemeClient";
import { getHadithsByThemeSlug } from "@/lib/hadithTheme";
import { OG_IMAGE, serializeJsonLd, SITE_NAME, SITE_URL } from "@/lib/site";

export async function generateMetadata(props) {
    const params = await props.params;
    const { theme } = await getHadithsByThemeSlug(params?.slug);
    const themeName = theme?.name ?? params?.slug ?? "Tema Hadits";
    const title = `Hadits Tema ${themeName} — Hadits`;
    const description = `Kumpulan hadits shahih tematik seputar ${themeName} lengkap dengan teks Arab dan terjemahan bahasa Indonesia.`;
    const canonicalUrl = `${SITE_URL}/hadith/theme/${params?.slug}`;

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

const Page = async (props) => {
    const params = await props.params;
    const { hadiths, theme, isError } = await getHadithsByThemeSlug(params?.slug);
    const themeName = theme?.name ?? params?.slug ?? "Tema";

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
                name: `Tema: ${themeName}`,
                item: `${SITE_URL}/hadith/theme/${params?.slug}`,
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
                {isError || hadiths.length === 0 ? (
                    <HadithThemeError variant={isError ? "error" : "empty"} />
                ) : (
                    <HadithThemeClient
                        hadiths={hadiths}
                        theme={theme}
                        slug={params?.slug}
                    />
                )}
            </Section>
        </main>
    );
};

export default Page;
