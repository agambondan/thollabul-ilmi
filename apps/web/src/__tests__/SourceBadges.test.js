import { render, screen } from "@testing-library/react";
import SourceBadges, { parseSource } from "@/components/SourceBadges";

jest.mock("next/link", () => ({ children, href, ...props }) => (
    <a href={href} {...props}>
        {children}
    </a>
));

describe("parseSource", () => {
    test("returns empty array for null/undefined", () => {
        expect(parseSource(null)).toEqual([]);
        expect(parseSource(undefined)).toEqual([]);
    });

    test("returns empty array for empty string", () => {
        expect(parseSource("")).toEqual([]);
    });

    test("parses HR hadith source to internal link", () => {
        const result = parseSource("HR. Bukhari No. 123");
        expect(result).toHaveLength(1);
        expect(result[0].url).toBe("/hadith/bukhari/123");
        expect(result[0].text).toBe("HR. Bukhari No. 123");
    });

    test("parses QS quran source to internal link", () => {
        const result = parseSource("QS. Al-Fatihah: 1");
        expect(result).toHaveLength(1);
        expect(result[0].url).toBe("/quran/surah/Al-Fatihah#ayah-1");
    });

    test("parses QS surah range, anchor uses first ayah", () => {
        const result = parseSource("QS. Ali-Imran: 121-179");
        expect(result).toHaveLength(1);
        expect(result[0].url).toBe("/quran/surah/Ali-Imran#ayah-121");
    });

    test("parses multiple sources separated by semicolon", () => {
        const result = parseSource("HR. Muslim No. 456; QS. Al-Baqarah: 255");
        expect(result).toHaveLength(2);
        expect(result[0].url).toBe("/hadith/muslim/456");
        expect(result[1].url).toBe("/quran/surah/Al-Baqarah#ayah-255");
    });

    test("handles unrecognized source", () => {
        const result = parseSource("Some random text");
        expect(result).toHaveLength(1);
        expect(result[0].url).toBeNull();
        expect(result[0].text).toBe("Some random text");
    });

    test("handles all known hadith books with internal slugs", () => {
        const cases = [
            ["Bukhari", "/hadith/bukhari/1"],
            ["Muslim", "/hadith/muslim/1"],
            ["Abu Dawud", "/hadith/abudaud/1"],
            ["Tirmidzi", "/hadith/tirmidzi/1"],
            ["Ibnu Majah", "/hadith/ibnumajah/1"],
            ["Nasai", "/hadith/nasai/1"],
            ["Ahmad", "/hadith/ahmad/1"],
            ["Malik", "/hadith/malik/1"],
            ["Darimi", "/hadith/darimi/1"],
        ];
        cases.forEach(([name, expected]) => {
            const result = parseSource(`HR. ${name} No. 1`);
            expect(result[0].url).toBe(expected);
        });
    });

    test("handles at-Tirmidzi and an-Nasa'i with diacritics", () => {
        const tirmidzi = parseSource("HR. at-Tirmidzi No. 2914");
        expect(tirmidzi[0].url).toBe("/hadith/tirmidzi/2914");

        const nasai = parseSource("HR. an-Nasa'i No. 75");
        expect(nasai[0].url).toBe("/hadith/nasai/75");
    });

    test("splits ampersand into separate refs", () => {
        const result = parseSource("HR. Bukhari No. 1 & HR. Muslim No. 1907");
        expect(result).toHaveLength(2);
        expect(result[0].url).toBe("/hadith/bukhari/1");
        expect(result[1].url).toBe("/hadith/muslim/1907");
    });

    test("splits comma between hadith refs", () => {
        const result = parseSource("HR. Bukhari No. 1503, HR. Abu Dawud No. 1609");
        expect(result).toHaveLength(2);
        expect(result[0].url).toBe("/hadith/bukhari/1503");
        expect(result[1].url).toBe("/hadith/abudaud/1609");
    });

    test("splits dan conjunction", () => {
        const result = parseSource("HR. Abu Dawud No. 1464 dan HR. at-Tirmidzi No. 2914");
        expect(result).toHaveLength(2);
        expect(result[0].url).toBe("/hadith/abudaud/1464");
        expect(result[1].url).toBe("/hadith/tirmidzi/2914");
    });

    test("accepts HR. without No.", () => {
        const result = parseSource("HR. Bukhari 1");
        expect(result).toHaveLength(1);
        expect(result[0].url).toBe("/hadith/bukhari/1");
        expect(result[0].text).toBe("HR. Bukhari No. 1");
    });
});

describe("SourceBadges", () => {
    test("renders null for empty source", () => {
        const { container } = render(<SourceBadges />);
        expect(container.innerHTML).toBe("");
    });

    test("renders internal link for hadith source", () => {
        render(<SourceBadges source='HR. Bukhari No. 1' />);
        const link = screen.getByText("HR. Bukhari No. 1");
        expect(link.tagName).toBe("A");
        expect(link.getAttribute("href")).toBe("/hadith/bukhari/1");
    });

    test("renders internal link for quran source", () => {
        render(<SourceBadges source='QS. Al-Fatihah: 1' />);
        const link = screen.getByText("QS. Al-Fatihah: 1");
        expect(link.getAttribute("href")).toBe(
            "/quran/surah/Al-Fatihah#ayah-1",
        );
    });

    test("renders plain text for unrecognized source", () => {
        render(<SourceBadges source='Unknown reference' />);
        const el = screen.getByText("Unknown reference");
        expect(el.tagName).toBe("SPAN");
    });

    test("renders multiple internal links for compound source", () => {
        const { container } = render(
            <SourceBadges source='HR. Bukhari No. 1503; QS. Al-Baqarah: 255' />,
        );
        const links = container.querySelectorAll("a");
        expect(links).toHaveLength(2);
        expect(links[0].getAttribute("href")).toBe("/hadith/bukhari/1503");
        expect(links[1].getAttribute("href")).toBe(
            "/quran/surah/Al-Baqarah#ayah-255",
        );
    });
});