import React from "react";
import { render } from "@testing-library/react";
import QuranLayout from "@/app/quran/layout";
import HadithLayout from "@/app/hadith/layout";
import ForumLayout from "@/app/forum/layout";
import FiqhLayout from "@/app/fiqh/layout";
import TafsirLayout from "@/app/tafsir/layout";
import BlogLayout from "@/app/blog/layout";
import FiqhPage from "@/app/fiqh/page";
import ForumQuestionLayout from "@/app/forum/[slug]/layout";
import HadithThemePage from "@/app/hadith/theme/[slug]/page";

jest.mock("@/context/Auth", () => ({
    useAuth: () => ({ isAuthenticated: false, user: null, token: null }),
}));

jest.mock("@/context/Locale", () => ({
    useLocale: () => ({ t: (k) => k, lang: "ID" }),
}));

jest.mock("next/navigation", () => ({
    useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
    useSearchParams: () => new URLSearchParams(),
    usePathname: () => "/",
}));

jest.mock("@/lib/hadithTheme", () => ({
    getHadithsByThemeSlug: jest.fn().mockResolvedValue({
        theme: { name: "Iman dan Amal" },
        hadiths: [
            {
                id: 1,
                book: "bukhari",
                number: 1,
                arab: "إنما الأعمال بالنيات",
                translation: { id: "Sesungguhnya amalan itu tergantung niat" },
            },
        ],
        isError: false,
    }),
}));

beforeAll(() => {
    class MockIntersectionObserver {
        constructor() {}
        observe() {}
        unobserve() {}
        disconnect() {}
    }
    window.IntersectionObserver = MockIntersectionObserver;
    global.IntersectionObserver = MockIntersectionObserver;
});

