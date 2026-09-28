import { openGraphFor } from "@/lib/site";

export const metadata = {
    alternates: { canonical: "/manasik" },
    openGraph: openGraphFor("/manasik"),
    title: "Manasik Haji & Umrah",
    description:
        "Panduan lengkap tata cara ibadah haji dan umrah dari niat ihram hingga tahallul, lengkap dengan bacaan dan penjelasannya.",
};

const ManasikLayout = ({ children }) => children;

export default ManasikLayout;
