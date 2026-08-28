import Footer from "@/components/Footer";
import { NavbarTailwindCss } from "@/components/Navbar";
import Section from "@/components/Section";
import SearchClient from "./SearchClient";

export default async function SearchPage(props) {
    const searchParams = await props.searchParams;
    return (
        <main className='min-h-screen flex flex-col'>
            <NavbarTailwindCss />
            <Section>
                <SearchClient
                    initialQuery={searchParams?.q ?? ""}
                    initialType={searchParams?.type ?? "all"}
                />
            </Section>
            <Footer />
        </main>
    );
}