describe("SEO Structured Data (JSON-LD)", () => {
    it("renders BreadcrumbList in QuranLayout", () => {
        const { container } = render(
            <QuranLayout>
                <div>child</div>
            </QuranLayout>,
        );
        const scripts = container.querySelectorAll(
            'script[type="application/ld+json"]',
        );
        expect(scripts.length).toBeGreaterThanOrEqual(2);
        const jsonList = Array.from(scripts).map((s) =>
            JSON.parse(s.innerHTML),
        );
        const breadcrumb = jsonList.find((j) => j["@type"] === "BreadcrumbList");
        expect(breadcrumb).toBeDefined();
        expect(breadcrumb.itemListElement[0].name).toBe("Beranda");
        expect(breadcrumb.itemListElement[1].name).toBe("Al-Quran");
    });

    it("renders BreadcrumbList in HadithLayout", () => {
        const { container } = render(
            <HadithLayout>
                <div>child</div>
            </HadithLayout>,
        );
        const scripts = container.querySelectorAll(
            'script[type="application/ld+json"]',
        );
        const jsonList = Array.from(scripts).map((s) =>
            JSON.parse(s.innerHTML),
        );
        const breadcrumb = jsonList.find((j) => j["@type"] === "BreadcrumbList");
        expect(breadcrumb).toBeDefined();
        expect(breadcrumb.itemListElement[0].name).toBe("Beranda");
        expect(breadcrumb.itemListElement[1].name).toBe("Hadits");
    });

    it("renders BreadcrumbList in ForumLayout", () => {
        const { container } = render(
            <ForumLayout>
                <div>child</div>
            </ForumLayout>,
        );
        const scripts = container.querySelectorAll(
            'script[type="application/ld+json"]',
        );
        expect(scripts.length).toBe(1);
        const breadcrumb = JSON.parse(scripts[0].innerHTML);
        expect(breadcrumb["@type"]).toBe("BreadcrumbList");
        expect(breadcrumb.itemListElement[0].name).toBe("Beranda");
        expect(breadcrumb.itemListElement[1].name).toBe("Forum Diskusi");
    });

    it("renders BreadcrumbList in FiqhLayout", () => {
        const { container } = render(
            <FiqhLayout>
                <div>child</div>
            </FiqhLayout>,
        );
        const scripts = container.querySelectorAll(
            'script[type="application/ld+json"]',
        );
        expect(scripts.length).toBe(1);
        const breadcrumb = JSON.parse(scripts[0].innerHTML);
        expect(breadcrumb["@type"]).toBe("BreadcrumbList");
        expect(breadcrumb.itemListElement[0].name).toBe("Beranda");
        expect(breadcrumb.itemListElement[1].name).toBe("Fiqh Ringkas");
    });

    it("renders BreadcrumbList in TafsirLayout", () => {
        const { container } = render(
            <TafsirLayout>
                <div>child</div>
            </TafsirLayout>,
        );
        const scripts = container.querySelectorAll(
            'script[type="application/ld+json"]',
        );
        expect(scripts.length).toBe(1);
        const breadcrumb = JSON.parse(scripts[0].innerHTML);
        expect(breadcrumb["@type"]).toBe("BreadcrumbList");
        expect(breadcrumb.itemListElement[0].name).toBe("Beranda");
        expect(breadcrumb.itemListElement[1].name).toBe("Tafsir");
    });

    it("renders BreadcrumbList in BlogLayout", () => {
        const { container } = render(
            <BlogLayout>
                <div>child</div>
            </BlogLayout>,
        );
        const scripts = container.querySelectorAll(
            'script[type="application/ld+json"]',
        );
        const jsonList = Array.from(scripts).map((s) =>
            JSON.parse(s.innerHTML),
        );
        const breadcrumb = jsonList.find((j) => j["@type"] === "BreadcrumbList");
        expect(breadcrumb).toBeDefined();
        expect(breadcrumb.itemListElement[0].name).toBe("Beranda");
        expect(breadcrumb.itemListElement[1].name).toBe("Blog Islami");
    });

    it("renders FAQPage in FiqhPage", async () => {
        global.fetch = jest.fn((url) => {
            if (url.includes("/api/v1/fiqh/items")) {
                return Promise.resolve({
                    ok: true,
                    json: () =>
                        Promise.resolve({
                            items: [
                                {
                                    id: 1,
                                    slug: "tata-cara-wudhu",
                                    title: "Tata Cara Wudhu",
                                    category: "thaharah",
                                    content: "Mencuci kedua telapak tangan...",
                                    dalil: "Al-Maidah: 6",
                                },
                            ],
                        }),
                });
            }
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve([{ id: "thaharah", name: "Thaharah" }]),
            });
        });

        const pageElement = await FiqhPage();
        const { container } = render(pageElement);
        const scripts = container.querySelectorAll(
            'script[type="application/ld+json"]',
        );
        const jsonList = Array.from(scripts).map((s) =>
            JSON.parse(s.innerHTML),
        );
        const faqPage = jsonList.find((j) => j["@type"] === "FAQPage");
        expect(faqPage).toBeDefined();
        expect(faqPage.mainEntity[0].name).toBe("Tata Cara Wudhu");
        expect(faqPage.mainEntity[0].acceptedAnswer.text).toContain(
            "Mencuci kedua telapak tangan...",
        );
    });

    it("renders BreadcrumbList and QAPage in ForumQuestionLayout", async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: () =>
                Promise.resolve({
                    title: "Hukum Puasa Syawal",
                    body: "Bagaimana hukum puasa 6 hari di bulan Syawal?",
                    created_at: "2026-05-01T00:00:00Z",
                    vote_count: 5,
                    answers: [],
                }),
        });

        const layoutElement = await ForumQuestionLayout({
            params: Promise.resolve({ slug: "hukum-puasa-syawal" }),
            children: <div>question detail</div>,
        });

        const { container } = render(layoutElement);
        const scripts = container.querySelectorAll(
            'script[type="application/ld+json"]',
        );
        const jsonList = Array.from(scripts).map((s) =>
            JSON.parse(s.innerHTML),
        );
        const breadcrumb = jsonList.find((j) => j["@type"] === "BreadcrumbList");
        const qaPage = jsonList.find((j) => j["@type"] === "QAPage");

        expect(breadcrumb).toBeDefined();
        expect(breadcrumb.itemListElement).toHaveLength(3);
        expect(breadcrumb.itemListElement[2].name).toBe("Hukum Puasa Syawal");

        expect(qaPage).toBeDefined();
        expect(qaPage.mainEntity.name).toBe("Hukum Puasa Syawal");
    });

    it("renders BreadcrumbList in HadithThemePage", async () => {
        const pageElement = await HadithThemePage({
            params: Promise.resolve({ slug: "iman" }),
        });
        const { container } = render(pageElement);
        const scripts = container.querySelectorAll(
            'script[type="application/ld+json"]',
        );
        const breadcrumb = JSON.parse(scripts[0].innerHTML);
        expect(breadcrumb["@type"]).toBe("BreadcrumbList");
        expect(breadcrumb.itemListElement[2].name).toBe("Tema: Iman dan Amal");
    });
});
