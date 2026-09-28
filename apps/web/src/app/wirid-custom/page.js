import WiridCustomPage, {
    WiridCustomContent,
} from "@/app/wirid-custom/WiridCustomPageClient";
import { openGraphFor } from "@/lib/site";

export const metadata = {
    title: "Wirid Custom",
    description:
        "Buat dan kelola wirid/dzikir custom buatanmu sendiri — susun bacaan, atur jumlah, dan simpan untuk diamalkan rutin.",
    alternates: { canonical: "/wirid-custom" },
    openGraph: openGraphFor("/wirid-custom"),
};

export { WiridCustomContent };
export default WiridCustomPage;
