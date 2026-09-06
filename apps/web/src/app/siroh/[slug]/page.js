import Section from "@/components/Section";
import SirohDetailContent from "@/components/SirohDetailContent";

export default async function SirohDetailPage(props) {
    const params = await props.params;
    return (
        <main className='min-h-screen flex flex-col'>
            <Section>
                <SirohDetailContent slug={params.slug} basePath='/siroh' />
            </Section>
        </main>
    );
}
