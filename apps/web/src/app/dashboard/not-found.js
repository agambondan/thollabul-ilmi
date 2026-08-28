import NotFoundClient from "@/app/NotFoundClient";

export const metadata = {
    title: "Page Not Found",
    robots: { index: false, follow: false },
};

// Without a not-found boundary inside /dashboard, a notFound() thrown here
// bubbles to app/not-found.js, which renders under the root layout — the
// sidebar and bottom nav vanish and a signed-in reader loses their way back.
// Same component (it derives its recovery links from the pathname), kept
// inside the dashboard shell.
export default function DashboardNotFound() {
    return <NotFoundClient />;
}
