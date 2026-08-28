import { openGraphFor } from "@/lib/site";

export const metadata = {
    alternates: { canonical: "/manasik" },
    openGraph: openGraphFor("/manasik"),
    title: "Hajj & Umrah Manasik — Thullaabul Ilmi",
    description:
        "A complete guide to Hajj and Umrah rituals from ihram intention to tahallul, with readings and explanations.",
};

const ManasikLayout = ({ children }) => children;

export default ManasikLayout;
