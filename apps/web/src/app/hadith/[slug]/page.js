import { HadithDetailContent } from "@/app/dashboard/hadith/[slug]/page";
import Section from "@/components/Section";

export const revalidate = 86400;

export async function generateStaticParams() {
    return [
        { slug: "bukhari" },
        { slug: "muslim" },
        { slug: "abu-daud" },
        { slug: "tirmidzi" },
        { slug: "nasai" },
        { slug: "ibnu-majah" },
        { slug: "ahmad" },
        { slug: "malik" },
        { slug: "darimi" },
    ];
}

const Page = async (props) => {
    const params = await props.params;
    return (
        <main className='min-h-screen flex flex-col'>
            <Section>
                <div className='dark:text-white'>
                    <HadithDetailContent
                        params={params}
                        basePath='/hadith'
                        showSelectors={true}
                    />
                </div>
            </Section>
        </main>
    );
};

export default Page;
