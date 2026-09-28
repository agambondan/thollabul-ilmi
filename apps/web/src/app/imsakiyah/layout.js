import { openGraphFor } from "@/lib/site";

export const metadata = {
    alternates: { canonical: "/imsakiyah" },
    openGraph: openGraphFor("/imsakiyah"),
    title: "Jadwal Imsakiyah",
    description:
        "Jadwal imsakiyah lengkap dengan waktu imsak, subuh, terbit, dzuhur, ashar, maghrib, dan isya untuk kota-kota di Indonesia.",
};

const ImsakiyahLayout = ({ children }) => children;

export default ImsakiyahLayout;
