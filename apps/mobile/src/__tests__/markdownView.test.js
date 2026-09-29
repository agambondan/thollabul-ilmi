import { fireEvent, render } from "@testing-library/react-native";
import { Linking } from "react-native";
import {
    MarkdownView,
    parseMarkdownBlocks,
} from "../components/MarkdownView";

describe("MarkdownView", () => {
    test("parseMarkdownBlocks parses headings, quotes, lists, code, and paragraphs", () => {
        const raw = [
            "# Judul Utama",
            "## Sub Judul",
            "> Kutipan hadis",
            "- Poin satu",
            "- Poin dua",
            "1. Langkah pertama",
            "2. Langkah kedua",
            "```javascript",
            "console.log('test');",
            "```",
            "---",
            "Paragraf biasa dengan teks.",
        ].join("\n");

        const blocks = parseMarkdownBlocks(raw);
        expect(blocks[0]).toEqual({ type: "heading", level: 1, text: "Judul Utama" });
        expect(blocks[1]).toEqual({ type: "heading", level: 2, text: "Sub Judul" });
        expect(blocks[2]).toEqual({ type: "blockquote", text: "Kutipan hadis" });
        expect(blocks[3]).toEqual({ type: "ul", items: ["Poin satu", "Poin dua"] });
        expect(blocks[4]).toEqual({
            type: "ol",
            items: [
                { num: "1", text: "Langkah pertama" },
                { num: "2", text: "Langkah kedua" },
            ],
        });
        expect(blocks[5]).toEqual({
            type: "code",
            lang: "javascript",
            code: "console.log('test');",
        });
        expect(blocks[6]).toEqual({ type: "hr" });
        expect(blocks[7]).toEqual({
            type: "p",
            text: "Paragraf biasa dengan teks.",
        });
    });

    test("parseMarkdownBlocks sanitizes HTML wrappers and tags", () => {
        const raw = '<div class="blog-content" id="article-1"><h2 id="point">Poin Penting</h2><p>Teks <strong>tebal</strong> dan <em>miring</em></p></div>';
        const blocks = parseMarkdownBlocks(raw);
        expect(blocks.some((b) => b.type === "heading" && b.text === "Poin Penting")).toBe(true);
    });

    test("renders headings and inline formatting", () => {
        const content = [
            "## Keutamaan Al-Quran",
            "Membaca Al-Quran adalah **ibadah agung** dan *membawa syafaat*.",
            "Kunjungi [Al-Fatihah](/quran/1) sekarang.",
        ].join("\n\n");

        const { getByText } = render(<MarkdownView content={content} />);
        expect(getByText("Keutamaan Al-Quran")).toBeTruthy();
        expect(getByText("ibadah agung")).toBeTruthy();
        expect(getByText("membawa syafaat")).toBeTruthy();
        expect(getByText("Al-Fatihah")).toBeTruthy();
    });

    test("triggers onLinkPress when a link is pressed", () => {
        const onLinkPress = jest.fn();
        const content = "Lihat [QS. Fathir](/quran/35#29)";
        const { getByText } = render(
            <MarkdownView content={content} onLinkPress={onLinkPress} />,
        );

        fireEvent.press(getByText("QS. Fathir"));
        expect(onLinkPress).toHaveBeenCalledWith("/quran/35#29");
    });

    test("falls back to Linking.openURL when onLinkPress not provided", () => {
        const spy = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
        const content = "Lihat [Web](https://thollabul-ilmi.com)";
        const { getByText } = render(<MarkdownView content={content} />);

        fireEvent.press(getByText("Web"));
        expect(spy).toHaveBeenCalledWith("https://thollabul-ilmi.com");
        spy.mockRestore();
    });

    test("renders dark theme without crashing", () => {
        const content = [
            "# Judul",
            "> Kutipan",
            "- Poin",
            "1. Nomor",
            "`inline code`",
            "```bash\necho 1\n```",
        ].join("\n");

        const { getByTestId } = render(
            <MarkdownView content={content} isDark={true} testID='dark-md' />,
        );
        expect(getByTestId("dark-md")).toBeTruthy();
    });

    test("renders link inside emphasis (nested markdown)", () => {
        const onLinkPress = jest.fn();
        const content = "*([HR. Muslim no. 244](/hadith/muslim/244))*";
        const { getByText } = render(
            <MarkdownView content={content} onLinkPress={onLinkPress} />,
        );

        expect(getByText("HR. Muslim no. 244")).toBeTruthy();
        fireEvent.press(getByText("HR. Muslim no. 244"));
        expect(onLinkPress).toHaveBeenCalledWith("/hadith/muslim/244");
    });
});
