import Section from "@/components/Section";
import HadithThemeError from "./HadithThemeError";
import HadithThemeClient from "./HadithThemeClient";
import { getHadithsByThemeSlug } from "@/lib/hadithTheme";

const Page = async (props) => {
    const params = await props.params;
    const { hadiths, theme, isError } = await getHadithsByThemeSlug(params?.slug);

    return (
        <main className='min-h-screen flex flex-col'>
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
