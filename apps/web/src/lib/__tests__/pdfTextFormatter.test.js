import {
    parseExtractedText,
    blocksToMarkdown,
    formatExtractedTextAsMarkdown,
} from "../pdfTextFormatter";

describe("pdfTextFormatter", () => {
    const sampleText = `Dengan nama Allah Yang Maha Pengasih lagi Maha Penyayang
Segala puji bagi Allah Tuhan semesta alam, dan tidak ada permusuhan kecuali terhadap orang-orang zalim. Shalawat dan salam atas junjungan kami Muhammad.

Adapun setelahnya, maka ini adalah kitab yang memuat pembahasan ringkasan tentang dosa-dosa besar.

DOSA-DOSA BESAR
Dosa-dosa besar adalah apa yang dilarang oleh Allah dan Rasul-Nya dalam Al-Qur'an dan Sunnah. Allah Ta'ala telah berjanji dalam kitab-Nya:
"Jika kamu menjauhi dosa-dosa besar di antara apa yang dilarang kepadamu, niscaya Kami hapus kesalahan-kesalahanmu dan Kami masukkan kamu ke tempat yang mulia." (An-Nisa: 37)

Allah Ta'ala berfirman:
"Dan orang-orang yang menjauhi dosa-dosa besar dan perbuatan keji, dan apabila mereka marah mereka memberi maaf." (Asy-Syura: 37)

1. Syirik kepada Allah
2. Membunuh jiwa
3. Sihir

إِنَّ اللَّهَ لَا يَغْفِرُ أَن يُشْرَكَ بِهِ`;

    test("parseExtractedText detects headings, quotes, lists, arabic, and paragraphs", () => {
        const blocks = parseExtractedText(sampleText);
        expect(blocks.length).toBeGreaterThan(0);

        const headingBlock = blocks.find((b) => b.type === "heading");
        expect(headingBlock).toBeDefined();
        expect(headingBlock.text).toBe("DOSA-DOSA BESAR");

        const quoteBlock = blocks.find((b) => b.type === "quote");
        expect(quoteBlock).toBeDefined();
        expect(quoteBlock.citation).toBeTruthy();

        const listBlock = blocks.find((b) => b.type === "list");
        expect(listBlock).toBeDefined();
        expect(listBlock.items.length).toBe(3);

        const arabicBlock = blocks.find((b) => b.type === "arabic");
        expect(arabicBlock).toBeDefined();
    });

    test("blocksToMarkdown formats blocks into valid Markdown", () => {
        const blocks = parseExtractedText(sampleText);
        const md = blocksToMarkdown(blocks, 7, "Al-Kaba'ir");

        expect(md).toContain("<!-- Halaman 7 - Al-Kaba'ir -->");
        expect(md).toContain("## DOSA-DOSA BESAR");
        expect(md).toContain("> ");
        expect(md).toContain("```arabic");
        expect(md).toContain("1. Syirik kepada Allah");
    });

    test("formatExtractedTextAsMarkdown handles empty and edge cases gracefully", () => {
        expect(formatExtractedTextAsMarkdown("")).toBe("");
        expect(formatExtractedTextAsMarkdown("   ")).toBe("");
        expect(formatExtractedTextAsMarkdown(null)).toBe("");
    });
});
