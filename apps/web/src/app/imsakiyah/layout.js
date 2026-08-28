import { openGraphFor } from "@/lib/site";

export const metadata = {
    alternates: { canonical: "/imsakiyah" },
    openGraph: openGraphFor("/imsakiyah"),
    title: "Imsakiyah Schedule — Thullaabul Ilmi",
    description:
        "A complete imsakiyah schedule with imsak, fajr, sunrise, dhuhr, asr, maghrib, and isha times for cities across Indonesia.",
};

const ImsakiyahLayout = ({ children }) => children;

export default ImsakiyahLayout;
