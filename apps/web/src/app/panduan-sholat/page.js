import Footer from "@/components/Footer";
import { NavbarTailwindCss } from "@/components/Navbar";
import { PanduanSholatContent } from "./PanduanSholatClient";

export default function PanduanSholatPage() {
    return (
        <main className='min-h-screen flex flex-col bg-parchment-50 dark:bg-slate-900'>
            <NavbarTailwindCss />
            <div className='pt-24'>
                <PanduanSholatContent />
            </div>
            <Footer />
        </main>
    );
}
