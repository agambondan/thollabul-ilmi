import { render, screen, waitFor } from "@testing-library/react";

/**
 * Smoke test for the shared profile sections.
 *
 * /profile and /dashboard/profile render nothing but a skeleton until a
 * session exists, so a missing binding inside the signed-in branch survives
 * both `next build` and the rest of the suite — that is exactly how
 * `hafalanSummary` and `logout` reached production undeclared and put both
 * screens into the error boundary. Mount the component as a logged-in user so
 * that branch actually executes.
 */

const ok = (payload) => Promise.resolve({ ok: true, json: async () => payload });

jest.mock("@/lib/api", () => ({
    hafalanApi: { summary: () => ok({ memorized: 3 }) },
    muhasabahApi: { list: () => ok({ items: [] }) },
    progressApi: {
        getQuran: () => ok({ last_surah: "Al-Baqarah" }),
        getHadith: () => ok({ last_book: "Bukhari" }),
    },
    streakApi: { get: () => ok({ current: 5 }) },
    userApi: {
        sessions: () => ok([]),
        updateProfile: () => ok({}),
        changePassword: () => ok({}),
        deleteMe: () => ok({}),
        revokeSession: () => ok({}),
    },
}));

jest.mock("@/context/Locale", () => ({
    useLocale: () => ({ t: (key) => key, lang: "idn", setLang: () => {} }),
}));

jest.mock("@/lib/useRequireAuth", () => ({
    useRequireAuth: () => ({
        user: {
            name: "Firman Agam",
            email: "firman@example.com",
            role: "admin",
        },
        isAuthenticated: true,
        isLoading: false,
        logout: jest.fn(),
        refetchUser: jest.fn(),
    }),
}));

const ProfileContent = require("@/components/account/ProfileContent").default;

describe("ProfileContent", () => {
    it("renders every section for a signed-in user", async () => {
        render(<ProfileContent />);

        // Identity comes from the auth hook.
        await waitFor(() =>
            expect(screen.getByText("Firman Agam")).toBeInTheDocument(),
        );
        expect(screen.getByText("firman@example.com")).toBeInTheDocument();
        expect(screen.getByText("admin")).toBeInTheDocument();

        // One representative element per section, so a section that throws or
        // silently disappears fails the test.
        expect(screen.getByText("profile.change_password")).toBeInTheDocument();
        expect(screen.getByText("profile.hafal_label")).toBeInTheDocument();

        // The quick links are the section that referenced the undeclared
        // hafalanSummary.
        const links = screen.getAllByRole("link");
        const hrefs = links.map((a) => a.getAttribute("href"));
        expect(hrefs).toEqual(
            expect.arrayContaining([
                "/dashboard/hafalan",
                "/dashboard/muhasabah",
                "/dashboard/jadwal-sholat",
            ]),
        );
    });
});
