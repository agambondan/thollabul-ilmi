import PageSkeleton from "@/components/skeleton/PageSkeleton";
import Section from "@/components/Section";

export default function Loading() {
    return (
        <main className='flex min-h-screen flex-col'>
            <Section>
                <PageSkeleton />
            </Section>
        </main>
    );
}
