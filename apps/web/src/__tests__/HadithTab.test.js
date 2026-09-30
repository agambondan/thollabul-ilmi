import { render, screen } from "@testing-library/react";
import HadithTab from "@/app/hadith/hadithTab";
import { hadithTabList } from "@/lib/const";

const mockGet = jest.fn();

jest.mock("next/navigation", () => ({
    useSearchParams: () => ({
        get: (param) => mockGet(param),
    }),
}));

jest.mock("@/context/Locale", () => ({
    useLocale: () => ({
        t: (key) => key,
    }),
}));

describe("HadithTab", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("renders tab links with book query preserved when book is selected", () => {
        mockGet.mockReturnValue("muslim");
        render(
            <HadithTab
                tabs={hadithTabList}
                basePath="/hadith"
                activeTab="#chapter"
            />,
        );

        const links = screen.getAllByRole("tab");
        expect(links[0]).toHaveAttribute("href", "/hadith?tab=book&book=muslim");
        expect(links[1]).toHaveAttribute("href", "/hadith?tab=theme&book=muslim");
        expect(links[2]).toHaveAttribute("href", "/hadith?tab=chapter&book=muslim");
    });

    test("renders tab links without book query when no book is selected", () => {
        mockGet.mockReturnValue(null);
        render(
            <HadithTab
                tabs={hadithTabList}
                basePath="/hadith"
                activeTab="#book"
            />,
        );

        const links = screen.getAllByRole("tab");
        expect(links[0]).toHaveAttribute("href", "/hadith?tab=book");
    });
});
