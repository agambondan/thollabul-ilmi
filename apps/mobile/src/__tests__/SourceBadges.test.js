import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import SourceBadges, { parseSourceMobile } from "../components/SourceBadges";

describe("parseSourceMobile", () => {
    it("parses single hadith reference correctly", () => {
        const refs = parseSourceMobile("HR. Bukhari No. 1");
        expect(refs).toEqual([
            {
                text: "HR. Bukhari No. 1",
                tab: "hadith",
                params: { bookSlug: "bukhari", hadithNumber: 1, hadithId: 1 },
            },
        ]);
    });

    it("parses single Quran reference with known surah name", () => {
        const refs = parseSourceMobile("QS. Al-Baqarah: 255");
        expect(refs).toEqual([
            {
                text: "QS. Al-Baqarah: 255",
                tab: "quran",
                params: { surahNumber: 2, ayahNumber: 255 },
            },
        ]);
    });

    it("parses compound references with delimiter", () => {
        const refs = parseSourceMobile(
            "HR. Bukhari No. 1514; HR. Muslim No. 1218; QS. Al-Baqarah: 198",
        );
        expect(refs).toHaveLength(3);
        expect(refs[0].tab).toBe("hadith");
        expect(refs[0].params.hadithNumber).toBe(1514);
        expect(refs[1].tab).toBe("hadith");
        expect(refs[1].params.hadithNumber).toBe(1218);
        expect(refs[2].tab).toBe("quran");
        expect(refs[2].params.surahNumber).toBe(2);
        expect(refs[2].params.ayahNumber).toBe(198);
    });

    it("falls back to plain text for non-canonical source", () => {
        const refs = parseSourceMobile("Kitab Al-Umm");
        expect(refs).toEqual([
            {
                text: "Kitab Al-Umm",
                tab: null,
                params: null,
            },
        ]);
    });
});

describe("SourceBadges component", () => {
    it("renders clickable badge and triggers onOpenTab", () => {
        const onOpenTab = jest.fn();
        const { getByText } = render(
            <SourceBadges
                source="HR. Muslim No. 1218"
                onOpenTab={onOpenTab}
            />,
        );
        const badge = getByText("HR. Muslim No. 1218");
        expect(badge).toBeTruthy();
        fireEvent.press(badge);
        expect(onOpenTab).toHaveBeenCalledWith("hadith", {
            bookSlug: "muslim",
            hadithNumber: 1218,
            hadithId: 1218,
        });
    });

    it("renders nothing when source is empty", () => {
        const { toJSON } = render(<SourceBadges source="" />);
        expect(toJSON()).toBeNull();
    });
});
