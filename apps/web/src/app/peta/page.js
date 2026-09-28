import PetaPage, { PetaContent } from "@/app/peta/PetaPageClient";
import { openGraphFor } from "@/lib/site";

export const metadata = {
    title: "Peta Islam Interaktif",
    description:
        "Jelajahi lokasi bersejarah dalam peradaban Islam lewat peta interaktif — masjid, situs sejarah, dan tempat penting lainnya.",
    alternates: { canonical: "/peta" },
    openGraph: openGraphFor("/peta"),
};

export { PetaContent };
export default PetaPage;
