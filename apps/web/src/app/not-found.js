import NotFoundClient from "./NotFoundClient";

export const metadata = {
    title: "Page Not Found",
    robots: { index: false, follow: false },
};

export default function NotFound() {
    return <NotFoundClient />;
}
