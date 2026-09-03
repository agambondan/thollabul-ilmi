import {
    renderBlogContent,
    extractHeadings,
    calculateReadStats,
    slugifyHeading,
} from "../blogContent";

describe("blogContent utility", () => {
    test("slugifyHeading creates clean slugs", () => {
        expect(slugifyHeading("Pengantar Fiqih & Sunnah!")).toBe(
            "pengantar-fiqih-sunnah",
        );
    });

    test("calculateReadStats returns words and minutes", () => {
        const text = "Satu dua tiga empat lima enam tujuh delapan sembilan sepuluh.";
        const stats = calculateReadStats(text);
        expect(stats.words).toBe(10);
        expect(stats.minutes).toBe(1);
    });

    test("renderBlogContent converts markdown headings, lists, blockquotes", () => {
        const md = `# Title
## Subheading
This is **bold** and *italic* and \`code\`.

> Quote text

- Item 1
- Item 2

\`\`\`js
console.log("hello");
\`\`\`
`;
        const html = renderBlogContent(md);
        expect(html).toContain('<h1 id="title">Title</h1>');
        expect(html).toContain('<h2 id="subheading">Subheading</h2>');
        expect(html).toContain("<strong>bold</strong>");
        expect(html).toContain("<em>italic</em>");
        expect(html).toContain("<code>code</code>");
        expect(html).toContain("<blockquote>Quote text</blockquote>");
        expect(html).toContain("<ul>");
        expect(html).toContain("<li>Item 1</li>");
        expect(html).toContain("<pre><code class=\"language-js\">");
    });

    test("extractHeadings finds h2 and h3 from rendered HTML", () => {
        const html = `<h2 id="intro">Pendahuluan</h2><p>text</p><h3 id="detail">Detail Bab</h3>`;
        const headings = extractHeadings(html);
        expect(headings).toHaveLength(2);
        expect(headings[0]).toEqual({
            id: "intro",
            text: "Pendahuluan",
            level: 2,
        });
        expect(headings[1]).toEqual({
            id: "detail",
            text: "Detail Bab",
            level: 3,
        });
    });

    test("sanitizeBlogHtml removes dangerous scripts", () => {
        const dangerous = `<p>Safe</p><script>alert('xss')</script><a href="javascript:alert(1)">bad</a>`;
        const html = renderBlogContent(dangerous);
        expect(html).not.toContain("<script>");
        expect(html).not.toContain("javascript:");
        expect(html).toContain("Safe");
    });
});
